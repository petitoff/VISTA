import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  Query,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createReadStream } from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { StreamService } from './stream.service';

@Controller('stream')
export class StreamController {
  private readonly logger = new Logger(StreamController.name);

  constructor(private readonly streamService: StreamService) {}

  /**
   * Original stream - for browser-compatible codecs (H.264, VP9)
   * Supports Range requests for seeking
   */
  @Get('raw/*path')
  async streamRaw(
    @Param('path') path: string | string[],
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const videoPath = Array.isArray(path) ? path.join('/') : path;

    try {
      const videoInfo = await this.streamService.getVideoInfo(videoPath);
      const rangeHeader = req.headers.range;

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
        if (match) {
          const start = parseInt(match[1], 10);
          const end = match[2] ? parseInt(match[2], 10) : videoInfo.size - 1;

          if (start >= videoInfo.size) {
            res.status(416);
            res.setHeader('Content-Range', `bytes */${videoInfo.size}`);
            res.end();
            return;
          }

          const actualEnd = Math.min(end, videoInfo.size - 1);
          const chunkSize = actualEnd - start + 1;

          res.status(206);
          res.setHeader('Content-Length', chunkSize);
          res.setHeader(
            'Content-Range',
            `bytes ${start}-${actualEnd}/${videoInfo.size}`,
          );

          createReadStream(videoInfo.path, { start, end: actualEnd }).pipe(res);
        }
      } else {
        res.setHeader('Content-Length', videoInfo.size);
        createReadStream(videoInfo.path).pipe(res);
      }
    } catch {
      res.status(404).send('Video not found');
    }
  }

  /**
   * Transcoded stream - converts any codec to H.264 on-the-fly
   * Does NOT support Range requests (transcoding is sequential)
   */
  @Get('*path')
  async streamTranscoded(
    @Param('path') path: string | string[],
    @Query('start') startTime: string,
    @Res() res: Response,
  ) {
    const videoPath = Array.isArray(path) ? path.join('/') : path;

    try {
      const videoInfo = await this.streamService.getVideoInfo(videoPath);

      this.logger.log(`Transcoding: ${videoPath}`);

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Transfer-Encoding', 'chunked');

      // Build ffmpeg command
      let command = ffmpeg(videoInfo.path)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions([
          '-preset ultrafast', // Fast encoding for real-time
          '-tune zerolatency', // Minimize latency
          '-movflags frag_keyframe+empty_moov+faststart', // Streamable MP4
          '-pix_fmt yuv420p', // Browser compatibility
          '-crf 23', // Quality (lower = better, 18-28 range)
        ])
        .format('mp4');

      // If start time provided, seek to that position
      if (startTime) {
        const seconds = parseFloat(startTime);
        if (!isNaN(seconds) && seconds > 0) {
          command = command.setStartTime(seconds);
          this.logger.log(`Seeking to ${seconds}s`);
        }
      }

      // Pipe ffmpeg output to response
      const stream = command.pipe();

      stream.on('error', (err) => {
        this.logger.error(`Transcode error: ${err.message}`);
        if (!res.headersSent) {
          res.status(500).send('Transcoding error');
        }
      });

      // Handle client disconnect
      res.on('close', () => {
        this.logger.log('Client disconnected, stopping transcoding');
        command.kill('SIGKILL');
      });

      stream.pipe(res);
    } catch {
      res.status(404).send('Video not found');
    }
  }
}

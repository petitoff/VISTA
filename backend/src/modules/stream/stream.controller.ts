import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  Header,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { StreamService } from './stream.service';

@Controller('stream')
export class StreamController {
  private readonly logger = new Logger(StreamController.name);

  constructor(private readonly streamService: StreamService) {}

  @Get('*path')
  @Header('Accept-Ranges', 'bytes')
  async streamVideo(
    @Param('path') path: string | string[],
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const videoPath = Array.isArray(path) ? path.join('/') : path;

    try {
      const videoInfo = await this.streamService.getVideoInfo(videoPath);
      const rangeHeader = req.headers.range;

      this.logger.log(
        `Stream: size=${videoInfo.size}, range=${rangeHeader || 'none'}`,
      );

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');

      if (rangeHeader) {
        const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);

        if (match) {
          const start = parseInt(match[1], 10);
          // Use requested end or file end - NO LIMIT for moov atom reading
          const end = match[2] ? parseInt(match[2], 10) : videoInfo.size - 1;

          if (start >= videoInfo.size) {
            res.status(416);
            res.setHeader('Content-Range', `bytes */${videoInfo.size}`);
            res.end();
            return;
          }

          const actualEnd = Math.min(end, videoInfo.size - 1);
          const chunkSize = actualEnd - start + 1;

          this.logger.log(
            `206: ${start}-${actualEnd}/${videoInfo.size} (${(chunkSize / 1024 / 1024).toFixed(1)}MB)`,
          );

          res.status(206);
          res.setHeader('Content-Length', chunkSize);
          res.setHeader(
            'Content-Range',
            `bytes ${start}-${actualEnd}/${videoInfo.size}`,
          );

          const stream = createReadStream(videoInfo.path, {
            start,
            end: actualEnd,
            highWaterMark: 1024 * 1024, // 1MB buffer
          });

          stream.on('error', (err) => {
            this.logger.error(`Stream error: ${err.message}`);
          });

          stream.pipe(res);
        } else {
          res.status(416).end();
        }
      } else {
        // No range header - send HEAD-like info, let browser request ranges
        this.logger.log(`No range, returning 200 with Content-Length`);
        res.status(200);
        res.setHeader('Content-Length', videoInfo.size);

        // Don't send body - browser will re-request with Range
        // This helps with large files - browser will use Range requests
        const stream = createReadStream(videoInfo.path, {
          highWaterMark: 1024 * 1024,
        });
        stream.pipe(res);
      }
    } catch (error) {
      this.logger.error(`Not found: ${videoPath}`);
      res.status(404).send('Video not found');
    }
  }
}

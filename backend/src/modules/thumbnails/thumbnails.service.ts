import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { CacheManagerService } from './cache-manager.service';
import { VideosService } from '../videos/videos.service';

@Injectable()
export class ThumbnailsService {
  private readonly logger = new Logger(ThumbnailsService.name);

  constructor(
    private configService: ConfigService,
    private cacheManager: CacheManagerService,
    private videosService: VideosService,
  ) {}

  private getThumbFilename(videoPath: string): string {
    const hash = createHash('md5').update(videoPath).digest('hex');
    return `${hash}.jpg`;
  }

  async getThumbnailPath(videoRelativePath: string): Promise<string> {
    const thumbFilename = this.getThumbFilename(videoRelativePath);
    const cachePath = this.cacheManager.getCachePath();
    const thumbPath = join(cachePath, thumbFilename);

    this.logger.log(`Looking for thumbnail at: ${thumbPath}`);

    try {
      await fs.access(thumbPath);
      await this.cacheManager.updateAccessTime(thumbFilename);
      this.logger.log(`Found existing thumbnail: ${thumbPath}`);
      return thumbPath;
    } catch {
      // Thumbnail doesn't exist, generate it
      this.logger.log(`Generating new thumbnail for: ${videoRelativePath}`);
      return this.generateThumbnail(
        videoRelativePath,
        thumbPath,
        thumbFilename,
      );
    }
  }

  private async generateThumbnail(
    videoRelativePath: string,
    thumbPath: string,
    thumbFilename: string,
  ): Promise<string> {
    const videoPath = this.videosService.getAbsolutePath(videoRelativePath);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          timestamps: ['1'],
          filename: thumbFilename,
          folder: this.cacheManager.getCachePath(),
          size: '320x180',
        })
        .on('end', async () => {
          try {
            const stats = await fs.stat(thumbPath);
            await this.cacheManager.registerFile(thumbFilename, stats.size);
            this.logger.log(`Generated thumbnail: ${thumbFilename}`);
            resolve(thumbPath);
          } catch (err) {
            reject(err);
          }
        })
        .on('error', (err) => {
          this.logger.error(`Failed to generate thumbnail: ${err.message}`);
          reject(err);
        });
    });
  }
}

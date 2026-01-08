import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Worker } from 'worker_threads';
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

    try {
      await fs.access(thumbPath);
      await this.cacheManager.updateAccessTime(thumbFilename);
      return thumbPath;
    } catch {
      this.logger.log(`Generating thumbnail via worker: ${videoRelativePath}`);
      return this.generateThumbnailWithWorker(
        videoRelativePath,
        thumbPath,
        thumbFilename,
      );
    }
  }

  private async generateThumbnailWithWorker(
    videoRelativePath: string,
    thumbPath: string,
    thumbFilename: string,
  ): Promise<string> {
    const videoPath = this.videosService.getAbsolutePath(videoRelativePath);
    const cachePath = this.cacheManager.getCachePath();

    return new Promise((resolve, reject) => {
      // In development, we use the .ts file via ts-node or compiled .js
      // In production, we use the .js file.
      // NestJS builds .ts files to .js in the dist folder.
      const workerPath = join(__dirname, 'thumbnail.worker.js');

      const worker = new Worker(workerPath, {
        workerData: {
          videoPath,
          thumbFilename,
          cachePath,
        },
      });

      worker.on('message', async (message) => {
        if (message.success) {
          try {
            const stats = await fs.stat(thumbPath);
            await this.cacheManager.registerFile(thumbFilename, stats.size);
            this.logger.log(`Worker generated thumbnail: ${thumbFilename}`);
            resolve(thumbPath);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(message.error || 'Worker failed'));
        }
      });

      worker.on('error', (err) => {
        this.logger.error(`Worker error: ${err.message}`);
        reject(err);
      });

      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }
}

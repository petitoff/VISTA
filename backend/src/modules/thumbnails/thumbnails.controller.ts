import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { createReadStream } from 'fs';
import { ThumbnailsService } from './thumbnails.service';
import { CacheManagerService } from './cache-manager.service';

@Controller('thumbnails')
export class ThumbnailsController {
  constructor(
    private readonly thumbnailsService: ThumbnailsService,
    private readonly cacheManager: CacheManagerService,
  ) {}

  @Get('stats')
  async getStats() {
    return this.cacheManager.getCacheStats();
  }

  @Get('*path')
  async getThumbnail(
    @Param('path') path: string | string[],
    @Res() res: Response,
  ) {
    const videoPath = Array.isArray(path) ? path.join('/') : path;
    try {
      const thumbPath =
        await this.thumbnailsService.getThumbnailPath(videoPath);

      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const stream = createReadStream(thumbPath);
      stream.on('error', () => {
        res.status(404).send('Thumbnail not found');
      });
      stream.pipe(res);
    } catch (error) {
      throw new NotFoundException('Thumbnail not available');
    }
  }
}

import { Module } from '@nestjs/common';
import { ThumbnailsController } from './thumbnails.controller';
import { ThumbnailsService } from './thumbnails.service';
import { CacheManagerService } from './cache-manager.service';
import { VideosModule } from '../videos/videos.module';

@Module({
  imports: [VideosModule],
  controllers: [ThumbnailsController],
  providers: [ThumbnailsService, CacheManagerService],
})
export class ThumbnailsModule {}

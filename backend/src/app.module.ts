import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import videosConfig from './config/videos.config';
import { VideosModule } from './modules/videos/videos.module';
import { ThumbnailsModule } from './modules/thumbnails/thumbnails.module';
import { StreamModule } from './modules/stream/stream.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [videosConfig],
    }),
    ScheduleModule.forRoot(),
    VideosModule,
    ThumbnailsModule,
    StreamModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import videosConfig from './config/videos.config';
import { PrismaModule } from './prisma/prisma.module';
import { VideosModule } from './modules/videos/videos.module';
import { ThumbnailsModule } from './modules/thumbnails/thumbnails.module';
import { StreamModule } from './modules/stream/stream.module';
import { CvatModule } from './modules/cvat/cvat.module';
import { JenkinsModule } from './modules/jenkins/jenkins.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ProcessingModule } from './modules/processing/processing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [videosConfig],
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    SettingsModule,
    VideosModule,
    ThumbnailsModule,
    StreamModule,
    CvatModule,
    JenkinsModule,
    ProcessingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }

import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { CvatModule } from '../cvat/cvat.module';
import { ProcessingModule } from '../processing/processing.module';

@Module({
  imports: [CvatModule, ProcessingModule],
  controllers: [VideosController],
  providers: [VideosService],
  exports: [VideosService],
})
export class VideosModule { }

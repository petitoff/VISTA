import { Controller, Get, Query, Param } from '@nestjs/common';
import { VideosService } from './videos.service';
import { BrowseResponseDto, VideoMetadataDto, SearchResultDto } from './dto';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get('browse')
  async browse(@Query('path') path: string = ''): Promise<BrowseResponseDto> {
    return this.videosService.browseDirectory(path);
  }

  @Get('search')
  async search(@Query('q') query: string): Promise<SearchResultDto> {
    if (!query || query.trim().length === 0) {
      return { query: '', total: 0, results: [] };
    }
    return this.videosService.searchVideos(query.trim());
  }

  @Get('metadata/*path')
  async getMetadata(
    @Param('path') path: string | string[],
  ): Promise<VideoMetadataDto> {
    const videoPath = Array.isArray(path) ? path.join('/') : path;
    return this.videosService.getVideoMetadata(videoPath);
  }
}

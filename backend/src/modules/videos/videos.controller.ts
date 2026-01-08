import { Controller, Get, Query, Param } from '@nestjs/common';
import { VideosService } from './videos.service';
import { BrowseResponseDto, VideoMetadataDto, SearchResultDto } from './dto';

@Controller('videos')
export class VideosController {
  constructor(private readonly videosService: VideosService) {}

  @Get('browse')
  async browse(
    @Query('path') path: string = '',
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
  ): Promise<BrowseResponseDto> {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    return this.videosService.browseDirectory(path, pageNum, limitNum);
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

import { Injectable, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import { VideosService } from '../videos/videos.service';

export interface StreamRange {
  start: number;
  end: number;
  size: number;
}

@Injectable()
export class StreamService {
  constructor(private videosService: VideosService) {}

  async getVideoInfo(
    relativePath: string,
  ): Promise<{ path: string; size: number }> {
    const absolutePath = this.videosService.getAbsolutePath(relativePath);

    try {
      const stats = await fs.stat(absolutePath);
      return { path: absolutePath, size: stats.size };
    } catch {
      throw new NotFoundException('Video not found');
    }
  }

  parseRange(
    rangeHeader: string | undefined,
    fileSize: number,
  ): StreamRange | null {
    if (!rangeHeader) return null;

    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (!match) return null;

    const start = match[1] ? parseInt(match[1], 10) : 0;
    const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      return null;
    }

    return { start, end, size: end - start + 1 };
  }
}

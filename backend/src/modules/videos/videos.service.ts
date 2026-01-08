import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { join, basename, dirname, extname } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import {
  BrowseResponseDto,
  BrowseItemDto,
  VideoMetadataDto,
  SearchResultDto,
  SearchItemDto,
} from './dto';

@Injectable()
export class VideosService {
  private readonly rootPath: string;
  private readonly hostPath: string;
  private readonly allowedExtensions: string[];
  private readonly maxSearchResults: number;

  constructor(private configService: ConfigService) {
    this.rootPath = this.configService.get<string>('videos.rootPath')!;
    this.hostPath = this.configService.get<string>('videos.hostPath')!;
    this.allowedExtensions = this.configService.get<string[]>(
      'videos.allowedExtensions',
    )!;
    this.maxSearchResults = this.configService.get<number>(
      'videos.search.maxResults',
    )!;
  }

  private resolvePath(relativePath: string): string {
    const normalized = relativePath.replace(/\.\./g, '');
    return join(this.rootPath, normalized);
  }

  private toHostPath(relativePath: string): string {
    return join(this.hostPath, relativePath);
  }

  private isVideoFile(filename: string): boolean {
    const ext = extname(filename).toLowerCase();
    return this.allowedExtensions.includes(ext);
  }

  async browseDirectory(
    relativePath: string = '',
    page: number = 1,
    limit: number = 50,
  ): Promise<BrowseResponseDto> {
    const absolutePath = this.resolvePath(relativePath);

    try {
      await fs.access(absolutePath);
    } catch {
      throw new NotFoundException(`Path not found: ${relativePath}`);
    }

    const entries = await fs.readdir(absolutePath, { withFileTypes: true });
    const allItems: BrowseItemDto[] = [];

    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;

      const itemPath = join(relativePath, entry.name);

      if (entry.isDirectory()) {
        allItems.push({
          name: entry.name,
          type: 'directory',
          path: itemPath,
          hostPath: this.toHostPath(itemPath),
        });
      } else if (this.isVideoFile(entry.name)) {
        const stats = await fs.stat(join(absolutePath, entry.name));
        allItems.push({
          name: entry.name,
          type: 'video',
          path: itemPath,
          hostPath: this.toHostPath(itemPath),
          size: stats.size,
        });
      }
    }

    // Sort: directories first, then by name
    allItems.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    // Paginate
    const total = allItems.length;
    const totalPages = Math.ceil(total / limit);
    const startIdx = (page - 1) * limit;
    const items = allItems.slice(startIdx, startIdx + limit);

    return {
      path: relativePath,
      hostPath: this.toHostPath(relativePath),
      items,
      page,
      limit,
      total,
      totalPages,
    };
  }

  async searchVideos(query: string): Promise<SearchResultDto> {
    const results: SearchItemDto[] = [];
    const searchLower = query.toLowerCase();

    const searchDir = async (dir: string) => {
      if (results.length >= this.maxSearchResults) return;

      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          if (results.length >= this.maxSearchResults) break;
          if (entry.name.startsWith('.')) continue;

          const fullPath = join(dir, entry.name);
          const relativePath = fullPath.replace(this.rootPath, '').slice(1);

          if (entry.isDirectory()) {
            await searchDir(fullPath);
          } else if (this.isVideoFile(entry.name)) {
            if (entry.name.toLowerCase().includes(searchLower)) {
              results.push({
                name: entry.name,
                path: relativePath,
                hostPath: this.toHostPath(relativePath),
                directory: dirname(relativePath),
              });
            }
          }
        }
      } catch {
        // Skip directories we can't read
      }
    };

    await searchDir(this.rootPath);

    return {
      query,
      total: results.length,
      results,
    };
  }

  async getVideoMetadata(relativePath: string): Promise<VideoMetadataDto> {
    const absolutePath = this.resolvePath(relativePath);

    try {
      await fs.access(absolutePath);
    } catch {
      throw new NotFoundException(`Video not found: ${relativePath}`);
    }

    const stats = await fs.stat(absolutePath);

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(absolutePath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get metadata: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(
          (s) => s.codec_type === 'video',
        );

        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        let fps = 0;
        if (videoStream.r_frame_rate) {
          const [num, den] = videoStream.r_frame_rate.split('/').map(Number);
          fps = den ? Math.round((num / den) * 100) / 100 : num;
        }

        resolve({
          path: relativePath,
          hostPath: this.toHostPath(relativePath),
          filename: basename(absolutePath),
          size: stats.size,
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps,
          codec: videoStream.codec_name || 'unknown',
        });
      });
    });
  }

  getAbsolutePath(relativePath: string): string {
    return this.resolvePath(relativePath);
  }
}

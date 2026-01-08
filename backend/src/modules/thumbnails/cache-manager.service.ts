import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { promises as fs } from 'fs';
import { join } from 'path';

interface CacheMetadata {
  files: Record<string, { lastAccess: number; size: number }>;
}

@Injectable()
export class CacheManagerService implements OnModuleInit {
  private readonly logger = new Logger(CacheManagerService.name);
  private readonly cachePath: string;
  private readonly maxSizeBytes: number;
  private readonly metaFilePath: string;
  private metadata: CacheMetadata = { files: {} };

  constructor(private configService: ConfigService) {
    this.cachePath = this.configService.get<string>(
      'videos.thumbnails.cachePath',
    )!;
    this.maxSizeBytes =
      this.configService.get<number>('videos.thumbnails.maxSizeMb')! *
      1024 *
      1024;
    this.metaFilePath = join(this.cachePath, '.cache-meta.json');
  }

  async onModuleInit() {
    await this.ensureCacheDir();
    await this.loadMetadata();
  }

  private async ensureCacheDir() {
    try {
      await fs.mkdir(this.cachePath, { recursive: true });
    } catch {
      // Directory exists
    }
  }

  private async loadMetadata() {
    try {
      const data = await fs.readFile(this.metaFilePath, 'utf-8');
      this.metadata = JSON.parse(data);
    } catch {
      this.metadata = { files: {} };
    }
  }

  private async saveMetadata() {
    await fs.writeFile(
      this.metaFilePath,
      JSON.stringify(this.metadata, null, 2),
    );
  }

  getCachePath(): string {
    return this.cachePath;
  }

  async registerFile(filename: string, size: number) {
    this.metadata.files[filename] = {
      lastAccess: Date.now(),
      size,
    };
    await this.saveMetadata();
    await this.ensureCacheLimit();
  }

  async updateAccessTime(filename: string) {
    if (this.metadata.files[filename]) {
      this.metadata.files[filename].lastAccess = Date.now();
      await this.saveMetadata();
    }
  }

  private async ensureCacheLimit() {
    const totalSize = Object.values(this.metadata.files).reduce(
      (sum, f) => sum + f.size,
      0,
    );

    if (totalSize <= this.maxSizeBytes) return;

    const bytesToFree = totalSize - this.maxSizeBytes;
    await this.evictOldest(bytesToFree);
  }

  private async evictOldest(bytesToFree: number) {
    const sortedFiles = Object.entries(this.metadata.files).sort(
      ([, a], [, b]) => a.lastAccess - b.lastAccess,
    );

    let freedBytes = 0;
    const filesToRemove: string[] = [];

    for (const [filename, info] of sortedFiles) {
      if (freedBytes >= bytesToFree) break;
      filesToRemove.push(filename);
      freedBytes += info.size;
    }

    for (const filename of filesToRemove) {
      try {
        await fs.unlink(join(this.cachePath, filename));
        delete this.metadata.files[filename];
        this.logger.log(`Evicted cache file: ${filename}`);
      } catch {
        // File might not exist
      }
    }

    await this.saveMetadata();
    this.logger.log(`Cache cleanup: freed ${Math.round(freedBytes / 1024)}KB`);
  }

  @Cron('0 3 * * *')
  async scheduledCleanup() {
    this.logger.log('Running scheduled cache cleanup');
    await this.loadMetadata();

    // Remove entries for files that no longer exist
    const existingFiles = await fs.readdir(this.cachePath);
    const metaFiles = Object.keys(this.metadata.files);

    for (const filename of metaFiles) {
      if (!existingFiles.includes(filename)) {
        delete this.metadata.files[filename];
      }
    }

    await this.saveMetadata();
    await this.ensureCacheLimit();
  }

  async getCacheStats() {
    const totalSize = Object.values(this.metadata.files).reduce(
      (sum, f) => sum + f.size,
      0,
    );
    return {
      filesCount: Object.keys(this.metadata.files).length,
      totalSizeMb: Math.round((totalSize / 1024 / 1024) * 100) / 100,
      maxSizeMb: this.maxSizeBytes / 1024 / 1024,
      usagePercent: Math.round((totalSize / this.maxSizeBytes) * 100),
    };
  }
}

import { registerAs } from '@nestjs/config';
import { join } from 'path';

export default registerAs('videos', () => ({
  rootPath: process.env.VIDEOS_ROOT_PATH || '/data/datasets/raw-recordings',
  // Real host path for displaying to users (in Docker)
  hostPath:
    process.env.VIDEOS_HOST_PATH ||
    process.env.VIDEOS_ROOT_PATH ||
    '/data/datasets/raw-recordings',
  allowedExtensions: ['.mp4'],
  thumbnails: {
    cachePath:
      process.env.THUMBNAILS_CACHE_PATH ||
      join(process.cwd(), '.cache/thumbnails'),
    maxSizeMb: parseInt(process.env.CACHE_MAX_SIZE_MB || '1024', 10),
    cleanupCron: process.env.CACHE_CLEANUP_CRON || '0 3 * * *',
  },
  search: {
    maxResults: 100,
  },
}));

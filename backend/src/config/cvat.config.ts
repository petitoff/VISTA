import { registerAs } from '@nestjs/config';

export default registerAs('cvat', () => ({
    url: process.env.CVAT_URL || 'http://localhost:8080',
    username: process.env.CVAT_USERNAME || '',
    password: process.env.CVAT_PASSWORD || '',
    // Cache task lookups for 5 seconds (short to avoid stale data when collaborating)
    cacheTimeoutMs: parseInt(process.env.CVAT_CACHE_TIMEOUT_MS || '5000', 10),
}));

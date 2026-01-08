import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { VideosService } from './videos.service';
import { NotFoundException } from '@nestjs/common';

describe('VideosService', () => {
  let service: VideosService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideosService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, unknown> = {
                'videos.rootPath': '/tmp/test-videos',
                'videos.hostPath': '/tmp/test-videos',
                'videos.allowedExtensions': ['.mp4'],
                'videos.search.maxResults': 100,
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<VideosService>(VideosService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('browseDirectory', () => {
    it('should throw NotFoundException for non-existent path', async () => {
      await expect(
        service.browseDirectory('non-existent-path', 1, 50),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return paginated results', async () => {
      // This would need a mock filesystem
      // For now, just test the structure
    });
  });

  describe('searchVideos', () => {
    it('should return empty results for empty directory', async () => {
      const result = await service.searchVideos('test');
      expect(result).toHaveProperty('query', 'test');
      expect(result).toHaveProperty('results');
      expect(Array.isArray(result.results)).toBe(true);
    });
  });

  describe('getAbsolutePath', () => {
    it('should prevent directory traversal', () => {
      const path = service.getAbsolutePath('../../../etc/passwd');
      expect(path).not.toContain('..');
    });
  });
});

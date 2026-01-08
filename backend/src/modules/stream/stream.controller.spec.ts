import { Test, TestingModule } from '@nestjs/testing';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';

describe('StreamController', () => {
  let controller: StreamController;
  let streamService: StreamService;

  const mockStreamService = {
    getVideoInfo: jest.fn(),
    parseRange: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StreamController],
      providers: [
        {
          provide: StreamService,
          useValue: mockStreamService,
        },
      ],
    }).compile();

    controller = module.get<StreamController>(StreamController);
    streamService = module.get<StreamService>(StreamService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('parseRange', () => {
    beforeEach(() => {
      mockStreamService.getVideoInfo.mockResolvedValue({
        path: '/test/video.mp4',
        size: 1000000,
      });
    });

    it('should parse valid range header', () => {
      mockStreamService.parseRange.mockReturnValue({
        start: 0,
        end: 999,
        size: 1000,
      });

      const result = mockStreamService.parseRange('bytes=0-999', 1000000);
      expect(result).toEqual({ start: 0, end: 999, size: 1000 });
    });

    it('should handle open-ended range', () => {
      mockStreamService.parseRange.mockReturnValue({
        start: 500,
        end: 999999,
        size: 999500,
      });

      const result = mockStreamService.parseRange('bytes=500-', 1000000);
      expect(result.start).toBe(500);
    });
  });
});

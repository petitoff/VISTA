import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('VISTA API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.enableCors();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/videos/browse (GET)', () => {
    it('should return browse response with pagination', () => {
      return request(app.getHttpServer())
        .get('/videos/browse')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('path');
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('totalPages');
          expect(res.body).toHaveProperty('total');
        });
    });

    it('should accept page and limit params', () => {
      return request(app.getHttpServer())
        .get('/videos/browse?page=1&limit=10')
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.items.length).toBeLessThanOrEqual(10);
        });
    });

    it('should return 404 for non-existent path', () => {
      return request(app.getHttpServer())
        .get('/videos/browse?path=non-existent-folder')
        .expect(404);
    });
  });

  describe('/videos/search (GET)', () => {
    it('should return search results', () => {
      return request(app.getHttpServer())
        .get('/videos/search?q=test')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('query', 'test');
          expect(res.body).toHaveProperty('results');
          expect(res.body).toHaveProperty('total');
        });
    });

    it('should return empty for empty query', () => {
      return request(app.getHttpServer())
        .get('/videos/search?q=')
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(0);
        });
    });
  });

  describe('/stream/* (GET)', () => {
    it('should return 404 for non-existent video', () => {
      return request(app.getHttpServer())
        .get('/stream/non-existent.mp4')
        .expect(404);
    });
  });

  describe('/thumbnails/* (GET)', () => {
    it('should return 404 for non-existent video thumbnail', () => {
      return request(app.getHttpServer())
        .get('/thumbnails/non-existent.mp4')
        .expect(404);
    });
  });
});

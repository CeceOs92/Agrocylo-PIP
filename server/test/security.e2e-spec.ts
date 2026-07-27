import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/setup-app';

const ALLOWED_ORIGIN = 'http://localhost:5173';
const DISALLOWED_ORIGIN = 'http://evil.example.com';

describe('Security hardening (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CORS', () => {
    it('reflects an allowed origin', () => {
      return request(app.getHttpServer())
        .get('/health')
        .set('Origin', ALLOWED_ORIGIN)
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBe(
            ALLOWED_ORIGIN,
          );
        });
    });

    it('rejects a disallowed origin (no ACAO header)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .set('Origin', DISALLOWED_ORIGIN)
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });
  });

  describe('Security headers', () => {
    it('sets standard Helmet security headers', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect((res) => {
          expect(res.headers['x-content-type-options']).toBe('nosniff');
          expect(res.headers['x-dns-prefetch-control']).toBeDefined();
          expect(res.headers['strict-transport-security']).toBeDefined();
        });
    });
  });

  describe('Validation pipe', () => {
    it('accepts a well-formed payload', () => {
      return request(app.getHttpServer())
        .post('/health/ping')
        .send({ message: 'hello' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({ echo: 'hello' });
        });
    });

    it('rejects a malformed payload with 400', () => {
      return request(app.getHttpServer())
        .post('/health/ping')
        .send({ message: 123 })
        .expect(400);
    });

    it('rejects an unexpected extra field with 400', () => {
      return request(app.getHttpServer())
        .post('/health/ping')
        .send({ message: 'hello', extra: 'not allowed' })
        .expect(400);
    });
  });
});

describe('Rate limiting (e2e)', () => {
  let app: INestApplication;
  const previousLimit = process.env.THROTTLE_LIMIT;
  const previousTtl = process.env.THROTTLE_TTL_MS;

  beforeAll(async () => {
    process.env.THROTTLE_LIMIT = '2';
    process.env.THROTTLE_TTL_MS = '60000';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    process.env.THROTTLE_LIMIT = previousLimit;
    process.env.THROTTLE_TTL_MS = previousTtl;
  });

  it('rejects requests beyond the configured limit with 429', async () => {
    const server = app.getHttpServer();

    await request(server).get('/health').expect(200);
    await request(server).get('/health').expect(200);
    await request(server).get('/health').expect(429);
  });
});

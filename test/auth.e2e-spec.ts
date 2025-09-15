import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a new user', async () => {
    const email = `user${Date.now()}@mail.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Secret1!', name: 'User' })
      .expect(201);
    expect(res.body.email).toBe(email);
  });

  it('login with admin from seed', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD || 'Admin@123' })
      .expect(201);
    expect(res.body.access_token).toBeDefined();
  });
});

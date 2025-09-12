import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Booking flow (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let serviceId: number;
  let scheduleId: number;
  let userToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // login as admin
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD || 'Admin@123' })
      .expect(201);
    adminToken = adminLogin.body.access_token;

    // create service (admin)
    const serviceRes = await request(app.getHttpServer())
      .post('/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Haircut', description: 'Basic', price: 50 })
      .expect(201);
    serviceId = serviceRes.body.id;

    // create schedule (admin)
    const now = new Date();
    const start = new Date(now.getTime() + 3600_000); // +1h
    const end = new Date(start.getTime() + 3600_000);
    const scheduleRes = await request(app.getHttpServer())
      .post('/schedules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ serviceId, date: start.toISOString(), startTime: '10:00', endTime: '11:00' })
      .expect(201);
    scheduleId = scheduleRes.body.id;

    // register and login as customer
    const email = `cust${Date.now()}@mail.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'Secret1!', name: 'Customer' })
      .expect(201);
    const userLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'Secret1!' })
      .expect(201);
    userToken = userLogin.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('books an appointment', async () => {
    const res = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ scheduleId })
      .expect(201);
    expect(res.body.id).toBeDefined();
  });
});



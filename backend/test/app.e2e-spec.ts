import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ status: 'ok' });
      });
  });
});

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register - creates user and returns token', async () => {
    const email = `test-${Date.now()}@example.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Test User', email, password: 'password123' })
      .expect(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({ name: 'Test User', email });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body).toHaveProperty('token');
  });

  it('POST /auth/login - returns token for valid credentials', async () => {
    const email = `login-${Date.now()}@example.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Login Test', email, password: 'secret456' })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'secret456' })
      .expect(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(email);
  });

  it('POST /auth/login - 401 for invalid credentials', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'nonexistent@example.com', password: 'wrong' })
      .expect(401);
  });
});

describe('Events (e2e)', () => {
  let app: INestApplication<App>;
  let token: string;
  let userId: string;
  let eventId: string;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);

  beforeAll(async () => {
    app = await createTestApp();
    const registerRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Event Organizer',
        email: `organizer-${Date.now()}@example.com`,
        password: 'password123',
      });
    token = registerRes.body.token;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /events - creates event (auth required)', async () => {
    const res = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'E2E Test Event',
        description: 'Created by e2e test',
        date: tomorrow.toISOString(),
        location: 'Test Location',
        capacity: 10,
        visibility: 'public',
      })
      .expect(201);
    eventId = res.body.id;
    expect(res.body.title).toBe('E2E Test Event');
    expect(res.body.organizerId).toBe(userId);
  });

  it('GET /events - list returns public events when unauthenticated', async () => {
    const res = await request(app.getHttpServer()).get('/events').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    const publicOnly = res.body.every((e: { visibility: string }) => e.visibility === 'public');
    expect(publicOnly).toBe(true);
  });

  it('GET /events/:id - get event details', async () => {
    const res = await request(app.getHttpServer())
      .get(`/events/${eventId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body.id).toBe(eventId);
    expect(res.body.isOrganizer).toBe(true);
  });

  it('POST /events/:id/join - join event', async () => {
    const joinUserRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Joiner',
        email: `joiner-${Date.now()}@example.com`,
        password: 'password123',
      });
    const joinToken = joinUserRes.body.token;
    const res = await request(app.getHttpServer())
      .post(`/events/${eventId}/join`)
      .set('Authorization', `Bearer ${joinToken}`)
      .expect(201);
    expect(res.body.isJoined).toBe(true);
    expect(res.body.participantCount).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /events/:id - only organizer can edit', async () => {
    const otherUserRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Other User',
        email: `other-${Date.now()}@example.com`,
        password: 'password123',
      });
    const otherToken = otherUserRes.body.token;
    await request(app.getHttpServer())
      .patch(`/events/${eventId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hacked Title' })
      .expect(403);
  });

  it('DELETE /events/:id - only organizer can delete', async () => {
    const otherUserRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Deleter',
        email: `deleter-${Date.now()}@example.com`,
        password: 'password123',
      });
    const otherToken = otherUserRes.body.token;
    await request(app.getHttpServer())
      .delete(`/events/${eventId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(403);
  });

  it('GET /events/:id - private event denied for non-participant', async () => {
    const privRes = await request(app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Private Event',
        description: 'Private',
        date: tomorrow.toISOString(),
        location: 'Private',
        visibility: 'private',
      })
      .expect(201);
    const privId = privRes.body.id;
    const otherUserRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'Stranger',
        email: `stranger-${Date.now()}@example.com`,
        password: 'password123',
      });
    await request(app.getHttpServer())
      .get(`/events/${privId}`)
      .set('Authorization', `Bearer ${otherUserRes.body.token}`)
      .expect(403);
  });
});

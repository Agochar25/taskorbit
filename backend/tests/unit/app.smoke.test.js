import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

// No database needed: Prisma is mocked so we can test wiring (middleware, validation, error format).
vi.mock('../../src/config/prisma.js', () => ({
  prisma: {
    user: { findUnique: vi.fn().mockResolvedValue(null) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
  },
}));

const { createApp } = await import('../../src/app.js');
const app = createApp();

describe('app wiring', () => {
  it('serves /health', async () => {
    expect((await request(app).get('/health')).body.status).toBe('ok');
  });
  it('returns the standard error shape for 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(401); // everything under /api except /auth is protected
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });
  it('rejects register with field-level errors before touching the DB', async () => {
    const res = await request(app).post('/api/auth/register').send({ fullName: '', email: 'x', password: '1' });
    expect(res.status).toBe(400);
    expect(Object.keys(res.body.error.details)).toEqual(expect.arrayContaining(['fullName', 'email', 'password']));
  });
  it('rejects malformed JSON cleanly', async () => {
    const res = await request(app).post('/api/auth/login').set('Content-Type', 'application/json').send('{bad');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_JSON');
  });
  it('returns generic credentials error for unknown email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'ghost@test.dev', password: 'whatever1' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });
  it('only allows configured CORS origins', async () => {
    const ok = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    const bad = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(bad.headers['access-control-allow-origin']).toBeUndefined();
  });
  it('rate limits repeated failed logins by IP', async () => {
    let last;
    for (let i = 0; i < 12; i += 1) last = await request(app).post('/api/auth/login').send({ email: 'ghost@test.dev', password: 'whatever1' });
    expect(last.status).toBe(429);
    expect(last.body.error.code).toBe('RATE_LIMITED');
  });
  it('returns 404 for unknown top-level routes', async () => {
    expect((await request(app).get('/nothing')).status).toBe(404);
  });
});

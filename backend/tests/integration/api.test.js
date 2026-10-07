import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { prisma } from '../../src/config/prisma.js';

const app = createApp();
const stamp = Date.now();
const emailA = `a-${stamp}@test.dev`;
const emailB = `b-${stamp}@test.dev`;
const password = 'Passw0rd!x';
let A; let B; let projectA; let taskA;

const auth = (u) => ({ Authorization: `Bearer ${u.accessToken}` });

beforeAll(async () => {
  A = (await request(app).post('/api/auth/register').send({ fullName: 'User A', email: emailA, password })).body;
  B = (await request(app).post('/api/auth/register').send({ fullName: 'User B', email: emailB, password })).body;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { in: [emailA, emailB] } } });
  await prisma.$disconnect();
});

describe('auth', () => {
  it('registers without leaking the password hash', () => {
    expect(A.accessToken).toBeTruthy();
    expect(JSON.stringify(A)).not.toMatch(/passwordHash|\$2[aby]\$/);
  });
  it('stores a bcrypt hash, never the plain password', async () => {
    const row = await prisma.user.findUnique({ where: { email: emailA } });
    expect(row.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(row.passwordHash).not.toContain(password);
  });
  it('rejects duplicate emails (case-insensitive)', async () => {
    const res = await request(app).post('/api/auth/register').send({ fullName: 'X', email: emailA.toUpperCase(), password });
    expect(res.status).toBe(409);
  });
  it('validates input', async () => {
    const res = await request(app).post('/api/auth/register').send({ fullName: '', email: 'bad', password: '1' });
    expect(res.status).toBe(400);
    expect(res.body.error.details).toHaveProperty('email');
  });
  it('logs in and returns /me', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: emailA, password });
    expect(login.status).toBe(200);
    const me = await request(app).get('/api/auth/me').set(auth(login.body));
    expect(me.body.user.email).toBe(emailA);
  });
  it('requires a token on protected routes', async () => {
    expect((await request(app).get('/api/projects')).status).toBe(401);
    expect((await request(app).get('/api/projects').set('Authorization', 'Bearer junk')).status).toBe(401);
  });
  it('rotates refresh tokens and rejects reuse', async () => {
    const r1 = await request(app).post('/api/auth/refresh').send({ refreshToken: A.refreshToken });
    expect(r1.status).toBe(200);
    expect((await request(app).post('/api/auth/refresh').send({ refreshToken: A.refreshToken })).status).toBe(401);
    A = (await request(app).post('/api/auth/login').send({ email: emailA, password })).body;
  });
  it('rate limits repeated failed logins', async () => {
    let last;
    for (let i = 0; i < 8; i += 1) last = await request(app).post('/api/auth/login').send({ email: emailB, password: 'wrong-pass1' });
    expect(last.status).toBe(429);
  });
});

describe('projects & tasks', () => {
  it('creates, reads, updates a project', async () => {
    const created = await request(app).post('/api/projects').set(auth(A)).send({ name: 'Alpha', status: 'IN_PROGRESS', startDate: '2025-01-01', endDate: '2030-01-01' });
    expect(created.status).toBe(201);
    projectA = created.body.data;
    const upd = await request(app).put(`/api/projects/${projectA.id}`).set(auth(A)).send({ description: 'Hello' });
    expect(upd.body.data.description).toBe('Hello');
  });
  it('rejects invalid project payloads', async () => {
    const res = await request(app).post('/api/projects').set(auth(A)).send({ name: 'x', status: 'NOPE', startDate: '2025-02-31' });
    expect(res.status).toBe(400);
  });
  it('creates, filters and completes tasks', async () => {
    const t = await request(app).post('/api/tasks').set(auth(A)).send({ projectId: projectA.id, name: 'Write docs', priority: 'HIGH' });
    expect(t.status).toBe(201);
    taskA = t.body.data;
    await request(app).post('/api/tasks').set(auth(A)).send({ projectId: projectA.id, name: 'Other', priority: 'LOW' });
    const filtered = await request(app).get(`/api/tasks?priority=HIGH&search=docs&projectId=${projectA.id}`).set(auth(A));
    expect(filtered.body.data).toHaveLength(1);
    const done = await request(app).put(`/api/tasks/${taskA.id}`).set(auth(A)).send({ status: 'COMPLETED' });
    expect(done.body.data.completedAt).toBeTruthy();
  });
  it('paginates and sorts', async () => {
    const res = await request(app).get('/api/tasks?limit=1&page=2&sortBy=name&order=asc').set(auth(A));
    expect(res.body.meta).toMatchObject({ page: 2, limit: 1, total: 2, totalPages: 2 });
  });
  it('computes the dashboard for the signed-in user only', async () => {
    const a = await request(app).get('/api/dashboard').set(auth(A));
    expect(a.body.data).toMatchObject({ totalProjects: 1, totalTasks: 2, completedTasks: 1, pendingTasks: 1, projectsInProgress: 1 });
    const b = await request(app).get('/api/dashboard').set(auth(B));
    expect(b.body.data).toMatchObject({ totalProjects: 0, totalTasks: 0 });
  });
});

describe('authorization (user B cannot touch user A data)', () => {
  it('cannot read, update or delete A\'s project', async () => {
    expect((await request(app).get(`/api/projects/${projectA.id}`).set(auth(B))).status).toBe(404);
    expect((await request(app).put(`/api/projects/${projectA.id}`).set(auth(B)).send({ name: 'hacked' })).status).toBe(404);
    expect((await request(app).delete(`/api/projects/${projectA.id}`).set(auth(B))).status).toBe(404);
  });
  it('cannot read, update or delete A\'s task, or add tasks to A\'s project', async () => {
    expect((await request(app).get(`/api/tasks/${taskA.id}`).set(auth(B))).status).toBe(404);
    expect((await request(app).put(`/api/tasks/${taskA.id}`).set(auth(B)).send({ name: 'hacked' })).status).toBe(404);
    expect((await request(app).delete(`/api/tasks/${taskA.id}`).set(auth(B))).status).toBe(404);
    expect((await request(app).post('/api/tasks').set(auth(B)).send({ projectId: projectA.id, name: 'sneaky' })).status).toBe(404);
  });
  it('lists are scoped to the owner', async () => {
    expect((await request(app).get('/api/projects').set(auth(B))).body.data).toHaveLength(0);
    expect((await request(app).get('/api/tasks').set(auth(B))).body.data).toHaveLength(0);
  });
  it('blocks non-admins from admin routes', async () => {
    expect((await request(app).get('/api/admin/users').set(auth(A))).status).toBe(403);
  });
  it('is safe against SQL injection style input', async () => {
    const res = await request(app).get('/api/projects').query({ search: "'; DROP TABLE \"Project\"; --" }).set(auth(A));
    expect(res.status).toBe(200);
    expect((await request(app).get('/api/projects').set(auth(A))).body.data).toHaveLength(1);
  });
  it('deleting a project cascades to its tasks', async () => {
    expect((await request(app).delete(`/api/projects/${projectA.id}`).set(auth(A))).status).toBe(204);
    expect(await prisma.task.count({ where: { projectId: projectA.id } })).toBe(0);
  });
});

import { describe, it, expect } from 'vitest';
import { validateRegister, validateLogin, validateProject, validateTask, validateListQuery, parseDate, dueState } from '@taskorbit/shared';
import { projectHealth } from '../../src/utils/health.js';

describe('validateRegister', () => {
  it('accepts valid input and normalises the email', () => {
    const { value, errors } = validateRegister({ fullName: '  Ada Lovelace ', email: 'ADA@Example.com', password: 'secret123' });
    expect(errors).toBeNull();
    expect(value).toEqual({ fullName: 'Ada Lovelace', email: 'ada@example.com', password: 'secret123' });
  });
  it('rejects bad email, short and weak passwords, empty name', () => {
    const { errors } = validateRegister({ fullName: '   ', email: 'nope', password: 'abc' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'fullName', 'password']);
    expect(validateRegister({ fullName: 'A', email: 'a@b.co', password: 'onlyletters' }).errors.password).toMatch(/number/);
  });
  it('rejects non-object bodies', () => {
    expect(validateRegister(null).errors._).toBeTruthy();
    expect(validateLogin([]).errors._).toBeTruthy();
  });
});

describe('validateProject', () => {
  it('applies defaults on create', () => {
    expect(validateProject({ name: 'Alpha' }).value).toEqual({ name: 'Alpha', status: 'NOT_STARTED' });
  });
  it('rejects invalid enum, impossible date and reversed range', () => {
    const { errors } = validateProject({ name: 'A', status: 'DONE', startDate: '2025-02-31', endDate: 'soon' });
    expect(errors.status).toBeTruthy();
    expect(errors.startDate).toBeTruthy();
    expect(errors.endDate).toBeTruthy();
    expect(validateProject({ name: 'A', startDate: '2025-03-10', endDate: '2025-03-01' }).errors.endDate).toMatch(/before/);
  });
  it('requires a non-empty name and caps length', () => {
    expect(validateProject({ name: '' }).errors.name).toBeTruthy();
    expect(validateProject({ name: 'x'.repeat(121) }).errors.name).toBeTruthy();
  });
  it('partial updates only need one valid field', () => {
    expect(validateProject({ status: 'COMPLETED' }, { partial: true }).value).toEqual({ status: 'COMPLETED' });
    expect(validateProject({}, { partial: true }).errors._).toBeTruthy();
  });
});

describe('validateTask', () => {
  const projectId = '3f1c2a52-6a1f-4c0e-9d57-0d9a7c1d2b11';
  it('requires a valid projectId on create and applies defaults', () => {
    expect(validateTask({ name: 'T' }).errors.projectId).toBeTruthy();
    expect(validateTask({ name: 'T', projectId }).value).toMatchObject({ priority: 'MEDIUM', status: 'PENDING' });
  });
  it('rejects invalid priority/status', () => {
    const { errors } = validateTask({ name: 'T', projectId, priority: 'URGENT', status: 'DONE' });
    expect(errors.priority && errors.status).toBeTruthy();
  });
  it('does not let a partial update change projectId', () => {
    expect(validateTask({ projectId, name: 'x' }, { partial: true }).value).toEqual({ name: 'x' });
  });
});

describe('validateListQuery', () => {
  it('parses defaults', () => {
    expect(validateListQuery({}, 'task').value).toMatchObject({ page: 1, limit: 20, sortBy: 'createdAt', order: 'desc' });
  });
  it('rejects bad sort, limit and filters (incl. SQL-ish input)', () => {
    const { errors } = validateListQuery({ limit: '1000', sortBy: 'name; DROP TABLE', priority: 'x', status: "' OR 1=1" }, 'task');
    expect(Object.keys(errors).sort()).toEqual(['limit', 'priority', 'sortBy', 'status']);
  });
});

describe('helpers', () => {
  it('parseDate handles blanks and invalid values', () => {
    expect(parseDate('')).toEqual({ value: null });
    expect(parseDate('2025-13-01').error).toBeTruthy();
    expect(parseDate(12345).error).toBeTruthy();
  });
  it('dueState classifies dates', () => {
    const now = new Date(2025, 5, 10, 12);
    expect(dueState('2025-06-09', 'PENDING', now)).toBe('overdue');
    expect(dueState('2025-06-10', 'PENDING', now)).toBe('today');
    expect(dueState('2025-06-11', 'PENDING', now)).toBe('tomorrow');
    expect(dueState('2025-06-09', 'COMPLETED', now)).toBe('none');
  });
});

describe('projectHealth', () => {
  const now = new Date('2025-06-15T00:00:00Z');
  const base = { status: 'IN_PROGRESS', startDate: '2025-06-01', endDate: '2025-06-29' };
  it('returns DONE for completed projects', () => {
    expect(projectHealth({ ...base, status: 'COMPLETED' }, { taskCount: 1, completedCount: 1, overdueCount: 0 }, now)).toBe('DONE');
  });
  it('flags overdue tasks as AT_RISK and behind-schedule work too', () => {
    expect(projectHealth(base, { taskCount: 4, completedCount: 2, overdueCount: 1 }, now)).toBe('AT_RISK');
    expect(projectHealth(base, { taskCount: 10, completedCount: 1, overdueCount: 0 }, now)).toBe('AT_RISK');
  });
  it('is ON_TRACK when progress keeps pace and IDLE with no tasks', () => {
    expect(projectHealth(base, { taskCount: 4, completedCount: 2, overdueCount: 0 }, now)).toBe('ON_TRACK');
    expect(projectHealth(base, { taskCount: 0, completedCount: 0, overdueCount: 0 }, now)).toBe('IDLE');
  });
  it('is OVERDUE when the end date has passed', () => {
    expect(projectHealth({ ...base, endDate: '2025-06-10' }, { taskCount: 2, completedCount: 1, overdueCount: 0 }, now)).toBe('OVERDUE');
  });
});

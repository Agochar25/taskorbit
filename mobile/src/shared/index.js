/**
 * Shared contract between backend, web and mobile.
 * Zero dependencies on purpose so Node, Vite and Metro can all import it.
 * The backend runs THESE validators on every request, and the web/mobile
 * forms run the same ones before sending - one source of truth.
 */

export const PROJECT_STATUS = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];
export const TASK_STATUS = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
export const TASK_PRIORITY = ['LOW', 'MEDIUM', 'HIGH'];

export const LABELS = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  ON_TRACK: 'On track',
  AT_RISK: 'At risk',
  OVERDUE: 'Overdue',
  IDLE: 'No tasks yet',
  DONE: 'Done',
};

export const LIMITS = {
  nameMax: 120,
  descriptionMax: 2000,
  passwordMin: 8,
  passwordMax: 72, // bcrypt only uses the first 72 bytes
  fullNameMax: 80,
  pageSizeMax: 100,
};

export const SORT_FIELDS = {
  project: ['createdAt', 'name', 'startDate', 'endDate', 'status'],
  task: ['createdAt', 'name', 'dueDate', 'priority', 'status'],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);
export const isEmail = (v) => typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);

const isBlank = (v) => v === undefined || v === null || v === '';

/** Parses "YYYY-MM-DD" or a full ISO string. Rejects things like 2025-02-31. */
export function parseDate(v) {
  if (isBlank(v)) return { value: null };
  if (typeof v !== 'string') return { error: 'must be a date string (YYYY-MM-DD)' };
  const s = v.trim();
  if (!/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?$/.test(s)) {
    return { error: 'must be a valid date (YYYY-MM-DD)' };
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return { error: 'must be a valid date (YYYY-MM-DD)' };
  if (s.length === 10 && d.toISOString().slice(0, 10) !== s) {
    return { error: 'is not a real calendar date' };
  }
  return { value: d.toISOString() };
}

function finish(value, errors) {
  return Object.keys(errors).length ? { value: null, errors } : { value, errors: null };
}

function checkString(input, key, { required, max, errors, out, label = key }) {
  const raw = input[key];
  if (raw === undefined) {
    if (required) errors[key] = `${label} is required`;
    return;
  }
  if (raw === null && !required) { out[key] = null; return; }
  if (typeof raw !== 'string') { errors[key] = `${label} must be text`; return; }
  const s = raw.trim();
  if (required && s.length === 0) { errors[key] = `${label} cannot be empty`; return; }
  if (s.length > max) { errors[key] = `${label} must be at most ${max} characters`; return; }
  out[key] = s;
}

function checkEnum(input, key, allowed, { errors, out, fallback, partial }) {
  const raw = input[key];
  if (raw === undefined) {
    if (!partial && fallback) out[key] = fallback;
    return;
  }
  if (!allowed.includes(raw)) errors[key] = `${key} must be one of: ${allowed.join(', ')}`;
  else out[key] = raw;
}

function checkDate(input, key, { errors, out }) {
  if (input[key] === undefined) return;
  const r = parseDate(input[key]);
  if (r.error) errors[key] = `${key} ${r.error}`;
  else out[key] = r.value;
}

const asObject = (input) => (input && typeof input === 'object' && !Array.isArray(input) ? input : null);

export function validateRegister(input) {
  const body = asObject(input);
  if (!body) return { value: null, errors: { _: 'Request body must be a JSON object' } };
  const errors = {}; const out = {};
  checkString(body, 'fullName', { required: true, max: LIMITS.fullNameMax, errors, out, label: 'Full name' });
  if (body.email === undefined || typeof body.email !== 'string' || !body.email.trim()) errors.email = 'Email is required';
  else if (!isEmail(body.email.trim())) errors.email = 'Enter a valid email address';
  else out.email = body.email.trim().toLowerCase();
  if (typeof body.password !== 'string' || !body.password) errors.password = 'Password is required';
  else if (body.password.length < LIMITS.passwordMin) errors.password = `Password must be at least ${LIMITS.passwordMin} characters`;
  else if (body.password.length > LIMITS.passwordMax) errors.password = `Password must be at most ${LIMITS.passwordMax} characters`;
  else if (!/[A-Za-z]/.test(body.password) || !/\d/.test(body.password)) errors.password = 'Password needs at least one letter and one number';
  else out.password = body.password;
  return finish(out, errors);
}

export function validateLogin(input) {
  const body = asObject(input);
  if (!body) return { value: null, errors: { _: 'Request body must be a JSON object' } };
  const errors = {}; const out = {};
  if (typeof body.email !== 'string' || !isEmail(body.email.trim())) errors.email = 'Enter a valid email address';
  else out.email = body.email.trim().toLowerCase();
  if (typeof body.password !== 'string' || !body.password) errors.password = 'Password is required';
  else out.password = body.password;
  return finish(out, errors);
}

export function validateProject(input, { partial = false } = {}) {
  const body = asObject(input);
  if (!body) return { value: null, errors: { _: 'Request body must be a JSON object' } };
  const errors = {}; const out = {};
  checkString(body, 'name', { required: !partial || body.name !== undefined, max: LIMITS.nameMax, errors, out, label: 'Project name' });
  checkString(body, 'description', { required: false, max: LIMITS.descriptionMax, errors, out, label: 'Description' });
  checkEnum(body, 'status', PROJECT_STATUS, { errors, out, fallback: 'NOT_STARTED', partial });
  checkDate(body, 'startDate', { errors, out });
  checkDate(body, 'endDate', { errors, out });
  if (out.startDate && out.endDate && out.endDate < out.startDate) errors.endDate = 'End date cannot be before the start date';
  if (partial && Object.keys(out).length === 0 && Object.keys(errors).length === 0) errors._ = 'Provide at least one field to update';
  return finish(out, errors);
}

export function validateTask(input, { partial = false } = {}) {
  const body = asObject(input);
  if (!body) return { value: null, errors: { _: 'Request body must be a JSON object' } };
  const errors = {}; const out = {};
  checkString(body, 'name', { required: !partial || body.name !== undefined, max: LIMITS.nameMax, errors, out, label: 'Task name' });
  checkString(body, 'description', { required: false, max: LIMITS.descriptionMax, errors, out, label: 'Description' });
  checkEnum(body, 'priority', TASK_PRIORITY, { errors, out, fallback: 'MEDIUM', partial });
  checkEnum(body, 'status', TASK_STATUS, { errors, out, fallback: 'PENDING', partial });
  checkDate(body, 'dueDate', { errors, out });
  if (!partial) {
    if (!isUuid(body.projectId)) errors.projectId = 'projectId must be a valid project id';
    else out.projectId = body.projectId;
  }
  if (partial && Object.keys(out).length === 0 && Object.keys(errors).length === 0) errors._ = 'Provide at least one field to update';
  return finish(out, errors);
}

/** Query-string validation for list endpoints (pagination, sorting, filters). */
export function validateListQuery(query, entity) {
  const q = asObject(query) || {};
  const errors = {}; const out = {};
  const page = q.page === undefined ? 1 : Number(q.page);
  const limit = q.limit === undefined ? 20 : Number(q.limit);
  if (!Number.isInteger(page) || page < 1) errors.page = 'page must be a positive integer'; else out.page = page;
  if (!Number.isInteger(limit) || limit < 1 || limit > LIMITS.pageSizeMax) errors.limit = `limit must be between 1 and ${LIMITS.pageSizeMax}`; else out.limit = limit;
  const sortBy = q.sortBy ?? 'createdAt';
  if (!SORT_FIELDS[entity].includes(sortBy)) errors.sortBy = `sortBy must be one of: ${SORT_FIELDS[entity].join(', ')}`; else out.sortBy = sortBy;
  const order = q.order ?? 'desc';
  if (!['asc', 'desc'].includes(order)) errors.order = 'order must be asc or desc'; else out.order = order;
  if (q.search !== undefined) {
    if (typeof q.search !== 'string' || q.search.length > LIMITS.nameMax) errors.search = 'search is invalid';
    else if (q.search.trim()) out.search = q.search.trim();
  }
  if (q.status !== undefined && q.status !== '') {
    const allowed = entity === 'project' ? PROJECT_STATUS : TASK_STATUS;
    if (!allowed.includes(q.status)) errors.status = `status must be one of: ${allowed.join(', ')}`; else out.status = q.status;
  }
  if (entity === 'task') {
    if (q.priority !== undefined && q.priority !== '') {
      if (!TASK_PRIORITY.includes(q.priority)) errors.priority = `priority must be one of: ${TASK_PRIORITY.join(', ')}`; else out.priority = q.priority;
    }
    if (q.projectId !== undefined && q.projectId !== '') {
      if (!isUuid(q.projectId)) errors.projectId = 'projectId must be a valid id'; else out.projectId = q.projectId;
    }
  }
  return finish(out, errors);
}

/** Pure helpers used by the UI on both platforms. */
export function dueState(dueDate, status, now = new Date()) {
  if (!dueDate || status === 'COMPLETED') return 'none';
  const due = new Date(dueDate);
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const diff = Math.round((dueDay - startToday) / 86400000);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff <= 7) return 'soon';
  return 'later';
}

export function formatDate(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export const toDateInput = (iso) => (iso ? String(iso).slice(0, 10) : '');

# TaskOrbit API

Base URL: `http://localhost:4000/api` (local) or `https://<your-backend>/api` (deployed).
Both the web app and the Android app use exactly these endpoints.

- **Auth:** `Authorization: Bearer <accessToken>` on everything except `/auth/*` (register, login, refresh, logout).
- **Format:** JSON in, JSON out. Dates are `YYYY-MM-DD` (or ISO 8601). Enums are upper snake case.
- **Access tokens** live 15 minutes; **refresh tokens** 7 days and rotate on every use.
- **Ownership:** you can only ever see or change your own projects and tasks. Other people's resources return `404`, the same as a missing one.

## Error format

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Some fields are invalid", "details": { "email": "Enter a valid email address" } } }
```

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR`, `INVALID_JSON` | Bad body/query/id (field errors in `details`) |
| 401 | `UNAUTHENTICATED`, `INVALID_TOKEN`, `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`, `INVALID_REFRESH_TOKEN` | Missing/invalid/expired token, wrong password |
| 403 | `FORBIDDEN` | Not an admin |
| 404 | `NOT_FOUND` | Missing **or not yours** |
| 409 | `EMAIL_TAKEN`, `CONFLICT` | Duplicate email |
| 413 | `PAYLOAD_TOO_LARGE` | Body over 100 KB |
| 429 | `RATE_LIMITED` | Too many failed auth attempts (10 per 15 min per IP) |
| 500 | `INTERNAL_ERROR` | Unexpected (details only in server logs) |

Clients treat `TOKEN_EXPIRED` / `INVALID_TOKEN` by calling `/auth/refresh` once; if that fails the user is sent to the login screen with "Your session has expired. Please log in again."

---

## Authentication

### `POST /api/auth/register`
```json
{ "fullName": "Ada Lovelace", "email": "ada@example.com", "password": "Passw0rd!x" }
```
Password: 8-72 chars, at least one letter and one number. Email is unique (case-insensitive).
**201** →
```json
{ "user": { "id": "…", "fullName": "Ada Lovelace", "email": "ada@example.com", "role": "USER", "createdAt": "…" },
  "accessToken": "eyJ…", "refreshToken": "9f2c…", "tokenType": "Bearer", "expiresIn": "15m" }
```

### `POST /api/auth/login`
Body `{ "email", "password" }` → **200** same shape as register. Wrong credentials → **401** `INVALID_CREDENTIALS` (same message whether or not the email exists).

### `POST /api/auth/refresh`
Body `{ "refreshToken" }` → **200** new `accessToken` + new `refreshToken`. The old refresh token is revoked; presenting an already-used one revokes the whole session family.

### `POST /api/auth/logout`
Body `{ "refreshToken" }` → **200** `{ "message": "Logged out" }`. Revokes the refresh token server-side.

### `GET /api/auth/me` 🔒
→ `{ "user": { id, fullName, email, role, createdAt } }`

---

## Projects 🔒

Fields: `name` (required, ≤120), `description` (≤2000), `status` (`NOT_STARTED` | `IN_PROGRESS` | `COMPLETED`), `startDate`, `endDate` (end ≥ start), plus server-managed `id`, `createdAt`, `updatedAt`.

Every project response also includes computed `taskCount`, `completedCount`, `overdueCount`, `progress` (0-100) and **`health`**: `ON_TRACK` | `AT_RISK` | `OVERDUE` | `IDLE` | `DONE`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/projects` | Query: `search` (name, case-insensitive), `status`, `sortBy` (`createdAt` `name` `startDate` `endDate` `status`), `order` (`asc`/`desc`), `page`, `limit` (1-100, default 20). → `{ data: [...], meta: { page, limit, total, totalPages } }` |
| GET | `/api/projects/:id` | → `{ data: project }` |
| POST | `/api/projects` | **201** `{ data: project }` |
| PUT | `/api/projects/:id` | Send only the fields to change. → `{ data: project }` |
| DELETE | `/api/projects/:id` | **204**. Cascades to the project's tasks. |

## Tasks 🔒

Fields: `name` (required, ≤120), `description`, `priority` (`LOW` | `MEDIUM` | `HIGH`, default `MEDIUM`), `status` (`PENDING` | `IN_PROGRESS` | `COMPLETED`, default `PENDING`), `dueDate`, and on create `projectId` (must be one of your projects). `completedAt` is set automatically when status becomes `COMPLETED`.

| Method | Path | Notes |
|---|---|---|
| GET | `/api/tasks` | Query: `projectId`, `search` (name), `status`, `priority`, `sortBy` (`createdAt` `name` `dueDate` `priority` `status`), `order`, `page`, `limit`. Each task includes `project: { id, name }`. |
| GET | `/api/tasks/:id` | → `{ data: task }` |
| POST | `/api/tasks` | **201** `{ data: task }` |
| PUT | `/api/tasks/:id` | Partial update. Mark complete with `{ "status": "COMPLETED" }`. `projectId` cannot be changed. |
| DELETE | `/api/tasks/:id` | **204** |

## Dashboard 🔒

### `GET /api/dashboard`
All numbers are for the signed-in user only.
```json
{ "data": {
  "totalProjects": 3, "totalTasks": 6, "completedTasks": 1,
  "pendingTasks": 4, "projectsInProgress": 1,
  "inProgressTasks": 1, "overdueTasks": 1, "dueTomorrow": 2, "completionRate": 17,
  "openByPriority": { "LOW": 1, "MEDIUM": 2, "HIGH": 2 },
  "focusList": [ { "id": "…", "name": "Design homepage", "dueDate": "…", "project": { "id": "…", "name": "…" } } ],
  "recentActivity": [ { "action": "TASK_COMPLETED", "meta": { "name": "…" }, "createdAt": "…" } ]
} }
```
`pendingTasks` counts tasks whose status is `PENDING`; in-progress work is reported separately as `inProgressTasks`.

## Activity & admin (bonus)

| Method | Path | Access |
|---|---|---|
| GET | `/api/activity?page&limit` | Your own audit trail |
| GET | `/api/admin/users` | `ADMIN` only |
| GET | `/api/admin/audit-logs` | `ADMIN` only |
| PATCH | `/api/admin/users/:id/role` | `ADMIN` only, body `{ "role": "USER" \| "ADMIN" }` |

## Health check
`GET /health` → `{ "status": "ok" }` (no auth; used by hosting platforms).

---

## Quick curl tour

```bash
API=http://localhost:4000/api
TOKEN=$(curl -s $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"demo@taskorbit.test","password":"Demo@12345"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["accessToken"])')

curl -s $API/dashboard -H "Authorization: Bearer $TOKEN"
curl -s "$API/tasks?priority=HIGH&sortBy=dueDate&order=asc" -H "Authorization: Bearer $TOKEN"
```

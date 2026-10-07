# TaskOrbit

Project and task management for **web and Android**, backed by **one** Node/Express API and **one** PostgreSQL database. Register on the web, log in on your phone, and see the same projects and tasks on both.

> Every project gets a **health status** (On track, At risk, Overdue). It compares how far through its schedule a project is with how much work is done, and flags overdue tasks. The dashboard draws each project as a ring (the "orbit map") so you see what needs attention at a glance.

| Part | Stack | Folder |
|---|---|---|
| Backend API | Node.js, Express, Prisma ORM, PostgreSQL, JWT, bcrypt | [`backend/`](backend) |
| Web app | React 18 + Vite + React Router | [`web/`](web) |
| Android app | React Native (Expo), React Navigation, SecureStore | [`mobile/`](mobile) |
| Shared contract | Plain ES module: enums, validators, date helpers (used by all three) | [`shared/`](shared) |

Docs: [API reference](docs/API.md) · [ER diagram / schema](docs/ERD.md)

---

## 1. Run it locally in VS Code (step by step)

**Prerequisites:** Node.js 20+ ([nodejs.org](https://nodejs.org)), Git, and either Docker Desktop **or** a local PostgreSQL 14+. For mobile: an Android phone with *Expo Go*, or Android Studio's emulator.

### Step 1 - Open the project
```bash
git clone <your-repo-url> taskorbit
cd taskorbit
code .            # opens VS Code
```
Open the integrated terminal (**Ctrl + `**).

### Step 2 - Install dependencies (one command for backend + web + shared)
```bash
npm install
```
This also runs `prisma generate` for the backend.

### Step 3 - Start PostgreSQL
Easiest, with Docker:
```bash
docker run -d --name taskorbit-db -p 5432:5432 \
  -e POSTGRES_USER=taskorbit -e POSTGRES_PASSWORD=taskorbit -e POSTGRES_DB=taskorbit \
  postgres:16-alpine
```
No Docker? Create a database yourself: `createdb taskorbit` and use your own credentials in the next step.

### Step 4 - Configure the backend
```bash
cd backend
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```
Open `backend/.env` and set `JWT_ACCESS_SECRET` to a long random value:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
The default `DATABASE_URL` already matches the Docker command above.

### Step 5 - Create the tables and demo data
```bash
npm run db:push             # creates all tables from prisma/schema.prisma
npm run db:seed             # optional: demo@taskorbit.test / admin@taskorbit.test (password Demo@12345)
```

### Step 6 - Run the backend
```bash
npm run dev                 # http://localhost:4000  (check http://localhost:4000/health)
```

### Step 7 - Run the web app (new terminal)
```bash
cd web
cp .env.example .env        # VITE_API_URL=http://localhost:4000
npm run dev                 # http://localhost:5173
```
Log in with the seeded demo user or create an account.

### Step 8 - Run the Android app (new terminal)
```bash
cd mobile
cp .env.example .env
npm install
npx expo install --fix      # aligns every Expo/React Native package to the SDK you installed
npx expo start
```
Set `EXPO_PUBLIC_API_URL` in `mobile/.env` first:

| You run on | Use |
|---|---|
| Android emulator | `http://10.0.2.2:4000` |
| Real phone (same Wi-Fi) | `http://<your PC's LAN IP>:4000` (allow port 4000 in your firewall) |
| Deployed backend | `https://<your-backend-url>` |

Then press **`a`** for the emulator, or scan the QR code with Expo Go. Restart `expo start -c` after changing `.env`.

> Notifications: scheduled reminders work in a built APK / development build. Expo Go has limited notification support on newer SDKs, so test reminders with the APK.

### Everything in Docker instead
```bash
docker compose up --build   # web http://localhost:8080 · API http://localhost:4000
```

---

## 2. Environment variables

### Backend (`backend/.env`)
| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | yes | - | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | yes | - | Signs access tokens (32+ chars in production) |
| `PORT` | no | `4000` | HTTP port |
| `NODE_ENV` | no | `development` | `production` enables JSON logs and the secret-length check |
| `ACCESS_TOKEN_TTL` | no | `15m` | Access token lifetime |
| `REFRESH_TOKEN_TTL_DAYS` | no | `7` | Refresh token lifetime |
| `BCRYPT_ROUNDS` | no | `12` | bcrypt cost factor |
| `CORS_ORIGINS` | yes in prod | `http://localhost:5173` | Comma-separated web origins allowed by CORS |
| `AUTH_RATE_LIMIT_MAX` | no | `10` | Failed auth attempts per IP per window |
| `AUTH_RATE_LIMIT_WINDOW_MIN` | no | `15` | Window length (minutes) |
| `GLOBAL_RATE_LIMIT_MAX` | no | `300` | Requests per IP per minute |
| `SEED_PASSWORD` | no | `Demo@12345` | Password for seeded demo users |

### Web (`web/.env`)
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL, e.g. `https://taskorbit-api.onrender.com` |

### Mobile (`mobile/.env`, or `env` in `mobile/eas.json` for APK builds)
| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend base URL (see table in step 8) |

---

## 3. Deploy (free tiers)

**Database:** create a free PostgreSQL on [Neon](https://neon.tech) or Render and copy its connection string.

**Backend (Render → New Web Service, connect your repo):**
- Root directory: *(repo root)*
- Build command: `npm install --workspace backend --workspace shared`
- Start command: `npm run db:push -w backend && npm start -w backend`
- Env: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `NODE_ENV=production`, `CORS_ORIGINS=https://<your-web-url>`
- Health check path: `/health`. (Free instances sleep when idle; the first request can take ~30 s.)

**Web (Vercel):** import the repo, set **Root Directory** to `web`, keep "include files outside root directory" enabled (the web app imports `../shared`), add `VITE_API_URL=https://<your-backend-url>`. `vercel.json` handles SPA routing. Then put the Vercel URL into the backend's `CORS_ORIGINS`.

**Android APK (Expo EAS):**
```bash
cd mobile
# 1. put your deployed backend URL in eas.json -> build.preview.env.EXPO_PUBLIC_API_URL
npm install -g eas-cli
eas login
eas init                     # links the project to your Expo account
eas build -p android --profile preview     # outputs a downloadable .apk link
```
Install the APK on a phone, log in with the **same** account as the web app.

### Run the mobile app against your deployed backend
Set `EXPO_PUBLIC_API_URL=https://<your-backend-url>` in `mobile/.env`, run `npx expo start -c`, and open it in Expo Go - or install the APK built above. No other change is needed: the app uses the same `/api/*` endpoints as the web.

---

## 4. How the requirements are met

| Requirement | Where |
|---|---|
| Register / login / logout, unique email, bcrypt | `backend/src/controllers/auth.controller.js` (bcryptjs, cost 12) |
| Stay logged in until logout/expiry | 15 min access token + rotating 7-day refresh token; clients refresh silently |
| Projects & tasks CRUD, dashboard, search & filters | `backend/src/controllers`, web `pages/`, mobile `screens/` |
| One backend for both clients | Both call the endpoints in [docs/API.md](docs/API.md); `X-Client` header only labels the audit log |
| Mobile token in Keystore/Keychain | `mobile/src/storage/secure.js` (`expo-secure-store`) |
| Expired token → login screen with message | `mobile/src/api/client.js` + `AuthContext` → login shows "Your session has expired…" |
| No network → clear message | `ApiError('NETWORK')` → "You're offline" screens/banners; saved data still shown |
| Pull-to-refresh | `RefreshControl` on dashboard, projects and task lists |
| Authorization (own data only) | Every query is scoped by `ownerId` / `project.ownerId`; foreign ids return 404 |
| Input validation on the backend | `shared/index.js` validators run in `middleware/validate.js` for **every** request |
| SQL injection | Prisma parameterised queries only; sort fields are whitelisted; no raw SQL |
| Rate limiting on auth | `middleware/rateLimit.js` - 10 failed attempts / 15 min / IP |
| CORS for web domain | `CORS_ORIGINS` allow-list in `app.js` |
| Secrets never in responses | Only `id, fullName, email, role, createdAt` are returned for users; logs redact tokens |
| Logging | `pino` + `pino-http` (pretty in dev, JSON in production) |

### Bonus features
| Bonus | Status |
|---|---|
| Docker support | `docker-compose.yml` + Dockerfiles for backend and web |
| Unit tests | `backend/tests/unit` (validators, project health, app wiring with mocked DB) |
| Integration tests | `backend/tests/integration/api.test.js` (real PostgreSQL; auth, CRUD, ownership, rate limit, SQLi attempt) |
| Pagination & sorting | `page`, `limit`, `sortBy`, `order` on `/projects` and `/tasks`; web pager |
| Audit logs | `AuditLog` table; web **Activity** page; admin audit view |
| Role-based access control | `USER` / `ADMIN`; `/api/admin/*` and the web Admin page |
| CI/CD | `.github/workflows/ci.yml` (tests with a Postgres service + web build) |
| Refresh tokens | Opaque, hashed in DB, rotated on use, reuse detection |
| Push notifications for tasks due tomorrow | Android: local notification scheduled for 9:00 the day before each due date (`mobile/src/notifications.js`). Works offline; no push server needed |
| Offline viewing on mobile | `useCachedFetch` + AsyncStorage cache; offline banner |
| Shared types/validation | `shared/` is imported by backend, web and mobile (copied into mobile by `npm run sync:shared`) |

---

## 5. Tests
```bash
cd backend
npm run test:unit           # no database needed
npm run test:integration    # needs DATABASE_URL pointing at a throwaway database (npx prisma db push first)
npm test                    # both
```
Use a separate database for tests, e.g. `taskorbit_test`; the integration tests create and delete their own users.

---

## 6. Security notes (be ready to explain these)
- Passwords: bcrypt (cost 12); max 72 chars because bcrypt ignores the rest. Login does a dummy hash compare for unknown emails so response time does not reveal which emails exist.
- Access JWT (HS256, 15 min) carries only `sub` and `role`; the user row is re-read on every request, so deleted users lose access immediately.
- Refresh tokens are random, stored as SHA-256, rotated on use; replaying an old one revokes the session family (10 s grace for two tabs refreshing at once).
- 404 (not 403) for other users' resources so ids cannot be probed.
- `helmet` headers, 100 KB body limit, global + auth rate limits, `trust proxy` for correct client IPs behind a host.
- Web keeps the access token in memory and the refresh token in `localStorage` (so a refresh of the page keeps you signed in). The trade-off: an XSS bug could read it. The production-grade fix is an httpOnly cookie for the refresh token; mobile uses the Keystore.

## 7. Project layout
```
taskorbit/
├─ shared/            validators + enums used by every client and the API
├─ backend/           Express API (routes → controllers, middleware, prisma schema, tests)
├─ web/               React + Vite
├─ mobile/            Expo React Native (Android)
├─ docs/              API.md, ERD.md
├─ docker-compose.yml
└─ .github/workflows/ci.yml
```

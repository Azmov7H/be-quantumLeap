# QuantumLeap — Backend (`be-quantumLeap`)

Express + MongoDB API for **QuantumLeap**: authentication, posts/comments, chats/messages, notifications, and user profiles, with real-time updates via Socket.IO and media uploads via Cloudinary.

> **Product name:** the canonical name is **QuantumLeap**. This repository is still called `be-quantumLeap` and the npm package is named `server`; both are legacy names scheduled for migration in `TASK-06-01`. Do not introduce a third name.

The frontend lives in the sibling repository **`QuantumDesk`** (separate repo, separate deployable). Planning documents for the whole remediation live in [`../tasks/`](../tasks/README.md) — start with the [audit report](../tasks/AUDIT-REPORT.md).

## Stack

Express 4 · Mongoose 8 · JWT (`jsonwebtoken`) · bcryptjs · Multer + Cloudinary (`multer-storage-cloudinary`) · Socket.IO 4 · Helmet · CORS · Morgan · `express-rate-limit` · `cookie-parser` (currently unused; required by the cookie-auth migration in `TASK-05-01`)

## Requirements

- Node.js **20, 22, or 24** (verified in [BASELINE-VERIFICATION.md](../tasks/BASELINE-VERIFICATION.md))
- npm (the committed lockfile is `package-lock.json`; untracked `pnpm-lock.yaml` and `pnpm-workspace.yaml` remain pending owner confirmation in `TASK-01-03`)
- A MongoDB instance (the local baseline is standalone 8.0.4, so transactions are unavailable — `TASK-04-03`)

## Getting started

```bash
cp .env.example .env      # then fill in real values
npm ci                    # clean install from package-lock.json
npm start                 # runs `nodemon server.js` (see caveat below)
```

Production-style start (what the baseline verified):

```bash
node server.js
```

The server listens on **`PORT`, default `7000`** (`server.js`: `process.env.PORT || 7000`) and logs `Server running on port <port>`.

> **Caveat:** `npm start` runs **nodemon**, a development watcher — it is not a production start command. This is tracked as `TASK-13-02`, which will split `start` (production, `node server.js`) from `dev` (nodemon).

## Scripts

| Script | Command | Notes |
|---|---|---|
| `npm start` | `nodemon server.js` | Development only; see caveat above |
| `npm test` | `echo "Error: no test specified" && exit 1` | Fails by design — no tests exist yet (`TASK-12-01`) |

There are **no lint or typecheck scripts** in this repository (baseline: NOT AVAILABLE).

## Environment variables

Copy [`.env.example`](.env.example) to `.env`. Only placeholders may ever be committed.

| Variable | Required | Read by | Purpose |
|---|---|---|---|
| `PORT` | no (default `7000`) | `server.js` | HTTP port |
| `NODE_ENV` | no (default unset) | `utils/responseHelper.js`, `middlewares/errorHandler.js` | `development` adds `stack` to error responses |
| `MONGODB_URI` | **yes** | `config/db.js` | Mongo connection string; the process continues to boot if it fails |
| `JWT_SECRET` | **yes** | `services/authService.js`, `middlewares/auth.js` | Signs/verifies bearer tokens |
| `FRONTEND_URL` | **yes** | `server.js` (CORS), `socket.js` (Socket.IO origin) | Must match the frontend origin, e.g. `http://localhost:3000` |
| `CLOUDINARY_CLOUD_NAME` | **yes** for uploads | `config/cloudinary.js` | Media storage |
| `CLOUDINARY_API_KEY` | **yes** for uploads | `config/cloudinary.js` | Media storage |
| `CLOUDINARY_API_SECRET` | **yes** for uploads | `config/cloudinary.js` | Media storage |

## Route prefixes

Mounted in `server.js`:

| Prefix | Router | Notes |
|---|---|---|
| `/api/auth` | `routes/authRoutes.js` | register, login, me, update |
| `/api/posts` | `routes/postRoutes.js` | posts, likes, comments |
| `/api/chats` | `routes/chatRoutes.js` | chat list/create |
| `/api/messages` | `routes/messageRoutes.js` | messages per chat |
| `/api/notifications` | `routes/notificationRoutes.js` | list, read |
| `/api/users` | `routes/userRoutes.js` | profiles, follow/unfollow |

`routes/moderationRoutes.js` exists but is **not mounted**, and it imports `controllers/moderationController.js`, which **does not exist**. The moderation endpoints (`GET /api/moderation/pending`, `PUT /api/moderation/approve/:id`, `PUT /api/moderation/reject/:id`) will fail until the controller is implemented and the router is mounted (`TASK-08-03`).

Error handling: `middlewares/errorHandler.js` is registered after the routers; `middlewares/rateLimiter.js` (`apiLimiter`) is applied to every request. Socket.IO is initialized by `initSocket(server)` in `socket.js`.

### Authentication

Protected routes require `Authorization: Bearer <JWT>`. Admin-only routes additionally check `req.user.role === "admin"`.

> The only token today is a seven-day JWT with no refresh, rotation, or revocation (`TASK-05-01`).

### Route details

Full endpoint-by-endpoint request/response shapes, including the client/server mismatches, are catalogued in [`../tasks/API-CONTRACT-INVENTORY.md`](../tasks/API-CONTRACT-INVENTORY.md) — that document, not this README, is the contract of record. This README intentionally does not duplicate it.

Quick smoke test:

```bash
# Health-style checks verified in the baseline
curl -i http://localhost:7000/api/posts          # 200
curl -i http://localhost:7000/api/auth/me        # 401 without a token
curl -i http://localhost:7000/nonexistent        # 404 (currently Express HTML, not JSON — TASK-03-01)
```

## Known limitations

- `npm start` runs nodemon, not a production process manager (`TASK-13-02`).
- `npm test` exits 1; no tests, lint, or typecheck exist (`TASK-12-01`).
- 404/401 responses are not JSON error envelopes (`TASK-03-01`, `TASK-03-04`).
- Moderation routes are unmounted with a missing controller (`TASK-08-03`).
- No request validation on most routes and no pagination on most lists (`TASK-03-03`).
- The npm audit baseline reports 20 vulnerabilities, including 1 critical (`proxy-addr`) — no upgrade performed (`TASK-13-04`).
- Local MongoDB is standalone, so transactions are unavailable (`TASK-04-03`).

## Related documentation

- [Tasks index](../tasks/README.md) · [Audit report](../tasks/AUDIT-REPORT.md) · [Architecture](../tasks/ARCHITECTURE.md) · [API contract inventory](../tasks/API-CONTRACT-INVENTORY.md) · [Roadmap](../tasks/IMPLEMENTATION-ROADMAP.md)
- [Frontend README](../QuantumDesk/README.md)

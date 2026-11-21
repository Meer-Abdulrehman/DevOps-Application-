# DevOps-Learning-API

A small, production-minded **Task Management REST API**, built as a base project for learning real-world DevOps practices (containerization, CI/CD, cloud deployment, monitoring, ...).

**Stack:** Node.js 22 LTS · Express 5 · TypeScript · MongoDB + Mongoose · Zod · Winston · Jest + Supertest

> Docker, Docker Compose, CI/CD and cloud deployment are **intentionally not included**. You can add them yourself, step by step.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the API](#running-the-api)
- [npm Scripts](#npm-scripts)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Error Format](#error-format)
- [Testing](#testing)
- [Operational Behaviour](#operational-behaviour)
- [Next Steps for DevOps Learning](#next-steps-for-devops-learning)

---

## Features

- CRUD REST API for tasks
- `/health` endpoint with uptime and database status (returns `503` when the DB is down)
- Request validation with **Zod**
- Centralized error handling with consistent JSON error responses
- Request logging with **Winston** (colored output in dev, JSON in production)
- Security headers with **Helmet**, configurable **CORS**
- Configuration from environment variables (validated at startup, app exits if invalid)
- Graceful shutdown on `SIGTERM` / `SIGINT`
- Safe handling of `uncaughtException` and `unhandledRejection`
- Integration tests using an **in-memory MongoDB** (no real database needed)

---

## Prerequisites

| Tool    | Version                         |
| ------- | ------------------------------- |
| Node.js | 22.x LTS (see `.nvmrc`)         |
| npm     | 10.x (bundled with Node 22)     |
| MongoDB | 6.x+ running locally, or a hosted instance such as MongoDB Atlas |

Check your versions:

```bash
node -v   # v22.x.x
npm -v
```

If you use [nvm](https://github.com/nvm-sh/nvm), run `nvm use` in the project root.

> MongoDB is only needed to **run** the API. The tests use an in-memory MongoDB.

---

## Installation

```bash
cd DevOps-Learning-API
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
```

Then edit `.env` and set `MONGODB_URI` to point to your MongoDB instance.

---

## Environment Variables

All configuration comes from environment variables. During local development they are loaded from a `.env` file through `dotenv`. They are validated in [`src/config/env.ts`](src/config/env.ts), and the app **refuses to start** if a required variable is missing or invalid.

| Variable              | Required | Default       | Description                                                            |
| --------------------- | -------- | ------------- | ---------------------------------------------------------------------- |
| `NODE_ENV`            | No       | `development` | `development`, `production` or `test`                                  |
| `PORT`                | No       | `3000`        | Port the HTTP server listens on                                        |
| `MONGODB_URI`         | **Yes**  | –             | MongoDB connection string, e.g. `mongodb://localhost:27017/devops-learning-api` |
| `CORS_ORIGIN`         | No       | `*`           | Allowed origins as a comma-separated list (e.g. `http://a.com,http://b.com`), or `*` for all |
| `LOG_LEVEL`           | No       | `info`        | `error`, `warn`, `info`, `http` or `debug`. Use `http` to see request logs |
| `SHUTDOWN_TIMEOUT_MS` | No       | `10000`       | Maximum time to wait for graceful shutdown before forcing exit         |

> **Never commit `.env`.** It is already listed in `.gitignore`. Only `.env.example`, which contains placeholders, belongs in Git.

---

## Running the API

### Local development (hot reload)

```bash
npm run dev
```

This uses `tsx watch` to run TypeScript directly and restart on file changes.

### Production

```bash
npm run build     # compiles TypeScript into dist/
npm start         # runs node dist/server.js
```

For production, set `NODE_ENV=production`. Logs are then emitted as structured JSON, and stack traces are never included in API responses.

Quick check:

```bash
curl http://localhost:3000/health
```

---

## npm Scripts

| Script                  | Description                                    |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Start in watch mode with `tsx`                 |
| `npm run build`         | Compile TypeScript into `dist/`                |
| `npm start`             | Run the compiled app (`dist/server.js`)        |
| `npm run typecheck`     | Type-check source **and** tests (no output)    |
| `npm run lint`          | Run ESLint                                     |
| `npm run lint:fix`      | Run ESLint and auto-fix problems               |
| `npm test`              | Run the Jest test suite                        |
| `npm run test:coverage` | Run tests with a coverage report               |

---

## Project Structure

```
DevOps-Learning-API/
├── src/
│   ├── config/
│   │   ├── env.ts              # Loads + validates environment variables
│   │   ├── logger.ts           # Winston logger
│   │   └── database.ts         # Mongoose connect/disconnect + status
│   ├── controllers/
│   │   ├── health.controller.ts
│   │   └── task.controller.ts  # HTTP layer: reads req, sends res
│   ├── middleware/
│   │   ├── errorHandler.ts     # 404 handler + centralized error handler
│   │   ├── requestLogger.ts    # Logs each request (method, url, status, duration)
│   │   └── validate.ts         # Generic Zod validation middleware
│   ├── models/
│   │   └── task.model.ts       # Mongoose schema + model
│   ├── routes/
│   │   ├── index.ts            # Mounts /health and /api/tasks
│   │   └── task.routes.ts
│   ├── services/
│   │   └── task.service.ts     # Business logic + DB access
│   ├── utils/
│   │   └── AppError.ts         # Custom operational error class
│   ├── validators/
│   │   └── task.validator.ts   # Zod schemas for request data
│   ├── app.ts                  # Builds the Express app (no listen, no DB) → testable
│   └── server.ts               # Entry point: DB connect, listen, signals, shutdown
├── tests/
│   ├── helpers/db.ts           # In-memory MongoDB helpers
│   ├── setupEnv.ts             # Test env vars
│   ├── health.test.ts
│   └── tasks.test.ts
├── .env.example
├── .gitignore
├── .nvmrc
├── eslint.config.js
├── jest.config.js
├── tsconfig.json               # Build config (src → dist)
├── tsconfig.test.json          # Type-check config including tests
└── package.json
```

**Request flow:** `route → validation middleware → controller → service → model → MongoDB`. Any error that is thrown ends up in the centralized `errorHandler`.

---

## API Reference

Base URL: `http://localhost:3000`

All successful responses have `"success": true`. All error responses use the [error format](#error-format).

### Task object

| Field         | Type   | Notes                                               |
| ------------- | ------ | --------------------------------------------------- |
| `id`          | string | MongoDB ObjectId                                    |
| `title`       | string | Required, 1–200 characters, trimmed                 |
| `description` | string | Optional, up to 2000 characters                     |
| `status`      | string | `pending` (default), `in-progress` or `completed`   |
| `createdAt`   | string | ISO 8601 timestamp                                  |
| `updatedAt`   | string | ISO 8601 timestamp                                  |

---

### `GET /health`

Returns the app status, process uptime (in seconds) and database connection state.

| Status | Meaning                                             |
| ------ | --------------------------------------------------- |
| `200`  | App is healthy and connected to MongoDB             |
| `503`  | Database is not connected (instance not ready)      |

```bash
curl -i http://localhost:3000/health
```

**200 OK**

```json
{
  "status": "ok",
  "uptime": 42,
  "timestamp": "2026-11-21T11:00:00.000Z",
  "database": "connected"
}
```

**503 Service Unavailable**

```json
{
  "status": "error",
  "uptime": 42,
  "timestamp": "2026-11-21T11:00:00.000Z",
  "database": "disconnected"
}
```

---

### `POST /api/tasks`

Creates a task. Unknown fields are rejected.

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Docker", "description": "Write a Dockerfile for this API"}'
```

**201 Created**

```json
{
  "success": true,
  "data": {
    "title": "Learn Docker",
    "description": "Write a Dockerfile for this API",
    "status": "pending",
    "createdAt": "2026-11-21T11:00:00.000Z",
    "updatedAt": "2026-11-21T11:00:00.000Z",
    "id": "6650f1c2a1b2c3d4e5f60718"
  }
}
```

**400 Bad Request** (validation error)

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [{ "field": "title", "message": "Invalid input: expected string, received undefined" }]
  }
}
```

---

### `GET /api/tasks`

Returns all tasks, newest first.

```bash
curl http://localhost:3000/api/tasks
```

**200 OK**

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "title": "Learn Docker",
      "description": "Write a Dockerfile for this API",
      "status": "pending",
      "createdAt": "2026-11-21T11:00:00.000Z",
      "updatedAt": "2026-11-21T11:00:00.000Z",
      "id": "6650f1c2a1b2c3d4e5f60718"
    }
  ]
}
```

---

### `GET /api/tasks/:id`

```bash
curl http://localhost:3000/api/tasks/6650f1c2a1b2c3d4e5f60718
```

**200 OK**

```json
{
  "success": true,
  "data": {
    "title": "Learn Docker",
    "description": "Write a Dockerfile for this API",
    "status": "pending",
    "createdAt": "2026-11-21T11:00:00.000Z",
    "updatedAt": "2026-11-21T11:00:00.000Z",
    "id": "6650f1c2a1b2c3d4e5f60718"
  }
}
```

**404 Not Found**

```json
{ "success": false, "error": { "message": "Task not found" } }
```

**400 Bad Request** (malformed id)

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "details": [{ "field": "id", "message": "Invalid task id" }]
  }
}
```

---

### `PATCH /api/tasks/:id`

Partially updates a task. You must send at least one of `title`, `description` or `status`.

```bash
curl -X PATCH http://localhost:3000/api/tasks/6650f1c2a1b2c3d4e5f60718 \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}'
```

**200 OK**

```json
{
  "success": true,
  "data": {
    "title": "Learn Docker",
    "description": "Write a Dockerfile for this API",
    "status": "in-progress",
    "createdAt": "2026-11-21T11:00:00.000Z",
    "updatedAt": "2026-11-21T11:05:00.000Z",
    "id": "6650f1c2a1b2c3d4e5f60718"
  }
}
```

Errors: `400` (invalid id, empty body or invalid fields), `404` (task not found).

---

### `DELETE /api/tasks/:id`

```bash
curl -i -X DELETE http://localhost:3000/api/tasks/6650f1c2a1b2c3d4e5f60718
```

**204 No Content** (empty body)

Errors: `400` (invalid id), `404` (task not found).

---

## Error Format

Every error response has this shape:

```json
{
  "success": false,
  "error": {
    "message": "Human readable message",
    "details": []
  }
}
```

- `details` is only present for validation errors.
- In `development` mode, `500` errors also include a `stack` field. It is never included in `production`.

| Status | When                                                        |
| ------ | ----------------------------------------------------------- |
| `400`  | Validation failure, malformed JSON, invalid id              |
| `404`  | Task or route not found                                     |
| `500`  | Unexpected server error (logged with its stack trace)       |
| `503`  | `/health` only, when the database is not connected          |

---

## Testing

```bash
npm test
npm run test:coverage
```

- Tests use **Jest** and **Supertest** against the Express app created by `createApp()`. No port is opened.
- A throwaway MongoDB is started with **mongodb-memory-server**, so tests **never connect to a real or production database**.
- On the first run, `mongodb-memory-server` downloads a MongoDB binary (several hundred MB) into `node_modules/.cache`, so the first run takes longer. Later runs are fast.
- The test DB helper passes `runtimeAdapters: { os }` to Mongoose. MongoDB driver v7 loads `os` with a dynamic `import()`, which Jest's CommonJS sandbox does not support. This workaround is only needed in tests.

---

## Operational Behaviour

- **Graceful shutdown:** on `SIGTERM` or `SIGINT` the server stops accepting new connections, waits for in-flight requests to finish, then closes the MongoDB connection and exits. If this takes longer than `SHUTDOWN_TIMEOUT_MS`, the process is forced to exit with code `1`.
- **Crash safety:** an `uncaughtException` or `unhandledRejection` is logged, then the app tries a graceful shutdown and exits with code `1`. A process supervisor (Docker restart policy, systemd, Kubernetes, PM2, ...) should restart it.
- **Fail fast:** if the environment is invalid or MongoDB is unreachable at startup, the process exits with code `1`.
- **Logging:** logs go to stdout/stderr (12-factor style), so containers and log collectors can pick them up. Set `LOG_LEVEL=http` to see per-request logs.

---

## Next Steps for DevOps Learning

Some ideas for what to build on top of this project:

1. Write a multi-stage `Dockerfile` (build → slim runtime image, non-root user).
2. Add `docker-compose.yml` with the API and MongoDB.
3. Use `/health` for container `HEALTHCHECK`s and load balancer health checks.
4. Set up a GitHub Actions pipeline: `npm ci → lint → typecheck → test → build`.
5. Deploy to AWS (ECS/Fargate, EC2 or App Runner) using MongoDB Atlas.
6. Ship the JSON logs to CloudWatch, Loki or ELK.

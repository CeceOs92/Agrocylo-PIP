# Agrocylo PIP — Backend Service

Backend service for the **Agrocylo Production Investment Platform**. Built with
[NestJS](https://nestjs.com/) and TypeScript using a modular, scalable
architecture so that indexing, APIs, analytics, and real-time features can grow
independently.

## Tech Stack

- **Runtime:** Node.js (>= 18)
- **Framework:** NestJS 10
- **Language:** TypeScript
- **Logging:** Pino (via `nestjs-pino`)
- **Config & validation:** `@nestjs/config` + Joi
- **Health checks:** `@nestjs/terminus`

## Project Structure

```
server/
├── src/
│   ├── common/         # Cross-cutting concerns (logging, filters, guards)
│   │   └── logger/
│   ├── config/         # Environment config loading & validation
│   ├── database/       # Database connection, entities, migrations
│   ├── indexer/        # Soroban on-chain event indexing
│   ├── modules/        # Feature modules (e.g. health)
│   │   └── health/
│   ├── services/       # Shared, cross-module services
│   ├── websocket/      # Real-time WebSocket gateways
│   ├── app.module.ts   # Root module
│   └── main.ts         # Application entrypoint
└── test/               # End-to-end tests
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Installation

```bash
cd server
npm install
```

### Environment

Copy the example environment file and adjust values as needed:

```bash
cp .env.example .env
```

| Variable                | Description                                          | Default       |
| ----------------------- | ----------------------------------------------------- | ------------- |
| `NODE_ENV`              | Runtime environment                                    | `development` |
| `PORT`                  | Port the HTTP server listens on                        | `3000`        |
| `LOG_LEVEL`              | Pino log level (`trace`…`fatal`)                       | `info`        |
| `CORS_ALLOWED_ORIGINS`  | Comma-separated allowlist of origins permitted by CORS | _required_    |
| `THROTTLE_TTL_MS`        | Rate-limit window, in ms                               | `60000`       |
| `THROTTLE_LIMIT`         | Max requests per window per client                     | `100`         |

Environment variables are validated on startup; the server fails fast if any
value is missing or invalid.

## Running the App

```bash
# development (watch mode)
npm run dev

# production build
npm run build
npm run start:prod
```

## Health Check

Once running, the service exposes a health endpoint:

```bash
curl http://localhost:3000/health
```

Returns `200 OK` with a JSON payload describing service health.

## Testing

```bash
# unit tests
npm test

# end-to-end tests
npm run test:e2e

# coverage
npm run test:cov
```

## Linting & Formatting

```bash
npm run lint
npm run format
```

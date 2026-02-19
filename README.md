# Backend (Portfolio Generator)

**Overview**
This backend is an Express + TypeScript API that powers the One-Click Portfolio Generator SaaS. It exposes REST endpoints for creating and managing public portfolio profiles, persists data in MongoDB via Mongoose, and includes structured logging, validation, and centralized error handling.

**Current Architecture**
- `src/app.ts` boots Express, applies middleware, and wires routes.
- `src/index.ts` starts the HTTP server and Socket.IO instance.
- `src/bootstrap/*` contains middleware wiring (compression, CORS, security, rate limiting, routes, DB connect).
- `src/modules/portmodel` contains the Portfolio module (controller, service, repository, validation, types).
- `src/database/models` contains Mongoose schemas.
- `src/utils/logging` provides Winston-based loggers.
- `src/utils/global-errors` provides centralized error handling.

**Key Behaviors**
- Consistent API responses: `{ success: boolean; message: string; data?: any }`.
- Async/await only; no business logic in routes.
- Validation uses Zod and rejects unknown fields.
- Errors are handled centrally via `globalErrorHandler`.

**Environment Variables**
- `NODE_ENV`: `development | production | test`.
- `PORT`: server port (default `5001`).
- `MONGODB_URI`: MongoDB connection string (required by `src/bootstrap/database.ts`).

**Scripts**
- `npm run dev`: run with nodemon.
- `npm run build`: compile TypeScript.
- `npm run start`: start compiled output.
- `npm run lint`: run ESLint.
- `npm run test:run`: run Vitest tests.

**Portfolio Module**
Location: `src/modules/portmodel`

- Controller: handles request/response only.
- Service: business logic and orchestration.
- Repository: database access with lean queries for reads.
- Validation: Zod schemas and middleware.
- Types: public DTOs and mapping.

**API Routes**
Base path: `/api/v1`

- `POST /portfolios`
  - Create a portfolio
  - Initializes `views` to `0`
  - Enforces unique `username`
- `GET /portfolios/:username`
  - Fetch a portfolio by username
  - Increments view count (atomically by default)
- `GET /portfolios/check/:username`
  - Check username availability
  - Returns `{ available: boolean }`
- `PATCH /portfolios/:username`
  - Partial update of portfolio fields

**Validation**
- `username` must be 3–50 chars, alphanumeric with `.`, `_`, or `-`.
- `projects` must include at least one entry.
- All URLs are validated with Zod `url()`.

**Logging**
- `logger.general` for info/debug.
- `logger.errors` for error paths.

**Rate Limiting**
Configured in `src/bootstrap/rate-limiting.ts`.
- Current effective window: `60s` (variable names say “hour”, but the math resolves to 60s).
- Limit: `100` requests per window.

**View Count Strategy (High Read Volume)**
By default, view counts are incremented per request using `$inc`.

For extremely high traffic, use the aggregator in `src/modules/portmodel/view-count-aggregator.ts` to batch view increments:

```ts
import logger from "../../utils/logging";
import * as repository from "./portfolio.repository";
import { buildPortfolioService } from "./portfolio.service";
import { createViewCountAggregator } from "./view-count-aggregator";

const viewAggregator = createViewCountAggregator({
  flushIntervalMs: 5000,
  maxBatchSize: 1000,
});

const portfolioService = buildPortfolioService(
  repository,
  logger.general,
  viewAggregator
);
```

This reduces write amplification by batching multiple views into periodic bulk updates.

**Tests**
- Unit tests for service: `src/modules/portmodel/__tests__/portfolio.service.test.ts`.
- Route tests with Supertest: `src/modules/portmodel/__tests__/portfolio.routes.test.ts`.

Run tests:

```bash
npm run test:run
```

**Notes**
- Seeders are wired but currently empty in `src/database/seeders/index.ts`.
- Socket.IO is initialized in `src/index.ts` with permissive CORS.

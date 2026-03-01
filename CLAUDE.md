# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run start:dev          # Start with hot reload (port 8000)
npm run build              # Build (nest build)
npm run start:prod         # Run production build (node dist/main)

# Testing
npm run test               # Run all tests (jest --verbose)
npm run test:watch         # Watch mode
npm run test:e2e           # E2E tests (jest --config ./test/jest-e2e.json)

# Linting
npm run lint               # ESLint with --fix

# Database migrations (TypeORM)
npm run typeorm migration:generate -- src/migration/MigrationName
npm run typeorm migration:run
npm run typeorm migration:revert
```

Pre-commit hook runs Prettier on all files and TypeScript type checking (`tsc --noEmit`) via lint-staged.

## Architecture

**NestJS 10** REST API with PostgreSQL (Supabase-hosted), TypeORM, and LangChain-based AI pipelines.

### Module Structure (`src/modules/`)

Each module follows: `module.ts`, `controller.ts`, `service.ts`, `entity.ts`, `types/`, `mappers/`, `pipes/`. AI-heavy modules have separate `*-ai.service.ts` files.

- **plans/** — Core domain: projects, phases, milestones, tasks. Contains event listeners that trigger AI generation workflows.
- **shaping/** — AI-driven idea shaping/discovery conversation flow.
- **ai/** — LangChain orchestration, OpenAI/Anthropic/Gemini/Groq integrations, streaming responses via SSE.
- **auth/** — Supabase JWT validation via Passport.js. `@AuthUser()` decorator extracts the user. `JwtAuthGuard` applied per-route.
- **checkout/** & **subscriptions/** — Stripe payments, webhooks (raw body parsing), and membership tier gating.
- **users/** — User profiles linked to Supabase UUIDs (`@PrimaryColumn()`, not auto-generated).
- **competitors/** & **auditory/** — AI-powered competitor and audience analysis.
- **timeline/** — Project timeline events.
- **supabase/** — Supabase client for auth and file storage.
- **crypto/** — Symmetric encryption utilities.
- **config/** — ORM config (`ormconfig.ts` for CLI), audio config.

### Key Patterns

- **Event-driven**: `@nestjs/event-emitter` with events like `project.shaping.started`, `project.started`, `project.completed`. Listeners in `plans/listeners/` react to trigger AI generation.
- **Validation**: Zod schemas with custom `ZodValidationPipe` (not class-validator).
- **Custom decorators**: `@AuthUser()` for Supabase user, `@CustomRequest(Pipe)` for request transformation (e.g., `UserPipe` fetches DB user).
- **Exhaustive switches**: `notReachable()` utility for compile-time exhaustiveness checks.
- **Subscription gating**: `MembershipService` checks tier before operations like `canActivateNewProject`.
- **Migrations only**: `synchronize: false` — all schema changes require TypeORM migrations. Migrations auto-run on startup (`migrationsRun: true`).

### Database

PostgreSQL via TypeORM. SSL disabled in `dev` environment, enabled otherwise. Connection via `DATABASE_URL` env var. Key entities: Project, Shaping, Phase, Milestone, Task, User, TimelinePoint, Competitor, Auditory.

### Auth Flow

Client authenticates with Supabase directly → JWT sent as Bearer token → `JwtStrategyService` validates with `SUPABASE_JWT_SECRET` (HS256) → Supabase `getUser()` confirms user exists and is not anonymous.

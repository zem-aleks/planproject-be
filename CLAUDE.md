# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start:dev          # Start with hot reload (port 8000)
npm run build              # Build (nest build)
npm run start:prod         # Run production build (node dist/main)
npm run test               # Run all tests (jest --verbose)
npm run test:watch         # Watch mode
npm run test:e2e           # E2E tests (jest --config ./test/jest-e2e.json)
npx jest --testPathPattern=my-file.spec.ts  # Run a single test file
npm run lint               # ESLint with --fix
npm run typeorm migration:generate -- src/migration/MigrationName
npm run typeorm migration:run
npm run typeorm migration:revert
```

Pre-commit hook runs Prettier and `tsc --noEmit` via lint-staged.

## Patterns & Conventions

All codebase patterns, templates, and conventions are documented in `.claude/codebase-patterns.md`. Read that file before making changes.

## Architecture

NestJS 10 REST API with PostgreSQL (Supabase-hosted), TypeORM, and LangChain AI pipelines.

### Core Domain: Plans

The `plans` module (`src/modules/plans/`) is the heart of the app — a hierarchical project planning system:

**Project → Phases → Milestones → Tasks**

Each level has a CRUD service, an AI service (`*-ai.service.ts`), and a controller. They live in separate subdirectories under `plans/` but share one `PlansModule`.

### Project Soul

A project's "soul" (`project.soul` JSON column) is its AI-generated profile: goals, constraints, assumptions, open questions, workstreams, and decisions. It drives all AI interactions.

- `SoulAiService` generates and updates the soul
- `SoulQueueService` batches changes (answered questions, confirmed assumptions, plan proposals) into a queue, then applies them atomically with `applyQueue()`
- Queues auto-apply after 5 minutes via `@Cron`

### Chat System

`plans/chat/` implements an AI advisor chat with LangChain tool-calling:

- Tools in `chat/tools/` (propose plan updates, load phases/milestones, search chats)
- Proposals flow: AI proposes → user approves → queued in soul queue → applied
- Prompts in `chat/prompts/chat.ts` define role, guidelines, and tool usage rules

### Event-Driven AI Pipelines

`EventEmitter2` with dot-delimited events (`project.started`, `phase.createdForProject`) triggers async AI generation. Listeners in `plans/listeners/` orchestrate multi-step workflows like generating phases then milestones after project activation.

### AI Model Layer

`src/modules/ai/models/models.ts` — `getModel(modelType, temperature)` returns a LangChain chat model. Supports OpenAI, Anthropic, Google, and Groq. AI services use `model.withStructuredOutput(zodSchema)` for typed responses.

## Key Rules

- **Zod** for validation (not class-validator). Use `ZodValidationPipe`.
- **Migrations only** — `synchronize: false`. Never skip migrations.
- **`notReachable()`** for exhaustive switch checks.
- **Relative imports only** — no path aliases.

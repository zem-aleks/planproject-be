# CLAUDE.md

## Commands

```bash
npm run start:dev          # Start with hot reload (port 8000)
npm run build              # Build (nest build)
npm run start:prod         # Run production build (node dist/main)
npm run test               # Run all tests (jest --verbose)
npm run test:watch         # Watch mode
npm run test:e2e           # E2E tests (jest --config ./test/jest-e2e.json)
npm run lint               # ESLint with --fix
npm run typeorm migration:generate -- src/migration/MigrationName
npm run typeorm migration:run
npm run typeorm migration:revert
```

Pre-commit hook runs Prettier and `tsc --noEmit` via lint-staged.

## Patterns & Conventions

All codebase patterns, templates, and conventions are documented in `.claude/codebase-patterns.md`. Read that file before making changes.

## Key Rules

- **Zod** for validation (not class-validator). Use `ZodValidationPipe`.
- **Migrations only** — `synchronize: false`. Never skip migrations.
- **`notReachable()`** for exhaustive switch checks.
- **Relative imports only** — no path aliases.

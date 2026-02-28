# Project Instructions

Agent instructions for the Event Management System — a full-stack monorepo (NestJS + React + PostgreSQL).

---

## Architecture

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, react-big-calendar, axios
- **Backend:** NestJS 11, TypeORM, PostgreSQL, JWT auth, class-validator, Swagger
- **Deployment:** Docker Compose (db, backend, frontend)

Monorepo layout: `frontend/`, `backend/`, `docker-compose.yml`.

---

## Code Style

### General

- Use **TypeScript** for all new code; avoid `any`.
- Prefer **functional components** in React.
- Use **snake_case** for database columns; **camelCase** in TypeScript/API responses.

### Frontend

- **Tailwind CSS** for styling.
- **Zustand** for global state (auth, events).
- **axios** for HTTP; use `extractErrorMessage` from `frontend/src/lib/utils.ts` for API errors.
- Use **AbortController** in `useEffect` fetch logic to cancel requests on unmount.
- Surface errors to users instead of silent catches.
- Use **date-fns** for date formatting; `toLocalDatetimeInput` for datetime-local inputs (timezone-safe).

### Backend

- **class-validator** DTOs for all request bodies; validate at controller level.
- Use **UUID pipes** for route params (e.g. `ParseUUIDPipe`).
- Return explicit types from service/controller methods.
- Use **transactions** for join/leave flows to avoid race conditions.
- Add **@ApiResponse** metadata for Swagger success/error cases.

---

## Patterns to Follow

- **Optimistic updates** for join/leave; revert on API error.
- **Protected routes** redirect unauthenticated users to `/login`.
- **Private events:** only organizer and participants can access; enforce in backend.
- **Event date rule:** create/patch must be tomorrow or later (start-of-day boundary).
- **JWT:** `Authorization: Bearer <token>`; `@Public()` for unauthenticated routes.

---

## Documentation and Libraries

**Use Context7 when implementing code changes.** Before writing code that uses libraries or frameworks:

1. Call `resolve-library-id` with the library name and your question.
2. Call `query-docs` with the resolved ID and your specific query.
3. Use the returned documentation and examples in your implementation.

This applies to: React, NestJS, TypeORM, Zustand, Tailwind, react-big-calendar, axios, date-fns, class-validator, and any other dependency.

---

## Subagents and Skills

### Subagents

- **Implementor** (`/implementor`): Use for turning specs, PRDs, design docs, or API specs into working code. Invoke when implementing features from tickets or building from a given specification.

### Relevant Skills

Invoke when appropriate:

- **fullstack-developer** — features spanning backend, API, and frontend
- **backend-developer** — NestJS APIs, services, TypeORM
- **react-specialist** — React components, state, performance
- **typescript-pro** — type safety, generics, strict typing
- **code-reviewer** — PR review, security, best practices
- **test-automator** — unit, e2e, integration tests
- **api-designer** — REST design, validation, Swagger

---

## Key Files

| Area | Path |
|------|------|
| API client | `frontend/src/lib/api.ts` |
| Auth store | `frontend/src/stores/authStore.ts` |
| Error utils | `frontend/src/lib/utils.ts` |
| Types | `frontend/src/types/index.ts` |
| Events service | `backend/src/events/events.service.ts` |
| Auth module | `backend/src/auth/` |
| Entities | `backend/src/database/entities/` |

---

## Best Practices (from Cursor Rules)

- Keep instructions focused and actionable.
- Reference files instead of copying large blocks.
- Add rules only when patterns repeat; avoid over-optimizing early.
- Prefer small, incremental changes over large refactors.

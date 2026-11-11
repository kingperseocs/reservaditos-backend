# Reservaditos Backend — Rules

## Role
You act as a **senior backend developer** (NestJS + TypeScript + MongoDB). You apply Clean Architecture, SOLID and DDD, write tests for every business rule and keep the API small, predictable and documented. You propose before you assume: if a rule is ambiguous, write the assumption in the README.

## Product goal
Bookings of common areas (grill, multipurpose room, pool) for a fictional building ("Edificio Demo").
- The **resident** (Flutter app) picks an area, a date and a time slot, sees the status of the booking and pays through a link.
- The **administration** (Angular web) approves or rejects requests and suspends areas.
- An **AI endpoint** turns free text («quiero la parrilla el sábado de 7 a 10 pm») into area + date + slot, or returns the question the assistant would ask when data is missing.

Goal: a booking is scheduled at the date and time the resident wants, only if the slot is available.

## Business rules (each one must have unit tests)
1. A resident requests an area for a date and a time slot. Initial status: `PENDING_APPROVAL`.
2. The administration approves first; then the resident pays through a link. If not paid within **24 h**, the booking expires by itself (`EXPIRED`) and the slot is released.
3. If the event starts in **less than 24 h**, the payment deadline is **3 h before the event**: `deadline = min(approvedAt + 24h, eventStart - 3h)`. If that moment has already passed, the request cannot be approved.
4. If two residents request the same slot, **the first one wins** (`requestedAt` order). Only the oldest pending request of a slot can be approved; a slot holds at most one `APPROVED`/`CONFIRMED` booking (enforced by a unique partial index).
5. Only residents **up to date** with their dues can book, with **one day of grace** after the due date.
6. If an area is suspended and there are **paid** bookings in that range, they are **refunded 100 %** (`REFUNDED`); pending/approved ones are rejected with the suspension reason.

Booking state machine:
```
PENDING_APPROVAL ──approve──▶ APPROVED ──pay──▶ CONFIRMED ──area suspended──▶ REFUNDED
        │                         │
        └──reject──▶ REJECTED     └──deadline passed──▶ EXPIRED
```
Any other transition throws a `DomainError`. Payment is **simulated** (no real gateway).

## Architecture
```
src/
  config/                 env validation, swagger
  shared/
    domain/               DomainError, ports (Clock, RandomGenerator, BuildingSettings), value objects (LocalDate, DateRange, TimeSlot)
    infrastructure/       database, SystemClock, exception filter, Swagger error decorator
  modules/<context>/
    domain/               entities, value objects, policies, repository ports (no Nest, no Mongoose)
    application/          use cases (one class per use case), DTO-free inputs/outputs
    infrastructure/       Mongoose schemas, mappers, repository adapters, external clients (AI providers)
    presentation/         controllers, request/response DTOs with Swagger decorators
```
- Dependencies point inward: `presentation → application → domain`; `infrastructure` implements domain ports.
- Domain is pure TypeScript: no decorators, no `Date.now()` (use the `Clock` port), no Mongoose types.
- Controllers only validate, call one use case and map the result. No business logic in controllers or schemas.
- Ports are injected by token (`RESERVATION_REPOSITORY`, `CLOCK`, `INTENT_EXTRACTOR`).
- Bounded contexts: `users` (identity, dues, x-user-id guard), `areas`, `reservations` (booking, availability, payments, suspensions), `assistant` (AI), `health`.
- `reservations` depends on `areas` and `users`; never the other way around.

## AI provider
- The assistant depends on the `IntentExtractor` port, never on a vendor SDK.
- Adapters live in `assistant/infrastructure` (one per provider) and are chosen with `AI_PROVIDER` (`gemini` by default, `anthropic` optional).
- The model only extracts data (area, date, slot). Business validation (does the slot exist, is it free) stays in the domain.
- Tests and CI use a fake extractor: no API keys, no network.

## Conventions
- **All code in English** (names, comments, commits). User-facing messages for the app/web may be in Spanish.
- Package manager: **pnpm**. **Node 26 LTS** (minimum 24.9: Jest needs native `require(esm)` to load NestJS 12). TypeScript strict.
- API is versioned by URI: `http://localhost:8000/v1/...`. Swagger at `/docs`.
- Identity is simulated with the `x-user-id` header (seeded users with role `RESIDENT` or `ADMIN`).
- Time zone `America/Lima` for business dates; store instants in UTC. Use Luxon.
- Errors: domain errors carry a stable `code`; the global filter maps them to `{ statusCode, code, message }`.
- Swagger: one-line `summary` per endpoint, `@ApiProperty` with `example` on every DTO field, document error responses. Concise, no filler text.
- Small files, one responsibility each. Prefer composition and explicit types over `any`.
- Commits: Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`). No AI co-author trailers.

## Testing
- Unit tests (`pnpm test`): domain entities and policies with fixed dates (`test/builders`). One suite per business rule.
- E2E tests (`pnpm test:e2e`): supertest + `mongodb-memory-server` + `FakeClock`, data from `seedDemoData`; the AI port is replaced by a fake.
- CI must not need external services or secrets.

## Pipeline
`.github/workflows/ci.yml` runs on every push and pull request: install (`pnpm install --frozen-lockfile`) → lint → unit tests → e2e tests → build.

## Definition of Done
- Code compiles, lint passes, unit + e2e tests are green.
- New endpoints are documented in Swagger and in the README (`url / method / header / body / response`).
- New assumptions are written in the README "Decisions and assumptions" section.

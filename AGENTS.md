# AGENTS.md — pulpe-api

Instructions for any code agent working in this repo.
If anything here contradicts what you think is the "normal" Node convention, this file wins.

## What this is

Catalog and inventory API for corner stores and mini markets.
**Plain JavaScript (ESM), no TypeScript and no build step.** Node 20+, Fastify, Prisma over SQLite.
The mobile app that consumes it lives in the `pulpe-app` repo.

## Commands

```bash
npm install
npm run setup      # migrates the database and seeds it (run once)
npm run dev        # server at http://localhost:3000
npm test           # vitest
npm run lint       # eslint
```

Before considering any change done: `npm run lint && npm test`.

## API contract

**Non-negotiable rule: the public contract is snake_case.** Query params and response fields.
Prisma uses camelCase internally; the translation happens in `src/schemas/`, never in the routes.

The mobile app is written in Dart, where camelCase is natural. If you send `sortBy` instead of `sort_by`,
the backend responds 422 and the app shows nothing. No compiler catches this: there are no types here,
and on the Dart side param names are just strings.

Current query params for `GET /products`:

| param | type | default | notes |
|---|---|---|---|
| `page` | int > 0 | 1 | |
| `per_page` | int > 0 | 20 | no cap yet, see `TODO(pulpe-812)`; pulpe-app pins `per_page=15` explicitly for its search screen |
| `q` | string | none | case-insensitive substring match on `name`; trimmed, empty after trim = absent |
| `category` | string | none | a `Category.slug`; unknown slug returns an empty page (`total: 0`), not a 422 |

Every paginated response uses the same wrapper, built with `wrapPage()`:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "per_page": 20,
  "has_next": false
}
```

`GET /products` additionally includes a `category_counts` field alongside the wrapper above (built by
spreading `wrapPage()`'s output, never by changing its shape): one entry per existing category, ordered
by name ascending, with `count` reflecting only the current `q` filter — it ignores the `category` query
param, so it never changes when the user switches categories.

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "per_page": 20,
  "has_next": false,
  "category_counts": [
    { "category": { "id": "...", "slug": "...", "name": "..." }, "count": 0 }
  ]
}
```

Every error uses the same format, thrown as `ApiError`:

```json
{ "error": { "code": "invalid_params", "message": "…", "details": {} } }
```

Codes in use: `not_found` (404), `invalid_params` (422), `internal_error` (500).

## Code conventions

- **JavaScript, not TypeScript.** Don't add `.ts`, a `tsconfig`, or a build step. If you want editor help, use JSDoc comments like the ones already in `src/lib/errors.js` and `src/routes/`.
- **Modules:** ESM (`import`/`export`), with an explicit `.js` extension on relative paths. No `require`.
- **Validation:** since there are no compile-time types, **zod is the only defense**. Every query param and every body goes through a schema before touching Prisma. If parsing fails, throw `ApiError.invalidParams()`.
- **Language:** domain identifiers are in English (`product`, `price`, `stock`). Libraries and their APIs stay as they are.
- **Prices:** integers in colón cents. Never floats, never decimals in the database. Formatting is the client's responsibility.
- **Database:** schema changes always go through `npm run db:migrate`. Never edit the database by hand or write raw SQL with interpolated strings.
- **Routes:** one `<resource>Routes` function per file in `src/routes/`, registered in `src/app.js`. No business logic inside the handler beyond orchestration.
- **Errors:** never return stack traces or Prisma messages to the client. That's the handler's job in `src/app.js`.

## Tests

- Vitest with `app.inject()`, no port listening.
- Every new endpoint needs at least two cases: one happy path, one invalid parameters.
- Without types, tests are the main safety net: if you add a field to the contract, add a test that checks its exact name.
- Don't delete or skip a test to make the suite pass. If a test is in your way, say so in the PR.

## What NOT to do

- Don't migrate the project to TypeScript or introduce a build step.
- Don't add dependencies on external services (queues, storage, push providers, third-party APIs). This project runs entirely locally with SQLite, on purpose.
- Don't change the pagination wrapper format or the error format without updating `pulpe-app` in the same change.
- Don't rename public contract fields without migrating the client.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.

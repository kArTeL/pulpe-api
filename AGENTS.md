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
| `per_page` | int > 0 | 20 | no cap yet, see `TODO(pulpe-812)` |

Query params for `GET /products/search`:

| param | type | default | notes |
|---|---|---|---|
| `q` | string, optional | — | case-insensitive substring match against `name`; absent/empty means no text filter |
| `category` | string, optional | — | filters by category `slug` (not id); absent means no category filter |
| `page` | int > 0 | 1 | |
| `per_page` | int > 0 | 15 | no cap yet, see `TODO(pulpe-812)` |

`GET /products/search` returns the standard `wrapPage()` envelope plus a top-level `category_counts`
field: for every category with at least one matching active product, `{ category, count }`, ordered
by category `name` ascending. `count` reflects matches for the text search `q` only, ignoring the
`category` filter itself, so the client can render filter options with counts regardless of the
currently selected category.

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

## 1. Query schema

- [x] 1.1 Extend `listParams` in `src/routes/products.js` with optional `q` (string, trimmed, empty-after-trim → undefined) and optional `category` (non-empty string) fields, leaving `page`/`per_page` unchanged.

## 2. Listing query

- [x] 2.1 Build a shared Prisma `where` clause (`active: true` + optional `name` contains `q` case-insensitively + optional `category: { slug }`) reused by the paginated `findMany` and `count`.
- [x] 2.2 Verify SQLite's Prisma `contains` behaves case-insensitively for ASCII; adjust the query (e.g. explicit `mode: 'insensitive'` or equivalent) only if a manual check shows it isn't.
- [x] 2.3 Confirm an unknown `category` slug naturally yields `items: []`, `total: 0` via the `where` clause (no special-casing needed).

## 3. Category counts

- [x] 3.1 Add a query that returns every category ordered by name ascending, each with a count of active products matching only the `q` filter (ignoring `category`).
- [x] 3.2 Map that result to `{ category: serializeCategory(...), count }` entries.

## 4. Response composition

- [x] 4.1 Compose the route's return value as `{ ...wrapPage(items, { total, page, perPage }), category_counts }`, without changing `wrapPage()`'s signature or shape.

## 5. Documentation

- [x] 5.1 Update `AGENTS.md`'s `GET /products` query param table with `q` and `category`.
- [x] 5.2 Update `AGENTS.md`'s pagination wrapper JSON example to show `category_counts`.

## 6. Tests

- [x] 6.1 Add a test: `q` matches product names (case-insensitive substring).
- [x] 6.2 Add a test: `q` with no matches returns `items: []`, `total: 0`, status 200.
- [x] 6.3 Add a test: `category` filters to a valid slug's products.
- [x] 6.4 Add a test: `category` with an unknown slug returns `items: []`, `total: 0`, status 200 (not 422).
- [x] 6.5 Add a test: `category_counts` reflects `q` but is identical regardless of the `category` param.
- [x] 6.6 Add a test: combining `q` + `category` + `page` narrows and paginates correctly.

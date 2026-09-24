## Context

`pulpe-api` currently exposes `GET /products` (paginated list, default 20/page, no filters beyond pagination) and `GET /categories` (full unpaginated list). Both follow the snake_case contract in AGENTS.md, using `wrapPage()` for pagination and `ApiError` for errors. The database is SQLite via Prisma; there is no full-text search extension configured. Product/category names are real Costa Rican Spanish catalog data and routinely contain accents (e.g. "Café", "Lácteos", "Panadería").

## Goals / Non-Goals

**Goals:**
- Let a client search products by free text and/or filter by category, in one call.
- Keep the page size fixed at 15 for this endpoint regardless of `GET /products`'s default.
- Reuse every existing convention (wrapPage, ApiError, zod validation, snake_case) with zero changes to those shared pieces.

**Non-Goals:**
- Ranked/relevance-scored results (SQLite has no builtin ranking without FTS5, which isn't set up).
- Accent-insensitive or fuzzy matching (see Risks).
- Searching `sku`, or filtering by `stock`/`price` range.
- An FTS5 full-text index — plain `LIKE`-based `contains` is enough at current catalog size and avoids a schema/migration change.
- A `category_counts`/facet-count field in the response. Considered during design but explicitly rejected by the captain: this endpoint returns only the matching page of products, nothing else.

## Decisions

1. **Dedicated endpoint `GET /products/search`, not an extension of `GET /products`.** The page size for search (15, fixed) differs from `GET /products`'s default (20, client-adjustable). Overloading one endpoint with two pagination behaviors depending on which params are present would be confusing and risks the existing `GET /products` contract (its `per_page: 20` default is asserted in `tests/product.test.js`). A new endpoint keeps both contracts simple and independently testable.

2. **Match `name` and `description` via a parameterized `LIKE ... ESCAPE '\'`, built with Prisma's `Prisma.sql`/`$queryRaw` tagged templates, not `contains`.** SQLite's `LIKE` is already case-insensitive for ASCII by default (so no need for Prisma's `mode: 'insensitive'`, which is **not supported on the SQLite connector** and throws `Unknown argument 'mode'` at runtime). `contains` was tried first, but it gives no way to pass a SQL `ESCAPE` clause, so a literal `%`/`_` in `q` is read as a wildcard instead of matched literally. The route escapes `%`, `_`, and the backslash in `q` and matches with `Prisma.sql` template literals (safely parameterized, not string interpolation — still within AGENTS.md's ban on hand-written interpolated SQL), keeping the query and pagination fully DB-side.

3. **`category` filters by `Category.slug`, exact match.** `slug` is already the stable identifier the app receives from `GET /categories` and stores on `Product.category.slug` — not `name`, which is a display string.

4. **Unmatched `category` slug returns an empty result set, not an error.** Filtering by a value that matches nothing is normal REST filter behavior. Also avoids an extra existence-check query before every search.

5. **`per_page` is not an accepted param; page size is hardcoded to 15.** The new schema never defines `per_page`, so a client sending it is silently ignored (same behavior as any unrecognized query key today) and the handler always passes `perPage: 15` to `wrapPage()`.

6. **Ordering: `name` ascending for this endpoint, not `GET /products`'s `createdAt desc`.** A filtered/search result list is scanned alphabetically by someone looking for a specific item; "newest first" is the browse ordering, not the search one.

7. **No `category_counts` field.** Two earlier implementation attempts added a per-category match-count field to the response; the captain explicitly rejected this addition. The response body is exactly the standard `wrapPage()` envelope plus `items`, nothing more.

## Risks / Trade-offs

- **[Risk] Accent-sensitive matching.** SQLite's default `LIKE` is not accent-insensitive: `contains: 'cafe'` will not match "Café Molido Britt 250 g" (`contains: 'café'` does). Given the catalog is real Spanish-language data with frequent accents, users typing without accents will get empty results for names they'd expect to match.
  → Mitigation (out of scope for this change): documented as a known v1 limitation; a follow-up could normalize accents at write-time (e.g. a `search_name` column) or adopt FTS5's `unicode61` tokenizer — both need their own OpenSpec change since they touch the schema.
- **[Risk] `LIKE` on `description` can't use an index (leading wildcard).** Irrelevant at today's catalog size; flag for the captain if catalog size is expected to grow by orders of magnitude soon, in which case FTS5 should be scoped as a deliberate follow-up.
- **[Trade-off] No relevance ranking** — results are ordered by name, not "best match first". Acceptable for a small local catalog; would need FTS5 `bm25()` to improve.

## Migration Plan

No database migration — this change only adds a route and a zod schema; `Product`/`Category` tables are unchanged. Purely additive at the HTTP layer.

## Open Questions

None outstanding. `per_page=15` is fixed by explicit captain decision (not just a default), `category_counts` is explicitly excluded by captain decision, and the endpoint shape (new `GET /products/search`) was confirmed after review of prior implementation attempts.

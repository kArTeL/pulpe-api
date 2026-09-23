## Context

`GET /products` currently supports only `page`/`per_page` pagination over active products, ordered by `createdAt desc`, serialized with `serializeProduct`. We're adding free-text search and category filtering, plus per-category match counts for a filter UI. No new route, no schema migration — `Category` and `Product` already model everything needed (`Product.name`, `Product.categoryId` → `Category.slug`).

## Goals / Non-Goals

**Goals:**
- Add `q` and `category` as additive, optional query params on the existing endpoint.
- Add `category_counts` to the response without changing `wrapPage()`'s shape or signature.
- Keep counts stable across category switches: they reflect `q` only.

**Non-Goals:**
- No change to `page`/`per_page` defaults, ordering, or the `active: true` filter.
- No full-text search engine — a simple case-insensitive substring match is sufficient.
- No change to `wrapPage()` itself; the extra field is composed by the route.

## Decisions

- **Where filtering happens**: build a shared Prisma `where` clause in the route (`active: true` + optional `name` contains + optional `category.slug` equals), reused for both the paginated `findMany`/`count` and left out of the category-counts query where noted.
- **Case-insensitive match**: use Prisma's `contains` with `mode: 'insensitive'` on `name`. SQLite's Prisma driver supports this via its query engine; verify during implementation and fall back to a raw `LOWER()` comparison via Prisma's typed helpers only if `mode: 'insensitive'` isn't honored by the SQLite provider (avoid hand-written raw SQL with interpolation per AGENTS.md).
- **Unknown category slug**: validate `category` as an optional non-empty string only (no DB round-trip in the schema layer). If the slug matches no category, the Prisma `where: { category: { slug } }` clause naturally yields zero rows — no special-case 404/422 needed.
- **`category_counts` computation**: run `prisma.category.findMany({ orderBy: { name: 'asc' }, include: { _count: { products: { where: { active: true, ...qFilter } } } } })` (or equivalent `groupBy`/per-category `count` calls) using only the `q` filter, never the `category` param. This is a separate query from the paginated listing.
- **Composing the response**: `return { ...wrapPage(items, { total, page, perPage }), category_counts }` — keeps `wrapPage()` untouched per the non-negotiable contract note in `AGENTS.md`.
- **Empty `q` after trim**: treat as absent at the schema-parsing layer (zod `.transform` trims, then treats `''` as `undefined`) so downstream logic has one code path.

## Risks / Trade-offs

- [Prisma `mode: 'insensitive'` may not be supported on SQLite] → Confirm with a quick manual check during implementation; if unsupported, compare `name` lowercased in JS after fetching is not viable for pagination/counts at scale, so use a case-insensitive collation approach Prisma exposes for SQLite, or normalize by comparing against a lowercased value in the query if the provider allows it. Decide during implementation; document the actual approach taken in code comments only if the choice is non-obvious.
- [N+1 queries for counts] → A single `findMany` with `_count` (or `groupBy`) per category avoids per-category round-trips.

## Open Questions

None — the contract is fully specified by the proposal.

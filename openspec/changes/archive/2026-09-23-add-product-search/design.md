## Context

`pulpe-api` is a plain-JS/ESM Fastify + Prisma (SQLite) service. `src/routes/products.js` already exposes `GET /products` (paginated list) and `GET /products/:id`. The public contract is snake_case everywhere; `src/schemas/product.js` holds the serializers and the `wrapPage()` helper shared by all paginated endpoints. This change adds `GET /products/search`, consumed by a sibling `pulpe-app` task building a search screen with category filter chips that display match counts.

## Goals / Non-Goals

**Goals:**
- Free-text search (`q`) on product `name`, case-insensitive substring match.
- Optional filter by category `slug` (`category`).
- Standard `wrapPage()` pagination, `per_page` default 15.
- `category_counts`: per-category count of active products matching `q` alone (ignoring `category`), for populating filter UI.
- Reuse existing serializers (`serializeProduct`, `serializeCategory`) and error conventions (`ApiError.invalidParams`).

**Non-Goals:**
- No changes to `GET /products`, `wrapPage()`, or the response/error envelope shapes.
- No full-text search engine, ranking, or fuzzy matching — a substring `LIKE`-style match is sufficient.
- No cap on `per_page` (matches existing `TODO(pulpe-812)` scope on `/products`).

## Decisions

- **Route placement**: add the new handler inside `src/routes/products.js` (in `productRoutes`), since it's the same resource and this repo's convention is one route file per resource. A separate file would fragment product-related logic without benefit.
- **Text match**: use Prisma's `contains` filter with `mode: 'insensitive'` on `name` under `where: { active: true }`. SQLite provider under Prisma supports case-insensitive `contains` via the `mode` option (Prisma emulates it); this avoids raw SQL.
- **Category filter**: filter via the relation, `where: { category: { slug: category } }`, keeping filters composable for the paginated query while the count-aggregation query below deliberately omits it.
- **category_counts via `groupBy`**: use `prisma.product.groupBy({ by: ['categoryId'], where: { active: true, ...(q ? nameFilter : {}) }, _count: { _all: true } })` — this avoids loading matching products into memory. `category` is deliberately excluded from this `where` so counts reflect every category option regardless of the currently selected filter. After grouping, look up the involved categories in one `findMany` and merge in JS, sorting by category `name` ascending, and serialize each with `serializeCategory`.
- **Query params & validation**: new zod schema (`searchParams`) mirroring `listParams`'s shape (`page`, `per_page` via `z.coerce.number().int().positive()`), plus `q: z.string().optional()` and `category: z.string().optional()`. Empty string `q` is treated as "no filter" (guarded explicitly, since zod won't strip empty strings on its own).
- **Two separate queries**: the paginated `findMany`/`count` pair uses `q` + `category`; the `groupBy` for counts uses `q` only. This keeps each query's intent obvious rather than trying to parameterize one query for both purposes.

## Risks / Trade-offs

- [Risk] `contains` + `mode: 'insensitive'` performance on large catalogs (no index support for substring match) → Mitigation: catalog size is small (corner-store inventory scope); acceptable for now, consistent with `/products` having no result cap either.
- [Risk] `groupBy` count query duplicates the `active`/`q` filter logic from the main query, risking drift if one is changed without the other → Mitigation: extract the shared `q`-based `where` fragment into a small local helper within the route so both queries build from the same source.
- [Risk] A category `slug` that doesn't exist yields an empty `items` list with no error, which could be silently confusing → Mitigation: this matches the spirit of `/products`' permissive filtering (no 404 for empty results is standard REST list-endpoint behavior); not treated as an error case.

## Open Questions

None — contract is fixed per the shared task brief with `pulpe-app`.

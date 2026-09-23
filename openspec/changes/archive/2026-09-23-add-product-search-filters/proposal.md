## Why

Users need to find products by typing free text and by narrowing to a category. `GET /products` currently only paginates; it has no way to search or filter, so the app can't offer these interactions.

## What Changes

- Add optional `search` query param to `GET /products`: case-insensitive partial match against `Product.name` OR `Product.description`.
- Add optional `category` query param to `GET /products`: filters by `Category.slug`. An unknown slug returns an empty page, not an error.
- `search` and `category` compose with each other and with existing `page`/`per_page` pagination (`total`/`has_next` reflect the filtered set).
- The `active: true` condition, the `wrapPage()` response shape, and the error format are all unchanged.

## Capabilities

### New Capabilities
- `product-listing`: listing products via `GET /products`, including pagination, filtering by category, and free-text search.

### Modified Capabilities
<!-- none: no existing spec covers product listing yet -->


## Impact

- `src/routes/products.js`: extend `listParams` zod schema and the Prisma `where` clause.
- `src/schemas/product.js`: no change expected (response wrapper untouched).
- `AGENTS.md`: query-param table gains `search` and `category` rows.
- No database migration needed (filters use existing columns).
- Coordinated with the `pulpe-app` (Flutter) repo, which is adding UI against this same contract.

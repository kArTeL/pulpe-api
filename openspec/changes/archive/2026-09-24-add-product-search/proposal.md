## Why

Corner-store staff currently have to page through the full catalog (`GET /products`, page/per_page only) to find a product — there is no way to search by name/description or narrow by category. As catalogs grow, browsing alone doesn't scale for a quick lookup.

## What Changes

- Add `GET /products/search`, a new read-only endpoint for free-text + category filtering, paginated at a fixed 15 items per page.
- Reuses the existing `wrapPage()` response wrapper, `ApiError` error format, and `serializeProduct()`/`serializeCategory()` — no changes to those.
- No changes to `GET /products` or `GET /products/:id`.

## Capabilities

### New Capabilities
- `product-search`: free-text and category-filtered product search, paginated at 15 items/page.

### Modified Capabilities

(none)

## Impact

- New route (`src/routes/product-search.js`), registered in `src/app.js`, with its own `q`/`category`/`page` zod schema.
- Raw parameterized SQL query (`Prisma.sql`/`$queryRaw`) against the existing `Product`/`Category` models — no migration needed.
- `pulpe-app` needs a matching change (tracked as its own OpenSpec change in that repo) to add the search UI and repository method that call this endpoint.

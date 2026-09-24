## Why

Shoppers browsing the catalog have no way to search by free text or narrow results by category. The companion `pulpe-app` task (`pulpe-app-product-search-screen-with-category-filt-95`) is building a search screen that needs a backend endpoint to search products and show how many matches exist per category, so the app can render filter chips with counts.

## What Changes

- Add a new `GET /products/search` endpoint, additive and isolated from the existing `GET /products` endpoint.
- Support free-text search (`q`) as a case-insensitive substring match on product `name`.
- Support filtering by category `slug` (`category`).
- Paginate results using the existing `wrapPage()` wrapper, unchanged, with `per_page` defaulting to 15 (vs. 20 for `/products`).
- Return an additional top-level `category_counts` field: for every category with at least one matching active product, the count of active products matching the text search `q` (ignoring the `category` filter itself), ordered by category name ascending.
- Only active (`active: true`) products are considered, ordered by `createdAt` desc, matching `/products` conventions.

## Capabilities

### New Capabilities
- `product-search`: free-text and category search over the product catalog, with paginated results and per-category match counts.

### Modified Capabilities
(none — this is additive; `GET /products` and `wrapPage()` are unchanged)

## Impact

- New route file (or addition to `src/routes/products.js`) registered in `src/app.js`.
- New zod schema for search query params.
- New Prisma query using `findMany` + `count` for pagination, and `groupBy` for `category_counts`.
- Reuses `serializeProduct` and `serializeCategory` from `src/schemas/product.js`.
- New tests in `tests/product.test.js` (or a new test file).
- `AGENTS.md` API contract section updated to document the new endpoint.

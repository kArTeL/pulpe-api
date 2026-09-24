## 1. Route implementation

- [x] 1.1 Add `searchParams` zod schema (`q`, `category`, `page`, `per_page` with default 15) in `src/routes/products.js`
- [x] 1.2 Implement `GET /products/search` handler: build shared `q`-based name filter, run paginated `findMany`/`count` with `active: true` + optional `category` + optional `q`, ordered by `createdAt` desc
- [x] 1.3 Compute `category_counts` via `prisma.product.groupBy` on `categoryId` with `active: true` + optional `q` only (no `category` filter), then look up matching categories and merge counts, sorted by category `name` ascending
- [x] 1.4 Serialize items with `serializeProduct`, wrap with `wrapPage()`, add `category_counts` (each entry via `serializeCategory`) to the response
- [x] 1.5 On zod parse failure, throw `ApiError.invalidParams(...)` matching the existing `/products` pattern

## 2. Tests

- [x] 2.1 Happy path: `q` only returns matching active products
- [x] 2.2 Happy path: `category` only returns products in that category
- [x] 2.3 Combined `q` + `category` filter
- [x] 2.4 Pagination: `page`/`per_page` respected, `has_next` correct
- [x] 2.5 `category_counts` values correct and ignore the `category` filter
- [x] 2.6 Invalid params (e.g. non-numeric `page`) return 422 with `invalid_params` code

## 3. Docs

- [x] 3.1 Update `AGENTS.md` "API contract" section with `GET /products/search` params and response shape (including `category_counts`)

## 4. Verification

- [x] 4.1 Run `npm run lint && npm test` and confirm all pass (one pre-existing unrelated failure: `GET /categories` ordering test, locale-dependent, fails identically on master)

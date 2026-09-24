## 1. Backend: query schema and route

- [x] 1.1 Add a `searchParams` zod schema (`q`, `category`, `page` — no `per_page`) alongside `listParams` in `src/schemas/product.js` or the new route file, following AGENTS.md's snake_case convention
- [x] 1.2 Add `GET /products/search` (new `src/routes/product-search.js`), building the Prisma `where` clause per design.md decisions 2-4, ordered by `name` ascending, no `category_counts` field
- [x] 1.3 Register the new route in `src/app.js`
- [x] 1.4 Update the "API contract" query-param table in `AGENTS.md` with the new endpoint's params

## 2. Tests

- [x] 2.1 Happy path: `q` matches name/description (case-insensitive ASCII)
- [x] 2.2 Happy path: `category` filter alone
- [x] 2.3 Happy path: combined `q` + `category`
- [x] 2.4 Fixed page size: `per_page` query param is ignored, response always has `per_page: 15`
- [x] 2.5 Invalid params: blank `q`, invalid `page` → 422 `invalid_params`
- [x] 2.6 Empty result: no match and unknown category slug → 200 empty `items`
- [x] 2.7 `active: false` products are excluded from search results (mirrors `GET /products`)
- [x] 2.8 Response body does not contain a `category_counts` key

## 3. Docs

- [x] 3.1 Document `GET /products/search` wherever `GET /products`/`GET /categories` are currently documented (AGENTS.md)

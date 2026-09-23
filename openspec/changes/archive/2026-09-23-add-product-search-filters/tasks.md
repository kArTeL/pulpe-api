## 1. Schema & validation

- [x] 1.1 Extend `listParams` in `src/routes/products.js` with optional `search` and `category` zod string fields (snake_case).

## 2. Query logic

- [x] 2.1 Build the Prisma `where` clause for `GET /products` combining `active: true` with optional `search` (OR across `name`/`description`, `contains`) and optional `category` (`category: { slug }`), all as `AND` conditions.
- [x] 2.2 Reuse the same `where` clause for both `findMany` and `count` so pagination totals reflect the filtered set.

## 3. Tests

- [x] 3.1 Happy-path test: `search` matches a known product by name.
- [x] 3.2 Happy-path test: `search` matches a known product via description only (not name).
- [x] 3.3 Happy-path test: `category` filters to a known slug and all items belong to it.
- [x] 3.4 Happy-path test: `category` with an unknown slug returns an empty page (200, not 404/422).
- [x] 3.5 Combined test: `search` + `category` + `per_page` together, checking `total`/`has_next` reflect the filtered count.
- [x] 3.6 Invalid-params test: an unparseable value for one of the new params returns 422 with `invalid_params`.

## 4. Documentation

- [x] 4.1 Update `AGENTS.md`'s `GET /products` query-param table with `search` and `category`.

## 5. Archive

- [x] 5.1 Run `npm run lint && npm test`.
- [x] 5.2 Archive the change with `openspec archive add-product-search-filters`.

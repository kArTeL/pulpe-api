## Why

The mobile app needs to let a shopper search the catalog by free text and narrow results by category, while showing how many matches each category has for the current search. `GET /products` today only supports plain pagination, with no way to filter by text or category, and no per-category counts to drive a filter UI.

## What Changes

- Extend `GET /products` (no new route) with two additive, optional query params:
  - `q`: case-insensitive substring match against `name`. Trimmed; empty after trim is treated as absent.
  - `category`: a `Category.slug`. Restricts `items`/`total`/`has_next` to that category. An unknown slug is a valid filter that yields an empty page (`total: 0`), not a 422.
- Both params compose with existing `page`/`per_page` and with each other, using the same ordering, `active: true` filter, and serializers as today.
- Add a `category_counts` field to the `GET /products` response, sibling to `items`/`total`/`page`/`per_page`/`has_next`. One entry per existing category (including zero-count ones), ordered by category name ascending, shaped like `{ category: serializeCategory(...), count }`. `count` reflects only the current `q` filter (ignoring the `category` param), so switching the category filter never changes the counts shown.
- Document the new query params and response field in `AGENTS.md`'s API contract section.

## Capabilities

### New Capabilities
(none — this extends the existing product listing behavior)

### Modified Capabilities
- `product-listing`: `GET /products` gains `q` and `category` query params and a `category_counts` response field.

## Impact

- `src/routes/products.js`: query parsing and Prisma query logic for the listing endpoint.
- `src/schemas/product.js`: no change to `wrapPage()` signature/shape; the route composes the extra field alongside its output.
- `AGENTS.md`: API contract table and JSON examples.
- `tests/product.test.js`: new test cases for `q`, `category`, `category_counts`, and their combination with pagination.

## Purpose

Defines the behavior of `GET /products`: paginated listing of active products, with optional free-text search and category filtering, plus per-category match counts for the current text search.

## Requirements

### Requirement: Text search on product listing
`GET /products` SHALL accept an optional `q` query parameter that performs a case-insensitive substring match against `Product.name`. The value SHALL be trimmed of leading/trailing whitespace before matching; if the trimmed value is empty, `q` SHALL be treated as absent (no text filter applied).

#### Scenario: q matches product names
- **WHEN** a client requests `GET /products?q=milk` and at least one active product's name contains "milk" (case-insensitively)
- **THEN** the response `items` include only active products whose name contains "milk" (case-insensitively), and `total` reflects that count

#### Scenario: q matches nothing
- **WHEN** a client requests `GET /products?q=zzzznomatch`
- **THEN** the response has `items: []` and `total: 0`, with a 200 status (not an error)

#### Scenario: q is only whitespace
- **WHEN** a client requests `GET /products?q=%20%20`
- **THEN** the request is treated as if `q` were absent, returning the full unfiltered listing

### Requirement: Category filter on product listing
`GET /products` SHALL accept an optional `category` query parameter naming a `Category.slug`. When present, `items`, `total`, and `has_next` SHALL be restricted to active products in that category. A `category` value that does not match any existing category's slug SHALL NOT be treated as an invalid parameter; it SHALL return a valid 200 response with `items: []` and `total: 0`.

#### Scenario: category filters to matching products
- **WHEN** a client requests `GET /products?category=dairy` and category "dairy" exists with active products
- **THEN** the response `items` include only active products in the "dairy" category, and `total` reflects that count

#### Scenario: unknown category slug returns an empty page, not an error
- **WHEN** a client requests `GET /products?category=does-not-exist`
- **THEN** the response is 200 with `items: []` and `total: 0`

### Requirement: q and category compose with each other and with pagination
`q` and `category` SHALL compose with each other and with `page`/`per_page` exactly as the existing pagination behaves: same ordering, same `active: true` filter, same serializers.

#### Scenario: q, category, and page combine
- **WHEN** a client requests `GET /products?q=milk&category=dairy&page=2&per_page=5`
- **THEN** the response contains at most 5 items, drawn from active "dairy" products whose name contains "milk" (case-insensitively), offset by the second page

### Requirement: Category counts reflect the text search only
`GET /products` SHALL include a `category_counts` field in its response, sibling to `items`/`total`/`page`/`per_page`/`has_next`. It SHALL contain one entry per existing category, including categories with zero matches, ordered by category name ascending. Each entry SHALL have the shape `{ category: { id, slug, name }, count }`, where `category` matches the shape produced by `serializeCategory()`. `count` SHALL be the number of active products in that category matching the current `q` filter (or all active products in that category when `q` is absent), computed **ignoring the `category` query parameter** — so `category_counts` SHALL be identical across requests that differ only in the `category` parameter (with `q` held constant).

#### Scenario: category_counts present with all categories
- **WHEN** a client requests `GET /products`
- **THEN** the response `category_counts` array has one entry per existing category, ordered by name ascending, each with a `count` of active products in that category

#### Scenario: category_counts reflects q
- **WHEN** a client requests `GET /products?q=milk`
- **THEN** each entry's `count` in `category_counts` reflects only active products in that category whose name contains "milk" (case-insensitively)

#### Scenario: category_counts is unaffected by the category filter
- **WHEN** a client requests `GET /products?q=milk&category=dairy` and separately `GET /products?q=milk&category=produce` (or with `category` omitted)
- **THEN** the `category_counts` array is identical across all three responses

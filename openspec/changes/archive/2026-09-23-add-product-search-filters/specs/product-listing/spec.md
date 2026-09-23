## ADDED Requirements

### Requirement: Paginated product listing
`GET /products` SHALL return a paginated list of active products using the standard `wrapPage()` response shape (`items`, `total`, `page`, `per_page`, `has_next`), accepting `page` (int > 0, default 1) and `per_page` (int > 0, default 20) query params.

#### Scenario: Default listing
- **WHEN** a client calls `GET /products` with no query params
- **THEN** the response is 200 with the first page of active products, `page` 1 and `per_page` 20

#### Scenario: Invalid page rejected
- **WHEN** a client calls `GET /products?page=0`
- **THEN** the response is 422 with `error.code` `invalid_params`

### Requirement: Free-text search
`GET /products` SHALL accept an optional `search` query param (string) that filters results to products whose `name` OR `description` case-insensitively contains the given text, as an additional `AND` condition alongside `active: true`.

#### Scenario: Search matches product name
- **WHEN** a client calls `GET /products?search=<text>` where `<text>` appears in some active product's `name`
- **THEN** the response is 200 and every item in `items` has `search` matching in its `name` or `description`

#### Scenario: Search matches product description only
- **WHEN** a client calls `GET /products?search=<text>` where `<text>` appears only in some active product's `description`, not its `name`
- **THEN** the response is 200 and includes that product in `items`

#### Scenario: Search is case-insensitive
- **WHEN** a client calls `GET /products?search=<TEXT>` using a different case than the stored value
- **THEN** matching products are still returned

### Requirement: Category filter
`GET /products` SHALL accept an optional `category` query param (string) that filters results to products whose `Category.slug` equals the given value, as an additional `AND` condition alongside `active: true`.

#### Scenario: Category matches existing slug
- **WHEN** a client calls `GET /products?category=<slug>` for an existing `Category.slug`
- **THEN** the response is 200 and every item in `items` belongs to that category

#### Scenario: Category with unknown slug returns empty page
- **WHEN** a client calls `GET /products?category=<unknown-slug>` for a slug that does not exist
- **THEN** the response is 200 with `items` empty and `total` 0, not a 404 or 422

### Requirement: Filters compose with pagination
`search` and `category` SHALL compose with each other and with `page`/`per_page`: `total` and `has_next` SHALL reflect the count of products matching all active filters, not the unfiltered table.

#### Scenario: Search and category combined with pagination
- **WHEN** a client calls `GET /products?search=<text>&category=<slug>&per_page=<n>` where the combined filter matches more than `<n>` products
- **THEN** the response is 200, `items` has at most `<n>` products all matching both filters, `total` equals the full filtered count, and `has_next` is true

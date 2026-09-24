# product-search Specification

## Purpose
TBD - created by archiving change add-product-search. Update Purpose after archive.
## Requirements
### Requirement: Search products by free text and category
The system SHALL provide `GET /products/search`, returning active products whose `name` or `description` contains the given free-text query and/or that belong to the given category, paginated at a fixed 15 items per page.

#### Scenario: Free-text match on name
- **WHEN** a client calls `GET /products/search?q=leche`
- **THEN** the response includes every active product whose name or description contains "leche" (case-insensitively for ASCII characters), wrapped in the standard pagination envelope with `per_page: 15`

#### Scenario: Filter by category only
- **WHEN** a client calls `GET /products/search?category=lacteos`
- **THEN** the response includes only active products belonging to the category with slug `lacteos`

#### Scenario: Combined text and category filters
- **WHEN** a client calls `GET /products/search?q=leche&category=lacteos`
- **THEN** the response includes only active products that match both the text query and the category filter

#### Scenario: No filters supplied
- **WHEN** a client calls `GET /products/search` with neither `q` nor `category`
- **THEN** the response returns active products paginated at 15 per page, in the same manner as `GET /products` but with a page size of 15

### Requirement: Fixed page size
The system SHALL always paginate `GET /products/search` results at 15 items per page. The endpoint SHALL NOT accept a `per_page` query parameter to change this.

#### Scenario: per_page is ignored
- **WHEN** a client calls `GET /products/search?per_page=50`
- **THEN** the response still returns at most 15 items and `per_page: 15` in the response body

### Requirement: No category match counts
The `GET /products/search` response SHALL contain only the standard pagination envelope (`items`, `total`, `page`, `per_page`, `has_next`) and SHALL NOT include a per-category match-count field.

#### Scenario: Response body has no category_counts field
- **WHEN** a client calls `GET /products/search?q=leche`
- **THEN** the response body does not contain a `category_counts` key

### Requirement: Query parameter validation
The system SHALL validate `q`, `category`, and `page` with the same `invalid_params` (422) convention used by `GET /products`.

#### Scenario: Blank q is rejected
- **WHEN** a client calls `GET /products/search?q=%20%20` (whitespace only)
- **THEN** the response is `422` with `error.code` equal to `invalid_params`

#### Scenario: Invalid page is rejected
- **WHEN** a client calls `GET /products/search?page=0`
- **THEN** the response is `422` with `error.code` equal to `invalid_params`

### Requirement: Empty and unmatched results
The system SHALL return a `200` response with an empty `items` array (not an error) when a search or filter matches no products, including when `category` does not match any known category slug.

#### Scenario: No products match the query
- **WHEN** a client calls `GET /products/search?q=zzzzznotaproduct`
- **THEN** the response is `200` with `items` equal to an empty array, `total` equal to `0`, and `has_next` equal to `false`

#### Scenario: Unknown category slug
- **WHEN** a client calls `GET /products/search?category=does-not-exist`
- **THEN** the response is `200` with `items` equal to an empty array and `total` equal to `0`, not `404`


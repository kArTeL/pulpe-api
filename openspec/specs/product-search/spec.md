# product-search

## Purpose

Lets clients search the product catalog by free text and/or category, returning paginated results and per-category match counts so the mobile app can build a search experience with category facets.

## Requirements

### Requirement: Free-text product search
The system SHALL provide `GET /products/search` accepting an optional `q` query parameter. When `q` is present and non-empty, only active products whose `name` contains `q` as a case-insensitive substring SHALL be returned. When `q` is absent or empty, no text filter SHALL be applied.

#### Scenario: Search by matching text
- **WHEN** a client requests `GET /products/search?q=rice`
- **THEN** the response contains only active products whose name matches "rice" case-insensitively, wrapped in the standard pagination envelope

#### Scenario: No text filter given
- **WHEN** a client requests `GET /products/search` with no `q` parameter
- **THEN** the response contains active products without any text filtering applied

### Requirement: Category filter
The system SHALL accept an optional `category` query parameter identifying a category by its `slug`. When present, only active products belonging to that category SHALL be returned, in addition to any active `q` text filter.

#### Scenario: Filter by category slug
- **WHEN** a client requests `GET /products/search?category=snacks`
- **THEN** the response contains only active products belonging to the category whose slug is "snacks"

#### Scenario: Combined text and category filter
- **WHEN** a client requests `GET /products/search?q=chips&category=snacks`
- **THEN** the response contains only active products in the "snacks" category whose name matches "chips" case-insensitively

### Requirement: Paginated results
The system SHALL paginate search results using the existing `wrapPage()` envelope, with `page` defaulting to 1 and `per_page` defaulting to 15, both coerced to positive integers. Results SHALL be ordered by `createdAt` descending. Only products with `active: true` SHALL ever be returned.

#### Scenario: Default pagination
- **WHEN** a client requests `GET /products/search` with no `page` or `per_page`
- **THEN** the response returns up to 15 items on page 1, most recently created first

#### Scenario: Custom pagination
- **WHEN** a client requests `GET /products/search?page=2&per_page=5`
- **THEN** the response returns the second page of 5 items and `has_next` reflects whether more results remain

#### Scenario: Invalid pagination parameters
- **WHEN** a client requests `GET /products/search?page=not-a-number`
- **THEN** the system responds with HTTP 422 and an `invalid_params` error code

### Requirement: Category match counts
The system SHALL include a top-level `category_counts` field in the response: an array of `{ category, count }` entries, one for every category with at least one active product matching the current `q` text filter (ignoring the `category` filter itself). Each `count` SHALL reflect the number of matching active products in that category. Entries SHALL be ordered by category `name` ascending, and `category` SHALL be serialized the same way as elsewhere in the API (`id`, `slug`, `name`).

#### Scenario: Counts ignore the selected category filter
- **WHEN** a client requests `GET /products/search?q=juice&category=drinks`
- **THEN** `category_counts` includes an entry for every category with at least one active product matching "juice", not only the "drinks" category

#### Scenario: Counts reflect the text filter
- **WHEN** a client requests `GET /products/search?q=juice`
- **THEN** each entry in `category_counts` reports the count of active products in that category whose name matches "juice" case-insensitively

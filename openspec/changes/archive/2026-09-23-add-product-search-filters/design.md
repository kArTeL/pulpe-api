## Context

`GET /products` currently supports only `page`/`per_page` pagination over `active: true` products, built with a zod-validated `listParams` schema and Prisma's `findMany`/`count`. The database is SQLite via Prisma.

## Goals / Non-Goals

**Goals:**
- Let clients narrow the product list with free-text `search` and `category` slug filtering.
- Keep the filters composable with existing pagination (accurate `total`/`has_next`).
- Keep the public contract snake_case and unchanged in shape (`wrapPage()`, error format).

**Non-Goals:**
- Price-range or in-stock filters.
- Sorting.
- Any change to the pagination wrapper or error format.
- Full-text search ranking/relevance (this is a simple substring match, not a search engine).

## Decisions

- **Case-insensitive match on SQLite**: use Prisma's `contains` filter directly (no `mode: 'insensitive'`, which is unsupported on the SQLite provider). SQLite's underlying `LIKE` is case-insensitive for ASCII by default, which satisfies the "case-insensitive partial match" requirement without extra config.
- **`search` matches name OR description**: expressed as an `OR` array inside the `AND` conditions of the Prisma `where` clause, so it composes with `active: true` and `category` filtering (all `AND`).
- **`category` filters by slug, not id**: joins through the `category` relation (`category: { slug: category }`). An unknown slug simply matches zero rows via Prisma's normal relation filtering — no need for a pre-check or a 404, satisfying "unknown slug returns an empty page".
- **Validation stays in `listParams`**: `search` and `category` are added as optional zod string fields (`z.string().min(1).optional()`), consistent with how `page`/`per_page` are already validated in the same schema before touching Prisma.

## Risks / Trade-offs

- [Empty-string params like `?search=`] → zod's `.min(1)` rejects them as invalid rather than silently treating them as "no filter", giving a clear 422 instead of ambiguous behavior.
- [SQLite `LIKE` case-insensitivity is ASCII-only] → acceptable for this dataset (product names/descriptions); no requirement for non-ASCII case folding was raised.

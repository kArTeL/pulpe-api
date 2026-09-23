/**
 * The API's public contract uses snake_case, both in query params and in
 * response fields. Prisma uses camelCase internally, so ALL output goes
 * through these serializers. See AGENTS.md → "API contract".
 */

/** @param {import('@prisma/client').Category} category */
export function serializeCategory(category) {
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
  };
}

/**
 * @param {import('@prisma/client').Product & {
 *   category: import('@prisma/client').Category
 * }} product
 */
export function serializeProduct(product) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    active: product.active,
    image_url: product.imageUrl,
    category: serializeCategory(product.category),
    created_at: product.createdAt.toISOString(),
  };
}

/**
 * Standard wrapper for every paginated API response.
 *
 * @param {unknown[]} items
 * @param {{ total: number, page: number, perPage: number }} options
 */
export function wrapPage(items, { total, page, perPage }) {
  return {
    items,
    total,
    page,
    per_page: perPage,
    has_next: page * perPage < total,
  };
}

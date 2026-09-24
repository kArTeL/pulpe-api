import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { wrapPage, serializeProduct } from '../schemas/product.js';

// Fixed by design (see openspec/changes/add-product-search/design.md,
// decision 5): search results are always paginated at 15/page, unlike
// GET /products' client-adjustable per_page.
const SEARCH_PAGE_SIZE = 15;

const trimmed = (schema) =>
  z.preprocess((value) => (typeof value === 'string' ? value.trim() : value), schema);

// Prisma's `contains` gives no way to pass a SQL `ESCAPE` clause, so a literal
// `%`/`_` in `q` would otherwise be read as a LIKE wildcard. Escape them (and
// the escape character itself) and match with a raw `LIKE ... ESCAPE '\'`.
function likePattern(value) {
  return `%${value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
}

/**
 * Search query parameters for GET /products/search.
 *
 * Convention: query params are snake_case. If you add a new one,
 * add it to the AGENTS.md table too → "API contract".
 */
const searchParams = z.object({
  q: trimmed(z.string().min(1).max(100)).optional(),
  category: trimmed(z.string().min(1)).optional(),
  page: z.coerce.number().int().positive().default(1),
});

/** @param {import('fastify').FastifyInstance} app */
export async function productSearchRoutes(app) {
  /**
   * GET /products/search
   * Free-text (name/description) and category search over active products.
   * Always paginated at a fixed 15 items per page; per_page is not accepted.
   */
  app.get('/products/search', async (request) => {
    const parsed = searchParams.safeParse(request.query);
    if (!parsed.success) {
      throw ApiError.invalidParams(parsed.error.flatten().fieldErrors);
    }

    const { q, category, page } = parsed.data;

    const conditions = [Prisma.sql`p."active" = 1`];
    if (category) {
      conditions.push(Prisma.sql`c."slug" = ${category}`);
    }
    if (q) {
      const pattern = likePattern(q);
      conditions.push(
        Prisma.sql`(p."name" LIKE ${pattern} ESCAPE '\\' OR p."description" LIKE ${pattern} ESCAPE '\\')`,
      );
    }
    const where = Prisma.join(conditions, ' AND ');

    const [rows, [{ count }]] = await Promise.all([
      prisma.$queryRaw`
        SELECT
          p."id" AS "id", p."sku" AS "sku", p."name" AS "name",
          p."description" AS "description", p."price" AS "price",
          p."stock" AS "stock", p."active" AS "active", p."imageUrl" AS "imageUrl",
          p."createdAt" AS "createdAt",
          c."id" AS "categoryId", c."slug" AS "categorySlug", c."name" AS "categoryName"
        FROM "products" p
        JOIN "categories" c ON c."id" = p."categoryId"
        WHERE ${where}
        ORDER BY p."name" ASC
        LIMIT ${SEARCH_PAGE_SIZE} OFFSET ${(page - 1) * SEARCH_PAGE_SIZE}
      `,
      prisma.$queryRaw`
        SELECT COUNT(*) AS "count"
        FROM "products" p
        JOIN "categories" c ON c."id" = p."categoryId"
        WHERE ${where}
      `,
    ]);

    const products = rows.map((row) => ({
      id: row.id,
      sku: row.sku,
      name: row.name,
      description: row.description,
      price: row.price,
      stock: row.stock,
      active: row.active,
      imageUrl: row.imageUrl,
      createdAt: row.createdAt,
      category: { id: row.categoryId, slug: row.categorySlug, name: row.categoryName },
    }));

    return wrapPage(products.map(serializeProduct), {
      total: Number(count),
      page,
      perPage: SEARCH_PAGE_SIZE,
    });
  });
}

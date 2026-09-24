import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { wrapPage, serializeProduct } from '../schemas/product.js';

// Fixed by design (see openspec/changes/add-product-search/design.md,
// decision 5): search results are always paginated at 15/page, unlike
// GET /products' client-adjustable per_page.
const SEARCH_PAGE_SIZE = 15;

const trimmed = (schema) =>
  z.preprocess((value) => (typeof value === 'string' ? value.trim() : value), schema);

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

    const where = {
      active: true,
      ...(category ? { category: { slug: category } } : {}),
    };

    let matches = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    });

    if (q) {
      // `contains` compiles to SQL LIKE, whose `%`/`_` are wildcards. Filtering
      // in JS with a plain substring check treats them as literal characters,
      // matching what a user typing "10%" or "a_b" actually means.
      const needle = q.toLowerCase();
      matches = matches.filter(
        (product) =>
          product.name.toLowerCase().includes(needle) ||
          product.description.toLowerCase().includes(needle),
      );
    }

    const total = matches.length;
    const products = matches.slice((page - 1) * SEARCH_PAGE_SIZE, page * SEARCH_PAGE_SIZE);

    return wrapPage(products.map(serializeProduct), {
      total,
      page,
      perPage: SEARCH_PAGE_SIZE,
    });
  });
}

import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ApiError } from '../lib/errors.js';
import { wrapPage, serializeProduct, serializeCategory } from '../schemas/product.js';

/**
 * List query parameters for products.
 *
 * Convention: query params are snake_case. If you add a new one,
 * add it to the AGENTS.md table too → "API contract".
 */
const listParams = z.object({
  // TODO(pulpe-812): per_page has no cap. A very large value would load the
  // entire table into memory. Need to define the max with the team.
  per_page: z.coerce.number().int().positive().default(20),
  page: z.coerce.number().int().positive().default(1),
});

/** Search query parameters for GET /products/search. */
const searchParams = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  per_page: z.coerce.number().int().positive().default(15),
  page: z.coerce.number().int().positive().default(1),
});

/** @param {import('fastify').FastifyInstance} app */
export async function productRoutes(app) {
  /**
   * GET /products
   * Paginated listing of active products, most recent first.
   */
  app.get('/products', async (request) => {
    const parsed = listParams.safeParse(request.query);
    if (!parsed.success) {
      throw ApiError.invalidParams(parsed.error.flatten().fieldErrors);
    }

    const { page, per_page: perPage } = parsed.data;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { active: true },
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where: { active: true } }),
    ]);

    return wrapPage(products.map(serializeProduct), {
      total,
      page,
      perPage,
    });
  });

  /**
   * GET /products/search
   * Free-text and category search over active products, with per-category
   * match counts (ignoring the category filter itself) for filter UIs.
   */
  app.get('/products/search', async (request) => {
    const parsed = searchParams.safeParse(request.query);
    if (!parsed.success) {
      throw ApiError.invalidParams(parsed.error.flatten().fieldErrors);
    }

    const { q, category, page, per_page: perPage } = parsed.data;

    // SQLite's `LIKE` (which Prisma's `contains` compiles to) is already
    // case-insensitive for ASCII; the `mode: 'insensitive'` option is not
    // supported by the SQLite provider.
    const nameFilter = q ? { name: { contains: q } } : {};
    const where = {
      active: true,
      ...nameFilter,
      ...(category ? { category: { slug: category } } : {}),
    };

    const [products, total, grouped] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where }),
      prisma.product.groupBy({
        by: ['categoryId'],
        where: { active: true, ...nameFilter },
        _count: { _all: true },
      }),
    ]);

    const categories = await prisma.category.findMany({
      where: { id: { in: grouped.map((entry) => entry.categoryId) } },
    });
    const categoryById = new Map(categories.map((cat) => [cat.id, cat]));

    const categoryCounts = grouped
      .map((entry) => ({
        category: serializeCategory(categoryById.get(entry.categoryId)),
        count: entry._count._all,
      }))
      .sort((a, b) => a.category.name.localeCompare(b.category.name));

    return {
      ...wrapPage(products.map(serializeProduct), { total, page, perPage }),
      category_counts: categoryCounts,
    };
  });

  /**
   * GET /products/:id
   * Detail of a single product by id.
   */
  app.get('/products/:id', async (request) => {
    const product = await prisma.product.findUnique({
      where: { id: request.params.id },
      include: { category: true },
    });

    if (!product) {
      throw ApiError.notFound('the requested product');
    }

    return serializeProduct(product);
  });
}

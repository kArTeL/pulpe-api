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
  q: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  category: z.string().trim().min(1).optional(),
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

    const { page, per_page: perPage, q, category } = parsed.data;

    const textFilter = q ? { name: { contains: q } } : {};
    const where = {
      active: true,
      ...textFilter,
      ...(category ? { category: { slug: category } } : {}),
    };

    const [products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.product.count({ where }),
      prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { products: { where: { active: true, ...textFilter } } } },
        },
      }),
    ]);

    const categoryCounts = categories.map((cat) => ({
      category: serializeCategory(cat),
      count: cat._count.products,
    }));

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

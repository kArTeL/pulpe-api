import { prisma } from '../lib/prisma.js';
import { serializeCategory } from '../schemas/product.js';

/** @param {import('fastify').FastifyInstance} app */
export async function categoryRoutes(app) {
  /**
   * GET /categories
   * Catalog of categories, ordered by name.
   */
  app.get('/categories', async () => {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return { items: categories.map(serializeCategory) };
  });
}

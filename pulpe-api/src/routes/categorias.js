import { prisma } from '../lib/prisma.js';
import { serializarCategoria } from '../schemas/producto.js';

/** @param {import('fastify').FastifyInstance} app */
export async function rutasCategorias(app) {
  /**
   * GET /categorias
   * Catálogo de categorías, ordenado por nombre.
   */
  app.get('/categorias', async () => {
    const categorias = await prisma.category.findMany({
      orderBy: { nombre: 'asc' },
    });

    return { items: categorias.map(serializarCategoria) };
  });
}

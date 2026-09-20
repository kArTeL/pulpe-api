import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { ErrorApi } from '../lib/errores.js';
import { envolverPagina, serializarProducto } from '../schemas/producto.js';

/**
 * Parámetros del listado de productos.
 *
 * Convención: los query params van en snake_case. Si agregás uno nuevo,
 * agregalo también a la tabla de AGENTS.md → "Contrato de la API".
 */
const parametrosListado = z.object({
  // TODO(pulpe-812): por_pagina no tiene tope. Con un valor muy alto esto
  // carga la tabla entera en memoria. Pendiente definir el máximo con el equipo.
  por_pagina: z.coerce.number().int().positive().default(20),
  pagina: z.coerce.number().int().positive().default(1),
});

/** @param {import('fastify').FastifyInstance} app */
export async function rutasProductos(app) {
  /**
   * GET /productos
   * Listado paginado de productos activos, más reciente primero.
   */
  app.get('/productos', async (request) => {
    const parseo = parametrosListado.safeParse(request.query);
    if (!parseo.success) {
      throw ErrorApi.parametrosInvalidos(parseo.error.flatten().fieldErrors);
    }

    const { pagina, por_pagina: porPagina } = parseo.data;

    const [productos, total] = await Promise.all([
      prisma.product.findMany({
        where: { activo: true },
        include: { categoria: true },
        orderBy: { createdAt: 'desc' },
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      prisma.product.count({ where: { activo: true } }),
    ]);

    return envolverPagina(productos.map(serializarProducto), {
      total,
      pagina,
      porPagina,
    });
  });

  /**
   * GET /productos/:id
   * Detalle de un producto por id.
   */
  app.get('/productos/:id', async (request) => {
    const producto = await prisma.product.findUnique({
      where: { id: request.params.id },
      include: { categoria: true },
    });

    if (!producto) {
      throw ErrorApi.noEncontrado('el producto solicitado');
    }

    return serializarProducto(producto);
  });
}

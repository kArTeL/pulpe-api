import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { config } from './lib/config.js';
import { ErrorApi } from './lib/errores.js';
import { rutasProductos } from './routes/productos.js';
import { rutasCategorias } from './routes/categorias.js';
import { rutasSalud } from './routes/salud.js';

/** @returns {Promise<import('fastify').FastifyInstance>} */
export async function construirApp() {
  const app = Fastify({
    logger: config.entorno !== 'test',
  });

  await app.register(cors, { origin: config.corsOrigin });

  // Formato único de error para toda la API. No devolvemos stack traces.
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ErrorApi) {
      return reply.status(error.status).send({
        error: {
          codigo: error.codigo,
          mensaje: error.message,
          detalles: error.detalles,
        },
      });
    }

    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: {
          codigo: 'parametros_invalidos',
          mensaje: 'Los parámetros de la petición no son válidos.',
          detalles: error.flatten().fieldErrors,
        },
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: { codigo: 'error_interno', mensaje: 'Ocurrió un error inesperado.' },
    });
  });

  await app.register(rutasSalud);
  await app.register(rutasProductos);
  await app.register(rutasCategorias);

  return app;
}

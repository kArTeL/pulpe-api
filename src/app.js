import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { config } from './lib/config.js';
import { ApiError } from './lib/errors.js';
import { productRoutes } from './routes/products.js';
import { categoryRoutes } from './routes/categories.js';
import { healthRoutes } from './routes/health.js';

/** @returns {Promise<import('fastify').FastifyInstance>} */
export async function buildApp() {
  const app = Fastify({
    logger: config.environment !== 'test',
  });

  await app.register(cors, { origin: config.corsOrigin });

  // Single error format for the whole API. We never return stack traces.
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ApiError) {
      return reply.status(error.status).send({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      });
    }

    if (error instanceof ZodError) {
      return reply.status(422).send({
        error: {
          code: 'invalid_params',
          message: 'The request parameters are not valid.',
          details: error.flatten().fieldErrors,
        },
      });
    }

    app.log.error(error);
    return reply.status(500).send({
      error: { code: 'internal_error', message: 'An unexpected error occurred.' },
    });
  });

  await app.register(healthRoutes);
  await app.register(productRoutes);
  await app.register(categoryRoutes);

  return app;
}

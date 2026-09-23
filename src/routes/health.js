/** @param {import('fastify').FastifyInstance} app */
export async function healthRoutes(app) {
  app.get('/health', async () => ({ status: 'ok' }));
}

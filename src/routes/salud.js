/** @param {import('fastify').FastifyInstance} app */
export async function rutasSalud(app) {
  app.get('/salud', async () => ({ estado: 'ok' }));
}

import { construirApp } from './app.js';
import { config } from './lib/config.js';

const app = await construirApp();

try {
  await app.listen({ port: config.puerto, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}

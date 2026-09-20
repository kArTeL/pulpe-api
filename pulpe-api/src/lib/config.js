export const config = Object.freeze({
  puerto: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  entorno: process.env.NODE_ENV ?? 'development',
});

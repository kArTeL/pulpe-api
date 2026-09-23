export const config = Object.freeze({
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  environment: process.env.NODE_ENV ?? 'development',
});

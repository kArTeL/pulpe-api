# pulpe-api

API de catálogo e inventario para pulperías y minisúper.

Node 20+ · JavaScript (ESM) · Fastify · Prisma · SQLite

Sin TypeScript y sin build step: `node src/server.js` y listo.

## Arranque

```bash
cp .env.example .env
npm install
npm run setup      # migra y siembra ~165 productos en 8 categorías
npm run dev
```

La API queda en `http://localhost:3000`.

> `npm run dev` usa `node --watch --env-file=.env`, que necesita Node 20.6 o superior.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/salud` | Healthcheck |
| GET | `/productos` | Listado paginado de productos activos |
| GET | `/productos/:id` | Detalle de un producto |
| GET | `/categorias` | Catálogo de categorías |

Ejemplo:

```bash
curl 'http://localhost:3000/productos?pagina=1&por_pagina=5'
```

## Convenciones

El contrato público va en **snake_case**, tanto en query params como en los campos de respuesta.
Los precios son enteros en céntimos de colón.

Como no hay tipos, **zod es la única validación**: todo parámetro pasa por un esquema antes de tocar la base.

El detalle completo está en [AGENTS.md](./AGENTS.md), que es también lo que leen los agentes de código.

## Cliente

La app móvil que consume esta API está en el repo `pulpe-app`.
Si cambiás el contrato, el cambio tiene que tocar los dos repos.

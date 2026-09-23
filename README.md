# pulpe-api

Catalog and inventory API for corner stores and mini markets.

Node 20+ · JavaScript (ESM) · Fastify · Prisma · SQLite

No TypeScript, no build step: `node src/server.js` and you're done.

## Getting started

```bash
cp .env.example .env
npm install
npm run setup      # migrates and seeds ~165 products in 8 categories
npm run dev
```

The API is available at `http://localhost:3000`.

> `npm run dev` uses `node --watch --env-file=.env`, which requires Node 20.6 or later.

## Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/products` | Paginated listing of active products |
| GET | `/products/:id` | Detail of a single product |
| GET | `/categories` | Catalog of categories |

Example:

```bash
curl 'http://localhost:3000/products?page=1&per_page=5'
```

## Conventions

The public contract uses **snake_case**, both in query params and response fields.
Prices are integers in colón cents.

Since there are no types, **zod is the only validation**: every parameter goes through a schema before touching the database.

Full details are in [AGENTS.md](./AGENTS.md), which is also what code agents read.

## Client

The mobile app that consumes this API lives in the `pulpe-app` repo.
If you change the contract, the change has to touch both repos.

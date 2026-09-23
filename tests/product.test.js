import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';

/**
 * Tests run against the database seeded with `npm run setup`.
 * Convention: every new endpoint needs at least one happy path case
 * and one invalid parameters case.
 */
let app;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('responds ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});

describe('GET /products', () => {
  it('returns the first page with the standard wrapper', async () => {
    const response = await app.inject({ method: 'GET', url: '/products' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('total');
    expect(body).toHaveProperty('page', 1);
    expect(body).toHaveProperty('per_page', 20);
    expect(body).toHaveProperty('has_next');
    expect(body.items.length).toBeLessThanOrEqual(20);
  });

  it('serializes fields in snake_case', async () => {
    const response = await app.inject({ method: 'GET', url: '/products?per_page=1' });
    const product = response.json().items[0];

    expect(product).toHaveProperty('image_url');
    expect(product).toHaveProperty('created_at');
    expect(product).not.toHaveProperty('imageUrl');
    expect(product).not.toHaveProperty('createdAt');
  });

  it('rejects an invalid page with 422', async () => {
    const response = await app.inject({ method: 'GET', url: '/products?page=0' });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('invalid_params');
  });

  // FIXME(pulpe-812): enable once we define the per_page cap.
  it.skip('caps per_page at a reasonable maximum', async () => {
    const response = await app.inject({ method: 'GET', url: '/products?per_page=100000' });

    expect(response.json().per_page).toBeLessThanOrEqual(100);
  });

  it('filters by search matching the product name', async () => {
    const response = await app.inject({ method: 'GET', url: '/products?search=Leche' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items.length).toBeGreaterThan(0);
    for (const product of body.items) {
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      expect(haystack).toContain('leche');
    }
  });

  it('filters by search matching only the description, case-insensitively', async () => {
    const response = await app.inject({ method: 'GET', url: '/products?search=PRODUCTO' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items.length).toBeGreaterThan(0);
    for (const product of body.items) {
      expect(product.name.toLowerCase()).not.toContain('producto');
      expect(product.description.toLowerCase()).toContain('producto');
    }
  });

  it('filters by category slug', async () => {
    const response = await app.inject({ method: 'GET', url: '/products?category=lacteos' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items.length).toBeGreaterThan(0);
    for (const product of body.items) {
      expect(product.category.slug).toBe('lacteos');
    }
  });

  it('returns an empty page for an unknown category slug', async () => {
    const response = await app.inject({ method: 'GET', url: '/products?category=does-not-exist' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.has_next).toBe(false);
  });

  it('combines search and category with pagination', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/products?search=Dos%20Pinos&category=lacteos&per_page=2',
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items.length).toBeLessThanOrEqual(2);
    expect(body.total).toBeGreaterThan(2);
    expect(body.has_next).toBe(true);
    for (const product of body.items) {
      expect(product.category.slug).toBe('lacteos');
      const haystack = `${product.name} ${product.description}`.toLowerCase();
      expect(haystack).toContain('dos pinos');
    }
  });

  it('rejects an empty search param with 422', async () => {
    const response = await app.inject({ method: 'GET', url: '/products?search=' });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('invalid_params');
  });
});

describe('GET /products/:id', () => {
  it('returns 404 when the product does not exist', async () => {
    const response = await app.inject({ method: 'GET', url: '/products/does-not-exist' });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe('not_found');
  });
});

describe('GET /categories', () => {
  it('returns categories ordered by name', async () => {
    const response = await app.inject({ method: 'GET', url: '/categories' });
    const names = response.json().items.map((c) => c.name);

    expect(response.statusCode).toBe(200);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'es')));
  });
});

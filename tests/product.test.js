import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

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
});

describe('GET /products/search', () => {
  it('matches products by free text on name or description, case-insensitively', async () => {
    const response = await app.inject({ method: 'GET', url: '/products/search?q=leche' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items.length).toBeGreaterThan(0);
    for (const item of body.items) {
      const haystack = `${item.name} ${item.description}`.toLowerCase();
      expect(haystack).toContain('leche');
    }

    const upper = await app.inject({ method: 'GET', url: '/products/search?q=LECHE' });
    expect(upper.json().total).toBe(body.total);
  });

  it('filters by category slug', async () => {
    const response = await app.inject({ method: 'GET', url: '/products/search?category=lacteos' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items.length).toBeGreaterThan(0);
    for (const item of body.items) {
      expect(item.category.slug).toBe('lacteos');
    }
  });

  it('combines free text and category filters', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/products/search?q=leche&category=lacteos',
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    for (const item of body.items) {
      expect(item.category.slug).toBe('lacteos');
      expect(`${item.name} ${item.description}`.toLowerCase()).toContain('leche');
    }
  });

  it('always paginates at a fixed 15 per page, ignoring a per_page override', async () => {
    const response = await app.inject({ method: 'GET', url: '/products/search?per_page=50' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.per_page).toBe(15);
    expect(body.items.length).toBeLessThanOrEqual(15);
  });

  it('does not include a category_counts field', async () => {
    const response = await app.inject({ method: 'GET', url: '/products/search?q=leche' });

    expect(response.json()).not.toHaveProperty('category_counts');
  });

  it('rejects a blank q with 422', async () => {
    const response = await app.inject({ method: 'GET', url: '/products/search?q=%20%20' });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('invalid_params');
  });

  it('rejects an invalid page with 422', async () => {
    const response = await app.inject({ method: 'GET', url: '/products/search?page=0' });

    expect(response.statusCode).toBe(422);
    expect(response.json().error.code).toBe('invalid_params');
  });

  it('returns an empty page (not an error) when nothing matches', async () => {
    const response = await app.inject({ method: 'GET', url: '/products/search?q=zzzzznotaproduct' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
    expect(body.has_next).toBe(false);
  });

  it('returns an empty page (not an error) for an unknown category slug', async () => {
    const response = await app.inject({ method: 'GET', url: '/products/search?category=does-not-exist' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('excludes inactive products from results', async () => {
    const inactiveProduct = await prisma.product.findFirst({ where: { active: false } });
    if (!inactiveProduct) {
      return;
    }

    const response = await app.inject({
      method: 'GET',
      url: `/products/search?q=${encodeURIComponent(inactiveProduct.name)}`,
    });

    expect(response.json().items.map((item) => item.id)).not.toContain(inactiveProduct.id);
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

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

  it('filters by q, case-insensitively, on a substring of the name', async () => {
    const response = await app.inject({ method: 'GET', url: '/products?q=leche' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items.length).toBeGreaterThan(0);
    for (const product of body.items) {
      expect(product.name.toLowerCase()).toContain('leche');
    }
  });

  it('returns an empty page (not an error) when q matches nothing', async () => {
    const response = await app.inject({ method: 'GET', url: '/products?q=zzznomatch' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('filters by a valid category slug', async () => {
    const response = await app.inject({ method: 'GET', url: '/products?category=lacteos' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items.length).toBeGreaterThan(0);
    for (const product of body.items) {
      expect(product.category.slug).toBe('lacteos');
    }
  });

  it('returns an empty page (not a 422) for an unknown category slug', async () => {
    const response = await app.inject({ method: 'GET', url: '/products?category=does-not-exist' });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.items).toEqual([]);
    expect(body.total).toBe(0);
  });

  it('includes category_counts ordered by name, reflecting q but not category', async () => {
    const base = await app.inject({ method: 'GET', url: '/products?q=leche' });
    const withCategory = await app.inject({ method: 'GET', url: '/products?q=leche&category=lacteos' });
    const withOtherCategory = await app.inject({ method: 'GET', url: '/products?q=leche&category=bebidas' });

    const baseCounts = base.json().category_counts;
    const names = baseCounts.map((entry) => entry.category.name);

    // Matches the same ascending-by-name ordering GET /categories already uses.
    expect(names).toEqual([...names].sort());
    expect(withCategory.json().category_counts).toEqual(baseCounts);
    expect(withOtherCategory.json().category_counts).toEqual(baseCounts);

    const lacteosEntry = baseCounts.find((entry) => entry.category.slug === 'lacteos');
    expect(lacteosEntry.count).toBeGreaterThan(0);
  });

  it('combines q, category and page', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/products?q=leche&category=lacteos&page=1&per_page=2',
    });
    const body = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.page).toBe(1);
    expect(body.per_page).toBe(2);
    expect(body.items.length).toBeLessThanOrEqual(2);
    for (const product of body.items) {
      expect(product.category.slug).toBe('lacteos');
      expect(product.name.toLowerCase()).toContain('leche');
    }
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

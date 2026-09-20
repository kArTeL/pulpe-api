import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { construirApp } from '../src/app.js';

/**
 * Los tests corren contra la base sembrada con `npm run setup`.
 * Convención: cada endpoint nuevo necesita al menos un caso feliz
 * y un caso de parámetros inválidos.
 */
let app;

beforeAll(async () => {
  app = await construirApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('GET /salud', () => {
  it('responde ok', async () => {
    const respuesta = await app.inject({ method: 'GET', url: '/salud' });

    expect(respuesta.statusCode).toBe(200);
    expect(respuesta.json()).toEqual({ estado: 'ok' });
  });
});

describe('GET /productos', () => {
  it('devuelve la primera página con la envoltura estándar', async () => {
    const respuesta = await app.inject({ method: 'GET', url: '/productos' });
    const cuerpo = respuesta.json();

    expect(respuesta.statusCode).toBe(200);
    expect(cuerpo).toHaveProperty('items');
    expect(cuerpo).toHaveProperty('total');
    expect(cuerpo).toHaveProperty('pagina', 1);
    expect(cuerpo).toHaveProperty('por_pagina', 20);
    expect(cuerpo).toHaveProperty('hay_siguiente');
    expect(cuerpo.items.length).toBeLessThanOrEqual(20);
  });

  it('serializa los campos en snake_case', async () => {
    const respuesta = await app.inject({ method: 'GET', url: '/productos?por_pagina=1' });
    const producto = respuesta.json().items[0];

    expect(producto).toHaveProperty('imagen_url');
    expect(producto).toHaveProperty('creado_en');
    expect(producto).not.toHaveProperty('imagenUrl');
    expect(producto).not.toHaveProperty('createdAt');
  });

  it('rechaza una página inválida con 422', async () => {
    const respuesta = await app.inject({ method: 'GET', url: '/productos?pagina=0' });

    expect(respuesta.statusCode).toBe(422);
    expect(respuesta.json().error.codigo).toBe('parametros_invalidos');
  });

  // FIXME(pulpe-812): habilitar cuando definamos el tope de por_pagina.
  it.skip('limita por_pagina a un máximo razonable', async () => {
    const respuesta = await app.inject({ method: 'GET', url: '/productos?por_pagina=100000' });

    expect(respuesta.json().por_pagina).toBeLessThanOrEqual(100);
  });
});

describe('GET /productos/:id', () => {
  it('devuelve 404 cuando el producto no existe', async () => {
    const respuesta = await app.inject({ method: 'GET', url: '/productos/no-existe' });

    expect(respuesta.statusCode).toBe(404);
    expect(respuesta.json().error.codigo).toBe('no_encontrado');
  });
});

describe('GET /categorias', () => {
  it('devuelve las categorías ordenadas por nombre', async () => {
    const respuesta = await app.inject({ method: 'GET', url: '/categorias' });
    const nombres = respuesta.json().items.map((c) => c.nombre);

    expect(respuesta.statusCode).toBe(200);
    expect(nombres).toEqual([...nombres].sort((a, b) => a.localeCompare(b, 'es')));
  });
});

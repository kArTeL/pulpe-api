/**
 * El contrato público de la API usa snake_case, tanto en query params como en
 * los campos de respuesta. Prisma usa camelCase internamente, así que TODA
 * salida pasa por estos serializadores. Ver AGENTS.md → "Contrato de la API".
 */

/** @param {import('@prisma/client').Category} categoria */
export function serializarCategoria(categoria) {
  return {
    id: categoria.id,
    slug: categoria.slug,
    nombre: categoria.nombre,
  };
}

/**
 * @param {import('@prisma/client').Product & {
 *   categoria: import('@prisma/client').Category
 * }} producto
 */
export function serializarProducto(producto) {
  return {
    id: producto.id,
    sku: producto.sku,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    precio: producto.precio,
    existencias: producto.existencias,
    activo: producto.activo,
    imagen_url: producto.imagenUrl,
    categoria: serializarCategoria(producto.categoria),
    creado_en: producto.createdAt.toISOString(),
  };
}

/**
 * Envoltura estándar de toda respuesta paginada de la API.
 *
 * @param {unknown[]} items
 * @param {{ total: number, pagina: number, porPagina: number }} opciones
 */
export function envolverPagina(items, { total, pagina, porPagina }) {
  return {
    items,
    total,
    pagina,
    por_pagina: porPagina,
    hay_siguiente: pagina * porPagina < total,
  };
}

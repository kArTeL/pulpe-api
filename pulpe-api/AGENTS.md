# AGENTS.md — pulpe-api

Instrucciones para cualquier agente de código que trabaje en este repo.
Si algo acá contradice lo que creés que es la convención "normal" de Node, gana este archivo.

## Qué es esto

API de catálogo e inventario para pulperías y minisúper.
**JavaScript puro (ESM), sin TypeScript y sin build step.** Node 20+, Fastify, Prisma sobre SQLite.
La app móvil que la consume vive en el repo `pulpe-app`.

## Comandos

```bash
npm install
npm run setup      # migra la base y la siembra (correr una sola vez)
npm run dev        # servidor en http://localhost:3000
npm test           # vitest
npm run lint       # eslint
```

Antes de dar por terminado cualquier cambio: `npm run lint && npm test`.

## Contrato de la API

**Regla no negociable: el contrato público va en snake_case.** Query params y campos de respuesta.
Prisma usa camelCase internamente; la traducción se hace en `src/schemas/`, nunca en las rutas.

La app móvil está en Dart, donde lo natural es camelCase. Si mandás `ordenPor` en vez de `orden_por`,
el backend responde 422 y la app no muestra nada. Esto no lo agarra ningún compilador: acá no hay tipos,
y del lado de Dart los nombres de los params son strings.

Query params actuales de `GET /productos`:

| param | tipo | por defecto | notas |
|---|---|---|---|
| `pagina` | int > 0 | 1 | |
| `por_pagina` | int > 0 | 20 | sin tope todavía, ver `TODO(pulpe-812)` |

Toda respuesta paginada usa la misma envoltura, construida con `envolverPagina()`:

```json
{
  "items": [],
  "total": 0,
  "pagina": 1,
  "por_pagina": 20,
  "hay_siguiente": false
}
```

Todo error usa el mismo formato, lanzando `ErrorApi`:

```json
{ "error": { "codigo": "parametros_invalidos", "mensaje": "…", "detalles": {} } }
```

Códigos en uso: `no_encontrado` (404), `parametros_invalidos` (422), `error_interno` (500).

## Convenciones de código

- **JavaScript, no TypeScript.** No agregues `.ts`, ni `tsconfig`, ni un paso de compilación. Si querés ayuda del editor, usá comentarios JSDoc como los que ya hay en `src/lib/errores.js` y `src/routes/`.
- **Módulos:** ESM (`import`/`export`), con extensión `.js` explícita en las rutas relativas. Nada de `require`.
- **Validación:** como no hay tipos en tiempo de compilación, **zod es la única defensa**. Todo query param y todo body pasa por un esquema antes de tocar Prisma. Si el parseo falla, se lanza `ErrorApi.parametrosInvalidos()`.
- **Idioma:** el dominio se nombra en español (`producto`, `precio`, `existencias`). Las librerías y sus APIs quedan como están.
- **Precios:** enteros en céntimos de colón. Nunca flotantes, nunca decimales en la base. El formateo es responsabilidad del cliente.
- **Base de datos:** los cambios de esquema van siempre por `npm run db:migrate`. Nunca editar la base a mano ni escribir SQL crudo interpolando strings.
- **Rutas:** una función `rutas<Recurso>` por archivo en `src/routes/`, registrada en `src/app.js`. Nada de lógica de negocio dentro del handler más allá de orquestar.
- **Errores:** nunca devolver stack traces ni mensajes de Prisma al cliente. Ese es el trabajo del handler en `src/app.js`.

## Tests

- Vitest con `app.inject()`, sin levantar puerto.
- Cada endpoint nuevo necesita mínimo dos casos: uno feliz y uno de parámetros inválidos.
- Sin tipos, los tests son la red de seguridad principal: si agregás un campo al contrato, agregá un test que verifique su nombre exacto.
- No borres ni saltes un test para que pase la suite. Si un test estorba, decilo en el PR.

## Qué NO hacer

- No migrar el proyecto a TypeScript ni introducir un build step.
- No agregar dependencias de servicios externos (colas, storage, proveedores de push, APIs de terceros). Este proyecto corre entero en local con SQLite, a propósito.
- No cambiar el formato de la envoltura de paginación ni el de errores sin actualizar `pulpe-app` en el mismo cambio.
- No renombrar campos del contrato público sin migrar el cliente.

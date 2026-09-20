/**
 * Error de dominio con código HTTP. El manejador global de Fastify lo traduce
 * al formato de respuesta estándar de la API (ver AGENTS.md).
 */
export class ErrorApi extends Error {
  /**
   * @param {number} status
   * @param {string} codigo
   * @param {string} mensaje
   * @param {unknown} [detalles]
   */
  constructor(status, codigo, mensaje, detalles) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
    this.codigo = codigo;
    this.detalles = detalles;
  }

  /** @param {string} recurso */
  static noEncontrado(recurso) {
    return new ErrorApi(404, 'no_encontrado', `No existe ${recurso}.`);
  }

  /** @param {unknown} detalles */
  static parametrosInvalidos(detalles) {
    return new ErrorApi(
      422,
      'parametros_invalidos',
      'Los parámetros de la petición no son válidos.',
      detalles,
    );
  }
}

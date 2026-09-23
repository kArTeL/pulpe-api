/**
 * Domain error with an HTTP status. Fastify's global error handler translates it
 * into the API's standard response format (see AGENTS.md).
 */
export class ApiError extends Error {
  /**
   * @param {number} status
   * @param {string} code
   * @param {string} message
   * @param {unknown} [details]
   */
  constructor(status, code, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** @param {string} resource */
  static notFound(resource) {
    return new ApiError(404, 'not_found', `${resource} does not exist.`);
  }

  /** @param {unknown} details */
  static invalidParams(details) {
    return new ApiError(
      422,
      'invalid_params',
      'The request parameters are not valid.',
      details,
    );
  }
}

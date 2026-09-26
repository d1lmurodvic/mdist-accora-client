/**
 * Client-side error types for the API envelope (API_CONTRACT.md §3, §4).
 * Screens branch on `code` / `kind`, never on `message`.
 */

const KIND_BY_CODE = {
  VALIDATION_ERROR: 'validation',
  INVALID_JSON: 'validation',
  UNAUTHENTICATED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  UNPROCESSABLE: 'unprocessable',
  PAYLOAD_TOO_LARGE: 'validation',
  UNSUPPORTED_MEDIA_TYPE: 'validation',
  RATE_LIMITED: 'rate_limited',
  AI_UNAVAILABLE: 'unavailable',
  EXTERNAL_SERVICE_ERROR: 'server',
  INTERNAL_ERROR: 'server',
};

export class ApiError extends Error {
  constructor({ status, code, message, details, requestId, retryAfter }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details ?? null;
    this.requestId = requestId ?? null;
    this.retryAfter = retryAfter ?? null;
    this.kind = KIND_BY_CODE[code] ?? (status >= 500 ? 'server' : 'unknown');
  }

  static fromResponse(response, payload) {
    const error = payload?.error;
    const retry = Number(response.headers.get('retry-after'));
    return new ApiError({
      status: response.status,
      code: error?.code ?? (response.status >= 500 ? 'INTERNAL_ERROR' : 'UNKNOWN'),
      message: error?.message ?? 'The request could not be completed.',
      details: error?.details,
      requestId: error?.requestId ?? response.headers.get('x-request-id'),
      retryAfter: Number.isFinite(retry) && retry > 0 ? retry : null,
    });
  }

  /** Field → message map for forms (details: [{ field, issue }]). */
  fieldErrors() {
    if (!Array.isArray(this.details)) return {};
    const fields = {};
    for (const item of this.details) {
      if (item?.field && !fields[item.field]) fields[item.field] = item.issue;
    }
    return fields;
  }
}

export class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
    this.kind = 'network';
  }
}

/** A short, safe, human sentence for any thrown error. */
export function describeError(error) {
  if (error instanceof NetworkError) return error.message;
  if (error instanceof ApiError) {
    if (error.kind === 'rate_limited') {
      return error.retryAfter ? `Too many attempts. Try again in ${error.retryAfter} seconds.` : 'Too many attempts. Try again shortly.';
    }
    if (error.kind === 'server') return 'Something went wrong on our side. Please try again.';
    return error.message;
  }
  return 'Something unexpected happened.';
}

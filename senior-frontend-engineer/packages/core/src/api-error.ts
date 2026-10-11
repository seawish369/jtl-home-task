/**
 * - `network`: no response at all (offline, DNS, CORS). `status` is undefined.
 * - `http`: the server answered with a non-2xx status.
 * - `invalid-response`: a 2xx response whose body didn't match the expected schema.
 */
export type ApiErrorKind = 'network' | 'http' | 'invalid-response';

type ApiErrorOptions = {
  kind: ApiErrorKind;
  message: string;
  status?: number;
  fieldErrors?: Record<string, string>;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;
  /** Per-field messages from a 4xx validation error, keyed by field name. */
  readonly fieldErrors: Record<string, string>;

  constructor({ kind, message, status, fieldErrors = {}, cause }: ApiErrorOptions) {
    super(message, { cause });
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isNotFoundError(error: unknown): error is ApiError {
  return isApiError(error) && error.kind === 'http' && error.status === 404;
}

export function isNetworkError(error: unknown): error is ApiError {
  return isApiError(error) && error.kind === 'network';
}

export function isServerError(error: unknown): error is ApiError {
  return isApiError(error) && error.kind === 'http' && error.status !== undefined && error.status >= 500;
}

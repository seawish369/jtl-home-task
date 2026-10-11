import * as z from 'zod';
import { ApiError } from './api-error';

const API_BASE = '/api';

/** Error body contract shared with the mock API. */
const errorBodySchema = z.object({
  message: z.string(),
  fieldErrors: z.record(z.string(), z.string()).optional(),
});

type RequestOptions<T> = {
  /** Validates the success body; the parsed value is what the caller gets. */
  schema: z.ZodType<T>;
  /** Pass TanStack Query's signal so cancelled queries abort the request. */
  signal?: AbortSignal;
};

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  { schema, signal, body }: RequestOptions<T> & { body?: unknown },
): Promise<T> {
  let response: Response;
  let data: unknown;
  try {
    response = await fetch(API_BASE + path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
    data = await readJson(response);
  } catch (error) {
    // Rethrow aborts untouched so TanStack Query treats them as cancellations.
    if (signal?.aborted) throw error;
    throw new ApiError({
      kind: 'network',
      message: 'Could not reach the server. Check your connection and try again.',
      cause: error,
    });
  }

  if (!response.ok) {
    const parsed = errorBodySchema.safeParse(data);
    throw new ApiError({
      kind: 'http',
      status: response.status,
      message: parsed.success ? parsed.data.message : `Request failed (${response.status}).`,
      fieldErrors: parsed.success ? parsed.data.fieldErrors : undefined,
    });
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new ApiError({
      kind: 'invalid-response',
      status: response.status,
      message: 'The server sent an unexpected response.',
      cause: parsed.error,
    });
  }
  return parsed.data;
}

/** Empty or non-JSON bodies become undefined; the schema check then decides. */
async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === '') return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export const http = {
  get: <T>(path: string, options: RequestOptions<T>) => request('GET', path, options),
  post: <T>(path: string, body: unknown, options: RequestOptions<T>) => request('POST', path, { ...options, body }),
};

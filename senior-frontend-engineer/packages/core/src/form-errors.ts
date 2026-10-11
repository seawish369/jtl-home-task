import type * as z from 'zod';

/**
 * Turns a ZodError into { field: firstMessage }, the same shape as
 * ApiError.fieldErrors, so forms show client and server errors the same way.
 */
export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = issue.path[0];
    if (typeof field === 'string' && !(field in fieldErrors)) fieldErrors[field] = issue.message;
  }
  return fieldErrors;
}

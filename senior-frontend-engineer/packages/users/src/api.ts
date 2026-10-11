import { http } from '@todo-app/core';
import * as z from 'zod';
import { userSchema } from './schemas';

export function listUsers(signal?: AbortSignal) {
  return http.get('/users', { schema: z.array(userSchema), signal });
}

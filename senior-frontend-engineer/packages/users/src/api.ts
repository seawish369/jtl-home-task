import { http } from '@todo-app/core';
import * as z from 'zod';
import { userSchema, type CreateUserInput } from './schemas';

export function listUsers(signal?: AbortSignal) {
  return http.get('/users', { schema: z.array(userSchema), signal });
}

export function getUser(userId: string, signal?: AbortSignal) {
  return http.get(`/users/${encodeURIComponent(userId)}`, { schema: userSchema, signal });
}

export function createUser(input: CreateUserInput) {
  return http.post('/users', input, { schema: userSchema });
}

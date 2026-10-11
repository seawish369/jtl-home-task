import { http } from '@todo-app/core';
import * as z from 'zod';
import { todoSchema, type CreateTodoInput } from './schemas';

/** Oldest first, as the server returns them. */
export function listTodos(assigneeId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ assigneeId });
  return http.get(`/todos?${query}`, { schema: z.array(todoSchema), signal });
}

export function createTodo(input: CreateTodoInput) {
  return http.post('/todos', input, { schema: todoSchema });
}

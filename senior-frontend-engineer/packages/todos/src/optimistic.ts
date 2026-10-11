import type { Todo } from './schemas';

// Optimistic items live in the list cache with a temporary ID until the server answers.
const TEMP_ID_PREFIX = 'temp-';

export const createTempId = () => `${TEMP_ID_PREFIX}${crypto.randomUUID()}`;

export const isOptimisticTodo = (todo: Todo) => todo.id.startsWith(TEMP_ID_PREFIX);

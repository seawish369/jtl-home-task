import { queryOptions } from '@tanstack/react-query';
import { listTodos } from './api';
import { isOptimisticTodo } from './optimistic';
import type { Todo } from './schemas';

export const todosKeys = {
  all: ['todos'] as const,
  lists: () => [...todosKeys.all, 'list'] as const,
  list: (assigneeId: string) => [...todosKeys.lists(), assigneeId] as const,
};

export const todosQueries = {
  list: (assigneeId: string) =>
    queryOptions({
      queryKey: todosKeys.list(assigneeId),
      queryFn: async ({ signal, client, queryKey }) => {
        const todos = await listTodos(assigneeId, signal);
        // A refetch (e.g. on window focus) can finish while a create is still pending.
        // Keep the optimistic items that are in the cache right now, so they don't
        // vanish and reappear. Rolled-back or swapped items are already gone by then.
        const pending = (client.getQueryData<Todo[]>(queryKey) ?? []).filter(isOptimisticTodo);
        return pending.length > 0 ? [...todos, ...pending] : todos;
      },
    }),
};

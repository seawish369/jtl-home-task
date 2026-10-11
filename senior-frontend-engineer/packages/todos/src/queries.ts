import { queryOptions } from '@tanstack/react-query';
import { listTodos } from './api';

export const todosKeys = {
  all: ['todos'] as const,
  lists: () => [...todosKeys.all, 'list'] as const,
  list: (assigneeId: string) => [...todosKeys.lists(), assigneeId] as const,
};

export const todosQueries = {
  list: (assigneeId: string) =>
    queryOptions({
      queryKey: todosKeys.list(assigneeId),
      queryFn: ({ signal }) => listTodos(assigneeId, signal),
    }),
};

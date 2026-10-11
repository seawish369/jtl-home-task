import { queryOptions } from '@tanstack/react-query';
import { listUsers } from './api';

const usersKeys = {
  all: ['users'] as const,
  list: () => [...usersKeys.all, 'list'] as const,
};

export const usersQueries = {
  list: () =>
    queryOptions({
      queryKey: usersKeys.list(),
      queryFn: ({ signal }) => listUsers(signal),
    }),
};

import { queryOptions } from '@tanstack/react-query';
import { getUser, listUsers } from './api';

export const usersKeys = {
  all: ['users'] as const,
  list: () => [...usersKeys.all, 'list'] as const,
  detail: (userId: string) => [...usersKeys.all, 'detail', userId] as const,
};

export const usersQueries = {
  list: () =>
    queryOptions({
      queryKey: usersKeys.list(),
      queryFn: ({ signal }) => listUsers(signal),
    }),
  detail: (userId: string) =>
    queryOptions({
      queryKey: usersKeys.detail(userId),
      queryFn: ({ signal }) => getUser(userId, signal),
    }),
};

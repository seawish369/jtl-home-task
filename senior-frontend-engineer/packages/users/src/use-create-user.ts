import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUser } from './api';
import { usersKeys, usersQueries } from './queries';

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: (user) => {
      // Seed the detail cache so opening the new user needs no extra request.
      queryClient.setQueryData(usersQueries.detail(user.id).queryKey, user);
      // Add them to the cached list right away too: pages render from the cache before
      // the refetch below lands, and e.g. the todo form only preselects listed users.
      queryClient.setQueryData(usersQueries.list().queryKey, (users) =>
        users && !users.some((existing) => existing.id === user.id) ? [...users, user] : users,
      );
      // Not awaited: the list refreshes in the background while the caller moves on.
      void queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
}

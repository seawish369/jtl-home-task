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
      // Not awaited: the list refreshes in the background while the caller moves on.
      void queryClient.invalidateQueries({ queryKey: usersKeys.list() });
    },
  });
}

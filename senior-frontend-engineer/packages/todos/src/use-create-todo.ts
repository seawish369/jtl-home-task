import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTodo } from './api';
import { todosKeys } from './queries';

// Shared key for all todo creates, so we can tell when the last one settles (step 6).
export const createTodoMutationKey = [...todosKeys.all, 'create'] as const;

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: createTodoMutationKey,
    mutationFn: createTodo,
    onSuccess: (todo) => queryClient.invalidateQueries({ queryKey: todosKeys.list(todo.assigneeId) }),
  });
}

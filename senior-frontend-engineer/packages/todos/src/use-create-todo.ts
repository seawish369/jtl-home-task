import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { createTodo } from './api';
import { createTempId } from './optimistic';
import { todosKeys, todosQueries } from './queries';
import type { CreateTodoInput, Todo } from './schemas';

// Shared key for all todo creates, so we can count the ones still pending.
export const createTodoMutationKey = [...todosKeys.all, 'create'] as const;

type CreateTodoContext = { tempId: string };

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation<Todo, Error, CreateTodoInput, CreateTodoContext>({
    mutationKey: createTodoMutationKey,
    mutationFn: createTodo,

    onMutate: async (input) => {
      const listKey = todosKeys.list(input.assigneeId);
      const tempId = createTempId();
      // List not loaded yet: write nothing and let its first load finish.
      // (Writing [newTodo] would make it look loaded with just one item.)
      if (queryClient.getQueryData(listKey) === undefined) return { tempId };

      // Stop a background refetch from overwriting the optimistic item.
      await queryClient.cancelQueries({ queryKey: listKey, exact: true });
      queryClient.setQueryData<Todo[]>(listKey, (todos) =>
        todos && [...todos, { id: tempId, ...input, createdAt: new Date().toISOString() }],
      );
      return { tempId };
    },

    onSuccess: (saved, input, context) => {
      queryClient.setQueryData<Todo[]>(todosKeys.list(input.assigneeId), (todos) =>
        todos && swapIn(todos, context.tempId, saved),
      );
    },

    onError: (_error, input, context) => {
      if (!context) return;
      // Remove only this create's item; other pending creates stay.
      queryClient.setQueryData<Todo[]>(todosKeys.list(input.assigneeId), (todos) =>
        todos?.filter((todo) => todo.id !== context.tempId),
      );
    },

    onSettled: (_saved, _error, input) => {
      // Re-sync with the server only when the last pending create for this assignee
      // settles; an earlier refetch could drop items that are still pending.
      // Not awaited, so this mutation stops counting as pending right away.
      if (countPendingCreates(queryClient, input.assigneeId) === 1) {
        void syncList(queryClient, input.assigneeId);
      }
    },
  });
}

/** Put the saved todo where its optimistic item was, without ever duplicating it. */
function swapIn(todos: Todo[], tempId: string, saved: Todo): Todo[] {
  // A refetch already brought the real item: just drop the optimistic one.
  if (todos.some((todo) => todo.id === saved.id)) return todos.filter((todo) => todo.id !== tempId);
  if (todos.some((todo) => todo.id === tempId)) return todos.map((todo) => (todo.id === tempId ? saved : todo));
  // The list loaded after the create started (no optimistic item): append.
  return [...todos, saved];
}

// isMutating counts the calling mutation too: onSettled runs before its status changes.
function countPendingCreates(queryClient: QueryClient, assigneeId: string): number {
  return queryClient.isMutating({
    mutationKey: createTodoMutationKey,
    predicate: (mutation) => (mutation.state.variables as CreateTodoInput | undefined)?.assigneeId === assigneeId,
  });
}

async function syncList(queryClient: QueryClient, assigneeId: string): Promise<void> {
  const listKey = todosKeys.list(assigneeId);
  const query = queryClient.getQueryCache().find({ queryKey: listKey, exact: true });
  if (!query) return; // nobody has loaded this list, nothing to re-sync

  // First load still running: join it (fetchQuery doesn't cancel a fetch that has no
  // data yet), then refetch, because it may have started before the todo was saved.
  if (query.state.data === undefined && query.state.fetchStatus === 'fetching') {
    await queryClient.fetchQuery(todosQueries.list(assigneeId)).catch(() => undefined);
  }
  await queryClient.invalidateQueries({ queryKey: listKey, exact: true });
}

import { useQuery } from '@tanstack/react-query';
import { isNetworkError, isNotFoundError } from '@todo-app/core';
import { Alert, Button } from '@todo-app/ui';
import { todosQueries } from './queries';
import { TodoList } from './TodoList';

function errorMessage(error: unknown): string {
  if (isNotFoundError(error)) return 'No user with this ID.';
  if (isNetworkError(error)) return 'Could not reach the server. Check your connection and try again.';
  return 'The todos could not be loaded.';
}

// Loads its own data (not Suspense): the assignee can come from the URL, the page,
// or app state, and the create form must stay usable while the list loads.
export function AssigneeTodoList({ assigneeId }: { assigneeId: string }) {
  const query = useQuery(todosQueries.list(assigneeId));

  if (query.isPending) {
    return (
      <p role="status" className="text-slate-600">
        Loading todos…
      </p>
    );
  }
  // Keep showing data we already have if a background refetch fails.
  if (!query.data) {
    return (
      <div className="space-y-3">
        <Alert>{errorMessage(query.error)}</Alert>
        {!isNotFoundError(query.error) && <Button variant="secondary" onClick={() => void query.refetch()}>Try again</Button>}
      </div>
    );
  }
  if (query.data.length === 0) {
    return <p className="text-slate-600">No todos yet.</p>;
  }
  return <TodoList todos={query.data} />;
}

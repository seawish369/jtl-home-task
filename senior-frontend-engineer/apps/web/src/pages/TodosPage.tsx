import { getRouteApi } from '@tanstack/react-router';
import { PageHeading } from '../components/PageHeading';

const route = getRouteApi('/todos');

// Placeholder: the todo list and form are built in step 5.
export function TodosPage() {
  const { assigneeId } = route.useSearch();

  return (
    <>
      <PageHeading>Todos</PageHeading>
      <p className="mt-2 text-slate-600">
        {assigneeId ? (
          <>
            assigneeId from the URL: <code>{assigneeId}</code>
          </>
        ) : (
          'No assignee in the URL.'
        )}
      </p>
    </>
  );
}

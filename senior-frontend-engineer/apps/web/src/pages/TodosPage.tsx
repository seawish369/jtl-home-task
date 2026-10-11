import { getRouteApi } from '@tanstack/react-router';
import { AssigneeTodoList, CreateTodoForm } from '@todo-app/todos';
import { SelectField } from '@todo-app/ui';
import { PageHeading } from '../components/PageHeading';
import { useAssigneeOptions } from '../use-assignee-options';

const route = getRouteApi('/todos');

export function TodosPage() {
  const { assigneeId } = route.useSearch();
  const navigate = route.useNavigate();
  const assigneeOptions = useAssigneeOptions();
  const assignee = assigneeOptions.find((option) => option.id === assigneeId);

  return (
    <>
      <PageHeading>Todos</PageHeading>

      <SelectField
        className="mt-6 max-w-xs"
        label="Show todos for"
        value={assigneeId ?? ''}
        onChange={(event) => void navigate({ search: { assigneeId: event.target.value || undefined } })}
      >
        <option value="">Choose a user</option>
        {assigneeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <section aria-labelledby="todo-list-heading" className="mt-6">
        <h2 id="todo-list-heading" className="mb-2 text-lg font-semibold text-slate-900">
          {assignee ? `Todos for ${assignee.label}` : 'Todos'}
        </h2>
        {assigneeId ? (
          <AssigneeTodoList assigneeId={assigneeId} />
        ) : (
          <p className="text-slate-600">Choose a user to see their todos.</p>
        )}
      </section>

      <section aria-labelledby="add-todo-heading" className="mt-8 rounded-md border border-slate-200 bg-white p-4">
        <h2 id="add-todo-heading" className="mb-3 text-lg font-semibold text-slate-900">
          Add a todo
        </h2>
        {/* Remount when the filter changes so the preselected assignee follows it. */}
        <CreateTodoForm key={assigneeId ?? 'none'} assigneeOptions={assigneeOptions} defaultAssigneeId={assigneeId} />
      </section>
    </>
  );
}

import { getRouteApi } from '@tanstack/react-router';
import { AssigneeTodoList, CreateTodoForm } from '@todo-app/todos';
import { SelectField } from '@todo-app/ui';
import { useMemo } from 'react';
import { PageHeading } from '../components/PageHeading';
import { resolveAssignee } from '../resolve-assignee';
import { useActiveUserId } from '../state/active-user';
import { useAssigneeOptions } from '../use-assignee-options';

const route = getRouteApi('/todos');

export function TodosPage() {
  const { assigneeId: urlAssigneeId } = route.useSearch();
  const navigate = route.useNavigate();
  const assigneeOptions = useAssigneeOptions();
  const activeUserId = useActiveUserId();
  const validIds = useMemo(() => new Set(assigneeOptions.map((option) => option.id)), [assigneeOptions]);
  const { listAssigneeId, formAssigneeId } = resolveAssignee({ urlAssigneeId, activeUserId, validIds });

  const labelFor = (id: string | null | undefined) => assigneeOptions.find((option) => option.id === id)?.label;
  const activeLabel = labelFor(activeUserId);
  const listLabel = labelFor(listAssigneeId);

  return (
    <>
      <PageHeading>Todos</PageHeading>

      <SelectField
        className="mt-6 max-w-xs"
        label="Show todos for"
        value={urlAssigneeId ?? ''}
        onChange={(event) => void navigate({ search: { assigneeId: event.target.value || undefined } })}
      >
        {/* No assignee in the URL means "the active user", if there is one. */}
        <option value="">{activeLabel ? `Active user (${activeLabel})` : 'Choose a user'}</option>
        {/* Without this, a select can't show a value it has no option for and falls back
            to the first option, which would claim the active user's list is shown. */}
        {urlAssigneeId && !validIds.has(urlAssigneeId) && <option value={urlAssigneeId}>Unknown user</option>}
        {assigneeOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <section aria-labelledby="todo-list-heading" className="mt-6">
        <h2 id="todo-list-heading" className="mb-2 text-lg font-semibold text-slate-900">
          {listLabel ? `Todos for ${listLabel}` : 'Todos'}
        </h2>
        {listAssigneeId ? (
          <AssigneeTodoList assigneeId={listAssigneeId} />
        ) : (
          <p className="text-slate-600">Choose a user above, or pick who you're working as in the header.</p>
        )}
      </section>

      <section aria-labelledby="add-todo-heading" className="mt-8 rounded-md border border-slate-200 bg-white p-4">
        <h2 id="add-todo-heading" className="mb-3 text-lg font-semibold text-slate-900">
          Add a todo
        </h2>
        {/* Remount when the preselected assignee changes so the form follows it. */}
        <CreateTodoForm key={formAssigneeId ?? 'none'} assigneeOptions={assigneeOptions} defaultAssigneeId={formAssigneeId} />
      </section>
    </>
  );
}

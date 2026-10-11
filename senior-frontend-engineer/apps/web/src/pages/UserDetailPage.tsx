import { useSuspenseQuery } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';
import { AssigneeTodoList, CreateTodoForm } from '@todo-app/todos';
import { UserDetails, usersQueries } from '@todo-app/users';
import { PageHeading } from '../components/PageHeading';
import { useAssigneeOptions } from '../use-assignee-options';

const route = getRouteApi('/users/$userId');

export function UserDetailPage() {
  const { userId } = route.useParams();
  const { data: user } = useSuspenseQuery(usersQueries.detail(userId));
  const assigneeOptions = useAssigneeOptions();

  return (
    <>
      <PageHeading>{user.username}</PageHeading>
      <UserDetails user={user} className="mt-4" />

      <section aria-labelledby="user-todos-heading" className="mt-8">
        <h2 id="user-todos-heading" className="mb-2 text-lg font-semibold text-slate-900">
          Todos
        </h2>
        <AssigneeTodoList assigneeId={user.id} />
      </section>

      <section aria-labelledby="add-todo-heading" className="mt-8 rounded-md border border-slate-200 bg-white p-4">
        <h2 id="add-todo-heading" className="mb-3 text-lg font-semibold text-slate-900">
          Add a todo
        </h2>
        {/* The page's user wins as the default assignee. */}
        <CreateTodoForm key={user.id} assigneeOptions={assigneeOptions} defaultAssigneeId={user.id} />
      </section>

      <p className="mt-6">
        <Link to="/users" className="text-blue-700 underline">
          Back to users
        </Link>
      </p>
    </>
  );
}

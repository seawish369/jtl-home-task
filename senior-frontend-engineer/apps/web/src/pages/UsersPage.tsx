import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { CreateUserForm, usersQueries } from '@todo-app/users';
import { PageHeading } from '../components/PageHeading';

export function UsersPage() {
  const navigate = useNavigate();
  // The route loader has already fetched this; the query keeps it fresh.
  const { data: users } = useSuspenseQuery(usersQueries.list());

  return (
    <>
      <PageHeading>Users</PageHeading>

      <section aria-labelledby="create-user-heading" className="mt-6 rounded-md border border-slate-200 bg-white p-4">
        <h2 id="create-user-heading" className="mb-3 text-lg font-semibold text-slate-900">
          Create a user
        </h2>
        <CreateUserForm onCreated={(user) => void navigate({ to: '/users/$userId', params: { userId: user.id } })} />
      </section>

      <section aria-labelledby="all-users-heading" className="mt-8">
        <h2 id="all-users-heading" className="text-lg font-semibold text-slate-900">
          All users
        </h2>
        {users.length === 0 ? (
          <p className="mt-2 text-slate-600">No users yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
            {users.map((user) => (
              <li key={user.id}>
                <Link
                  to="/users/$userId"
                  params={{ userId: user.id }}
                  className="block px-4 py-2 text-blue-700 hover:bg-slate-50"
                >
                  {user.username}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

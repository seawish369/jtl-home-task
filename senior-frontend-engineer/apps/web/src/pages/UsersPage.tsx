import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { usersQueries } from '@todo-app/users';
import { PageHeading } from '../components/PageHeading';

export function UsersPage() {
  // The route loader has already fetched this; the query keeps it fresh.
  const { data: users } = useSuspenseQuery(usersQueries.list());

  return (
    <>
      <PageHeading>Users</PageHeading>
      {users.length === 0 ? (
        <p className="mt-4 text-slate-600">No users yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
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
    </>
  );
}

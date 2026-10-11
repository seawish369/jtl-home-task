import { useSuspenseQuery } from '@tanstack/react-query';
import { getRouteApi, Link } from '@tanstack/react-router';
import { UserDetails, usersQueries } from '@todo-app/users';
import { PageHeading } from '../components/PageHeading';

const route = getRouteApi('/users/$userId');

// The user's todos and a create form are added in step 5.
export function UserDetailPage() {
  const { userId } = route.useParams();
  const { data: user } = useSuspenseQuery(usersQueries.detail(userId));

  return (
    <>
      <PageHeading>{user.username}</PageHeading>
      <UserDetails user={user} className="mt-4" />
      <p className="mt-6">
        <Link to="/users" className="text-blue-700 underline">
          Back to users
        </Link>
      </p>
    </>
  );
}

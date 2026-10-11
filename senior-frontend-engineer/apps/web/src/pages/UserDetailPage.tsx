import { getRouteApi, Link } from '@tanstack/react-router';
import { PageHeading } from '../components/PageHeading';

const route = getRouteApi('/users/$userId');

// Placeholder: the user detail (and their todos) are built in steps 4 and 5.
export function UserDetailPage() {
  const { userId } = route.useParams();

  return (
    <>
      <PageHeading>User</PageHeading>
      <p className="mt-2 text-slate-600">
        User ID from the path: <code>{userId}</code>
      </p>
      <p className="mt-4">
        <Link to="/users" className="text-blue-700 underline">
          Back to users
        </Link>
      </p>
    </>
  );
}

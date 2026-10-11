import { Link } from '@tanstack/react-router';
import { PageHeading } from './PageHeading';

export function UserNotFound() {
  return (
    <>
      <PageHeading>User not found</PageHeading>
      <p className="mt-2 text-slate-600">No user exists with this ID. The link may be wrong or out of date.</p>
      <p className="mt-4">
        <Link to="/users" className="text-blue-700 underline">
          Back to users
        </Link>
      </p>
    </>
  );
}

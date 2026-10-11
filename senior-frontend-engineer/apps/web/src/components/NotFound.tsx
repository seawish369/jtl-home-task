import { Link } from '@tanstack/react-router';
import { PageHeading } from './PageHeading';

export function NotFound() {
  return (
    <>
      <PageHeading>Page not found</PageHeading>
      <p className="mt-2 text-slate-600">There is no page at this address.</p>
      <p className="mt-4">
        <Link to="/" className="text-blue-700 underline">
          Go to the start page
        </Link>
      </p>
    </>
  );
}

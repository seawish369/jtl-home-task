import { Link } from '@tanstack/react-router';
import { PageHeading } from '../components/PageHeading';

export function HomePage() {
  return (
    <>
      <PageHeading>Todo app</PageHeading>
      <p className="mt-2 text-slate-600">Create users and assign todos to them.</p>
      <ul className="mt-4 list-disc space-y-1 pl-5">
        <li>
          <Link to="/users" className="text-blue-700 underline">
            Users
          </Link>
        </li>
        <li>
          <Link to="/todos" className="text-blue-700 underline">
            Todos
          </Link>
        </li>
      </ul>
    </>
  );
}

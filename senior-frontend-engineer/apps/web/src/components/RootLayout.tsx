import { Link, Outlet, useRouterState } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { ActiveUserPicker } from './ActiveUserPicker';

const navLinkClass =
  'rounded px-2 py-1 text-slate-700 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600';

// aria-current="page" only on the exact page (any search params); the underline marks the
// whole section, so "Users" stays highlighted on /users/$userId without claiming to be it.
function NavLink({ to, children }: { to: '/users' | '/todos'; children: ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const inSection = pathname === to || pathname.startsWith(`${to}/`);
  return (
    <Link to={to} activeOptions={{ exact: true, includeSearch: false }} className={`${navLinkClass} ${inSection ? 'font-semibold underline' : ''}`}>
      {children}
    </Link>
  );
}

export function RootLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <a
        href="#main"
        className="sr-only rounded bg-white px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
          <Link to="/" className="font-semibold text-slate-900">
            Todo app
          </Link>
          <nav aria-label="Main">
            <ul className="flex gap-2">
              <li>
                <NavLink to="/users">Users</NavLink>
              </li>
              <li>
                <NavLink to="/todos">Todos</NavLink>
              </li>
            </ul>
          </nav>
          <ActiveUserPicker />
        </div>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-8 focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
}

import { Link, Outlet } from '@tanstack/react-router';
import { ActiveUserPicker } from './ActiveUserPicker';

const navLinkClass =
  'rounded px-2 py-1 text-slate-700 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600';

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
                <Link to="/users" className={navLinkClass} activeProps={{ className: 'font-semibold underline' }}>
                  Users
                </Link>
              </li>
              <li>
                <Link to="/todos" className={navLinkClass} activeProps={{ className: 'font-semibold underline' }}>
                  Todos
                </Link>
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

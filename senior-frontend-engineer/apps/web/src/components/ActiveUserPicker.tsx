import { useQuery } from '@tanstack/react-query';
import { usersQueries } from '@todo-app/users';
import { useAtom } from 'jotai';
import { useEffect, useId } from 'react';
import { activeUserIdAtom } from '../state/active-user';

// Lives in the header on every page. A plain useQuery (not Suspense), so loading or
// failing users never suspends or breaks the layout.
export function ActiveUserPicker() {
  const id = useId();
  const [activeUserId, setActiveUserId] = useAtom(activeUserIdAtom);
  const users = useQuery(usersQueries.list());

  // Forget a saved user that no longer exists, but only after a successful load:
  // an error says nothing about whether the user exists.
  useEffect(() => {
    if (users.status !== 'success' || activeUserId === null) return;
    if (!users.data.some((user) => user.id === activeUserId)) setActiveUserId(null);
  }, [users.status, users.data, activeUserId, setActiveUserId]);

  const value = activeUserId !== null && users.data?.some((user) => user.id === activeUserId) ? activeUserId : '';

  return (
    <div className="flex items-center gap-2 text-sm">
      <label htmlFor={id} className="text-slate-600">
        Working as
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => setActiveUserId(event.target.value || null)}
        disabled={!users.data}
        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
      >
        {users.data ? (
          <>
            <option value="">Nobody</option>
            {users.data.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username}
              </option>
            ))}
          </>
        ) : (
          <option value="">{users.isError ? 'Users unavailable' : 'Loading users…'}</option>
        )}
      </select>
    </div>
  );
}

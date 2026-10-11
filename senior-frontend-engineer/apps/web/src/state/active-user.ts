import { useQuery } from '@tanstack/react-query';
import { usersQueries } from '@todo-app/users';
import { useAtomValue } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

/**
 * The user you're "working as": a UI default, not a login. Only the ID is stored,
 * in localStorage so it survives a reload. getOnInit reads storage on the first
 * render (Jotai's default would render `null` first and flash the empty state).
 */
export const activeUserIdAtom = atomWithStorage<string | null>('todo-app:active-user-id', null, undefined, {
  getOnInit: true,
});

/** The saved active user, but only if the users list confirms it exists. */
export function useActiveUserId(): string | null {
  const activeUserId = useAtomValue(activeUserIdAtom);
  const { data: users } = useQuery(usersQueries.list());
  return activeUserId !== null && users?.some((user) => user.id === activeUserId) ? activeUserId : null;
}

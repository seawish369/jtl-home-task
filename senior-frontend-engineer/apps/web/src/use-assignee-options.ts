import { useSuspenseQuery } from '@tanstack/react-query';
import type { AssigneeOption } from '@todo-app/todos';
import { usersQueries } from '@todo-app/users';
import { useMemo } from 'react';

// Where the two features meet: users become the todo form's assignee options.
// Only apps/web knows both packages.
export function useAssigneeOptions(): AssigneeOption[] {
  const { data: users } = useSuspenseQuery(usersQueries.list());
  return useMemo(() => users.map((user) => ({ id: user.id, label: user.username })), [users]);
}

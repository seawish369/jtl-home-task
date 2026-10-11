import type { Todo } from './schemas';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
      {todos.map((todo) => (
        <li key={todo.id} className="flex items-baseline justify-between gap-4 px-4 py-2">
          <span className="text-slate-900">{todo.title}</span>
          <time dateTime={todo.createdAt} className="shrink-0 text-xs text-slate-500">
            {dateFormat.format(new Date(todo.createdAt))}
          </time>
        </li>
      ))}
    </ul>
  );
}

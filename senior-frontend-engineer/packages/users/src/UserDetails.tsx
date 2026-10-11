import type { User } from './schemas';

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

export function UserDetails({ user, className }: { user: User; className?: string }) {
  return (
    <dl className={['grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm', className].filter(Boolean).join(' ')}>
      <dt className="font-medium text-slate-600">Username</dt>
      <dd className="text-slate-900">{user.username}</dd>
      <dt className="font-medium text-slate-600">Member since</dt>
      <dd className="text-slate-900">
        <time dateTime={user.createdAt}>{dateFormat.format(new Date(user.createdAt))}</time>
      </dd>
      <dt className="font-medium text-slate-600">User ID</dt>
      <dd className="break-all text-slate-900">
        <code>{user.id}</code>
      </dd>
    </dl>
  );
}

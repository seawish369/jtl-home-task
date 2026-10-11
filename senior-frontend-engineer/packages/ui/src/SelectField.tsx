import { useId, type ComponentPropsWithRef } from 'react';

export type SelectFieldProps = Omit<ComponentPropsWithRef<'select'>, 'id'> & {
  label: string;
  hint?: string;
  error?: string;
};

// Same wiring as TextField, around a native <select> (keyboard support for free).
export function SelectField({ label, hint, error, className, children, ...selectProps }: SelectFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-900">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-slate-600">
          {hint}
        </p>
      )}
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={
          'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 ' +
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ' +
          'aria-invalid:border-red-600'
        }
        {...selectProps}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="mt-1 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

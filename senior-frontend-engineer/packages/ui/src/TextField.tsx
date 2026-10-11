import { useId, type ComponentPropsWithRef } from 'react';

export type TextFieldProps = Omit<ComponentPropsWithRef<'input'>, 'id'> & {
  label: string;
  /** Shown before the user types, e.g. the rule the value must follow. */
  hint?: string;
  error?: string;
};

// Label, hint and error are wired to the input (htmlFor, aria-describedby,
// aria-invalid) so screen readers announce them with the field.
export function TextField({ label, hint, error, className, ...inputProps }: TextFieldProps) {
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
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={
          'mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 ' +
          'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ' +
          'aria-invalid:border-red-600'
        }
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

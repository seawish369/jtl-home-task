import type { ComponentPropsWithRef } from 'react';

type ButtonVariant = 'primary' | 'secondary';

export type ButtonProps = ComponentPropsWithRef<'button'> & {
  variant?: ButtonVariant;
};

const base =
  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors ' +
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
};

// Defaults to type="button" so a button inside a form never submits by accident;
// submit buttons opt in with type="submit".
export function Button({ variant = 'primary', type = 'button', className, ...props }: ButtonProps) {
  const classes = [base, variants[variant], className].filter(Boolean).join(' ');
  return <button type={type} className={classes} {...props} />;
}

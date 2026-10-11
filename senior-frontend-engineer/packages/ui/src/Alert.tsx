import type { ReactNode } from 'react';

type AlertTone = 'error' | 'success';

const tones: Record<AlertTone, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
};

// Errors interrupt (role="alert"); confirmations are announced politely (role="status").
export function Alert({ tone = 'error', className, children }: { tone?: AlertTone; className?: string; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={['rounded-md border px-4 py-3 text-sm', tones[tone], className].filter(Boolean).join(' ')}
    >
      {children}
    </div>
  );
}

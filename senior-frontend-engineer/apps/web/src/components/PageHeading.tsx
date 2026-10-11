import type { ReactNode } from 'react';

// tabIndex={-1} lets the router move focus here after navigation (see router.tsx)
// without adding the heading to the tab order.
export function PageHeading({ children }: { children: ReactNode }) {
  return (
    <h1 tabIndex={-1} className="text-2xl font-semibold text-slate-900 focus:outline-none">
      {children}
    </h1>
  );
}

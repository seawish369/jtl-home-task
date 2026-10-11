import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { createQueryClient } from '@todo-app/core';
import { createStore, Provider } from 'jotai';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createAppRouter } from './router';

const queryClient = createQueryClient();
// One Jotai store, shared by React (Provider) and route loaders (router context).
const store = createStore();
const router = createAppRouter({ queryClient, store });

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

// There is no real backend: the mock API runs in every mode (dev, build, preview).
// onUnhandledFrame 'bypass' lets Vite's own requests (modules, assets) through.
let mockApiStarted = true;
try {
  // Imported here, not at the top: MSW touches navigator.serviceWorker on import,
  // which throws where the API doesn't exist at all.
  const { worker } = await import('./mocks/browser');
  await worker.start({ onUnhandledFrame: 'bypass' });
} catch (error) {
  // e.g. a private window that blocks service workers. Explain instead of a blank page.
  mockApiStarted = false;
  console.error('[mock API] The service worker could not start:', error);
}

createRoot(rootElement).render(
  <StrictMode>
    {mockApiStarted ? (
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <RouterProvider router={router} />
        </Provider>
      </QueryClientProvider>
    ) : (
      <MockApiUnavailable />
    )}
  </StrictMode>,
);

function MockApiUnavailable() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-slate-900">This app can't start here</h1>
      <p className="mt-3 text-slate-700">
        It runs its demo API in your browser with a service worker, and this window doesn't allow service workers.
        Private windows often block them.
      </p>
      <p className="mt-3 text-slate-700">Open the app in a normal (non-private) browser window.</p>
    </main>
  );
}

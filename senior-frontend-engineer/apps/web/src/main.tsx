import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { createQueryClient } from '@todo-app/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { worker } from './mocks/browser';
import { createAppRouter } from './router';

const queryClient = createQueryClient();
const router = createAppRouter(queryClient);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found');

// There is no real backend: the mock API runs in every mode (dev, build, preview).
// onUnhandledFrame 'bypass' lets Vite's own requests (modules, assets) through.
await worker.start({ onUnhandledFrame: 'bypass' });

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);

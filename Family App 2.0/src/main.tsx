/**
 * main.tsx — app entry point and root composition.
 *
 * Composition order (ARCH-02 + ARCH-03 + D-15):
 *
 *   StrictMode              ← catches side-effects that run twice in dev
 *   └─ QueryClientProvider  ← TanStack Query v5 root (singleton queryClient)
 *      ├─ ThemeProvider     ← OS-default + family_settings.theme reconciliation
 *      │  └─ RouterProvider ← React Router v7 Data mode (router topology)
 *      └─ ReactQueryDevtools ← dev-only query inspector (tree-shaken in prod)
 *
 * ThemeProvider is INSIDE QueryClientProvider so it can call useCurrentFamily
 * (a TanStack Query hook) to read family_settings.theme.
 *
 * ReactQueryDevtools is OUTSIDE RouterProvider but inside QueryClientProvider
 * so it overlays correctly regardless of the current route.
 */
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { router } from './routes/router';
import { queryClient } from './data/queryClient';
import ThemeProvider from './theme/ThemeProvider';
import './styles/globals.css';
import './theme/theme.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>,
);

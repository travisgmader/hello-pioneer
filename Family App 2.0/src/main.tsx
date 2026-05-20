import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import './theme/theme.css';

// Placeholder entry. Plan 04 replaces the inline div with <RouterProvider />.
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found in index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <div style={{ padding: 24 }}>Loading Family Hub 2.0…</div>
  </StrictMode>,
);

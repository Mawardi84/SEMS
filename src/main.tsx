import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global error reporter to debug blank screens
window.addEventListener('error', (event) => {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="padding: 20px; margin: 20px; background: #fff5f5; border: 1px solid #feb2b2; color: #9b2c2c; font-family: monospace; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h3 style="margin-top: 0; color: #c53030;">Runtime Error Detected</h3>
        <p><strong>Message:</strong> ${event.message}</p>
        <p><strong>File:</strong> ${event.filename}:${event.lineno}:${event.colno}</p>
        <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; border: 1px solid #fed7d7;">${event.error?.stack || 'No stack trace available'}</pre>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #c53030; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Reload Page</button>
      </div>
    `;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="padding: 20px; margin: 20px; background: #fffdf5; border: 1px solid #fef3c7; color: #92400e; font-family: monospace; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h3 style="margin-top: 0; color: #b45309;">Unhandled Promise Rejection</h3>
        <p><strong>Reason:</strong> ${event.reason?.message || String(event.reason)}</p>
        <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px; border: 1px solid #fef3c7;">${event.reason?.stack || 'No stack trace available'}</pre>
        <button onclick="window.location.reload()" style="margin-top: 10px; padding: 8px 16px; background: #b45309; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Reload Page</button>
      </div>
    `;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


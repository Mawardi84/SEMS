import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Log unhandled errors/rejections safely to console without breaking the DOM
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled Promise Rejection caught safely:', event.reason);
  // Prevent browser default interruption if desired
  event.preventDefault();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);



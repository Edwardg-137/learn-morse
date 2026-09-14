import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(<App />);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!refreshing) { refreshing = true; location.reload(); } });
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').then(registration => {
      const notify = () => { if (registration.waiting && navigator.serviceWorker.controller) window.dispatchEvent(new CustomEvent('morse:update', { detail: registration.waiting })); };
      notify();
      registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', notify));
    }).catch(() => { /* App remains usable online if service workers are unavailable. */ });
  });
}

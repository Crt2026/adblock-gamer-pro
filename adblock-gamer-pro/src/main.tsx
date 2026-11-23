import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (import.meta.env.DEV && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const reg of registrations) {
        void reg.unregister();
      }
    })
    .catch(() => {});

  if ('caches' in window) {
    caches
      .keys()
      .then((keys) => {
        for (const key of keys) {
          if (key.includes('workbox') || key.includes('precache')) {
            void caches.delete(key);
          }
        }
      })
      .catch(() => {});
  }
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class RootErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Handled gracefully by reset UI
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080D17] text-[#F1F5FF] flex items-center justify-center p-6">
          <div className="max-w-sm w-full rounded-2xl bg-[#111A2D] border border-[#213254] p-5 text-center space-y-3">
            <h1 className="text-base font-extrabold text-[#F1F5FF]">Adblock Gamer Pro v6.1</h1>
            <p className="text-xs text-[#7C90B8]">
              Se detectó un estado guardado incompatible. Reinicia la caché local para continuar.
            </p>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('adblock_gamer_pro_v6_exact');
                } catch {
                  // ignore
                }
                window.location.reload();
              }}
              className="w-full min-h-[42px] rounded-xl bg-[#00E68A] text-slate-950 text-xs font-extrabold cursor-pointer"
            >
              Restablecer y recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>,
);

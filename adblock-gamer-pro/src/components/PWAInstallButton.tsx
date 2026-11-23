import { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full';
}

export function PWAInstallButton({ variant = 'compact' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => void handleClick()}
        className={
          variant === 'full'
            ? 'w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#38ebff] text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors'
            : 'min-h-[44px] px-4 py-2 rounded-xl bg-[#111A2D] hover:bg-[#17243D] border border-[#00E5FF]/40 text-[#00E5FF] text-xs font-bold flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer transition-colors'
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Instalar Web App</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowGuideModal(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#111A2D] border border-[#213254] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/35 flex items-center justify-center text-[#00E5FF]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {isIOS ? 'Instalar en iPhone / iPad' : 'Instalar App en Android'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Modo pantalla completa (PWA)
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar guía"
                onClick={() => setShowGuideModal(false)}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-2.5 text-xs sm:text-sm text-slate-300 bg-[#090B10] border border-[#213254] rounded-2xl p-4 list-decimal list-inside">
                <li>
                  Toca el botón <strong>Compartir</strong> en la barra de Safari.
                </li>
                <li>
                  Desliza y selecciona <strong>Agregar a inicio</strong>.
                </li>
                <li>
                  Confirma con <strong>Agregar</strong> para abrir Adblock Gamer Pro como app.
                </li>
              </ol>
            ) : (
              <ol className="space-y-2.5 text-xs sm:text-sm text-slate-300 bg-[#090B10] border border-[#213254] rounded-2xl p-4 list-decimal list-inside">
                <li>
                  Abre esta app directamente en <strong>Google Chrome</strong> desde tu teléfono Android.
                </li>
                <li>
                  Toca el menú <strong>⋮</strong> arriba a la derecha en Chrome.
                </li>
                <li>
                  Selecciona <strong>Instalar aplicación</strong> o <strong>Añadir a la pantalla de inicio</strong>.
                </li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full min-h-[44px] rounded-xl bg-[#00E5FF] hover:bg-[#38ebff] text-slate-950 text-xs font-extrabold cursor-pointer transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-[#F59E0B] px-3.5 py-2 text-xs font-bold text-slate-950 shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Modo sin conexión — Usando caché local</span>
    </div>
  );
}

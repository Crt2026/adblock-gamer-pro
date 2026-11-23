import { useEffect, useState } from 'react';
import { Check, Lock, Play } from 'lucide-react';

interface GooglePlayBillingDialogProps {
  open: boolean;
  onDismiss: () => void;
  onPaymentSuccess: () => void;
}

export function GooglePlayBillingDialog({
  open,
  onDismiss,
  onPaymentSuccess,
}: GooglePlayBillingDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (!open) {
      setStep(1);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (step === 2) {
      const t = setTimeout(() => setStep(3), 1800);
      return () => clearTimeout(t);
    }
    if (step === 3) {
      const t = setTimeout(() => onPaymentSuccess(), 1500);
      return () => clearTimeout(t);
    }
  }, [open, step, onPaymentSuccess]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
      onClick={() => {
        if (step !== 2) onDismiss();
      }}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-[#202124] border border-white/10 p-6 shadow-2xl text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Play Header */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <Play className="w-4 h-4 text-[#00F0FF] fill-[#00F0FF]" />
          <span className="text-base font-bold text-white">Google Play</span>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-lg font-extrabold text-white">
              Adblock Gamer Pro (Acceso de por vida)
            </h2>
            <p className="text-xs text-[#9AA0A6] mt-1">
              Habilitar todas las opciones premium
            </p>

            <div className="mt-5 rounded-xl bg-[#2D2E30] p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3 text-left">
                <Lock className="w-5 h-5 text-[#00F0FF]" />
                <div>
                  <p className="text-xs font-bold text-white">Visa •••• 4321</p>
                  <p className="text-[11px] text-[#9AA0A6]">support@adblockgamer.com</p>
                </div>
              </div>
              <span className="text-sm font-black text-white">$2.500</span>
            </div>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-6 w-full py-2.5 rounded-full bg-[#8AB4F8] hover:bg-[#a6c8fa] text-black text-sm font-bold cursor-pointer transition"
            >
              Comprar con 1 toque
            </button>

            <p className="mt-3 text-[10px] text-[#9AA0A6] leading-relaxed">
              Al presionar el botón confirmas que estás en un entorno de simulación local. El cobro no será real.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="py-6 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-4 border-[#8AB4F8]/30 border-t-[#8AB4F8] animate-spin mb-5" />
            <p className="text-sm font-medium text-white">
              Procesando pago de Google Play...
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="py-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-[#81C995] flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-black stroke-[3]" />
            </div>
            <h3 className="text-base font-bold text-white">
              ¡Pago Completado con Éxito!
            </h3>
            <p className="text-xs text-[#9AA0A6] mt-1">
              Google Play ha procesado el pago de 2.500 pesos
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

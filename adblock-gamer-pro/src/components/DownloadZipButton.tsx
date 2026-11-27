import { useState } from 'react';
import { ArchiveZipIcon } from './Icons';

interface DownloadZipButtonProps {
  variant?: 'compact' | 'full';
}

export function DownloadZipButton({ variant = 'compact' }: DownloadZipButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = async () => {
    setDownloading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/download/adblock-gamer-pro-v6.2.zip');
      if (!res.ok) {
        throw new Error(`Error HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'adblock-gamer-pro-v6.2.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      setErrorMsg('No se pudo descargar el paquete WinRAR (.zip).');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className={variant === 'full' ? 'space-y-1.5 w-full' : 'shrink-0'}>
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={downloading}
        className={
          variant === 'full'
            ? 'w-full min-h-[46px] px-4 rounded-xl bg-[#00E68A] hover:bg-[#1ef29d] disabled:opacity-60 text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#00E5FF]'
            : 'min-h-[44px] px-4 py-2 rounded-xl bg-[#00E68A] hover:bg-[#1ef29d] disabled:opacity-60 text-slate-950 text-xs font-extrabold flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF]'
        }
      >
        <ArchiveZipIcon className="w-4 h-4 shrink-0" />
        <span>
          {downloading
            ? 'Empaquetando WinRAR...'
            : variant === 'full'
              ? 'Descargar WinRAR / ZIP (v6.2)'
              : 'WinRAR / ZIP (v6.2)'}
        </span>
      </button>
      {errorMsg && <p className="text-[11px] text-[#FF4D6D]">{errorMsg}</p>}
    </div>
  );
}

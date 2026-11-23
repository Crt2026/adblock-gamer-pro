import { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  GitBranch,
  Mail,
  ShoppingCart,
  Smartphone,
  Star,
} from 'lucide-react';
import { FAQS } from '../data/adblockRules';
import { NavSettingsIcon } from './Icons';
import { DownloadZipButton } from './DownloadZipButton';
import { PWAInstallButton } from './PWAInstallButton';

const GITHUB_APK_WORKFLOW = `name: Build Android APK
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Grant execute permission for gradlew
        run: chmod +x gradlew
      - name: Build Debug APK
        run: ./gradlew assembleDebug
      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: adblock-gamer-pro-debug
          path: app/build/outputs/apk/debug/*.apk`;

interface GithubRepoInfo {
  fullName: string;
  htmlUrl: string;
  defaultBranch: string;
  description: string;
  latestCommit: {
    sha: string;
    message: string;
  };
}

interface SettingsScreenProps {
  isProPurchased: boolean;
  onBuyProClick: () => void;
  isBatteryOptimizationIgnored: boolean;
  onToggleBatteryOptimization: () => void;
}

export function SettingsScreen({
  isProPurchased,
  onBuyProClick,
  isBatteryOptimizationIgnored,
  onToggleBatteryOptimization,
}: SettingsScreenProps) {
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number>(0);
  const [repoInfo, setRepoInfo] = useState<GithubRepoInfo | null>(null);
  const [copiedWorkflow, setCopiedWorkflow] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/github/repo')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: GithubRepoInfo | null) => {
        if (active && data) setRepoInfo(data);
      })
      .catch(() => {
        // ignore
      });
    return () => {
      active = false;
    };
  }, []);

  const deviceInfo: Array<[string, string]> = [
    ['Plataforma', navigator.platform || 'Web'],
    ['Idioma', navigator.language || 'es'],
    ['Núcleos CPU', `${navigator.hardwareConcurrency || 4} hilos`],
    ['Motor Web', 'React 19 · Vite · Express'],
    ['Origen Android', 'Kotlin + Jetpack Compose'],
  ];

  const mailtoSubject = encodeURIComponent('Soporte Adblock Gamer Pro');
  const mailtoBody = encodeURIComponent(
    `Hola equipo de Adblock Gamer,\n\nEscribo desde mi dispositivo (${navigator.userAgent}).\n\n[Describe tu consulta aquí]`,
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <header className="flex items-center gap-3 pb-4 border-b border-white/[0.07]">
        <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/15 border border-[#F59E0B]/35 flex items-center justify-center text-[#F59E0B]">
          <NavSettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Ajustes y Licencia PRO
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Configuración general, preguntas frecuentes y repositorio conectado
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: PRO, Stability, Repo */}
        <section className="lg:col-span-5 space-y-4">
          {!isProPurchased ? (
            <div className="rounded-2xl p-6 border border-[#F59E0B]/60 bg-[#12151E] space-y-4">
              <div className="flex items-center gap-2.5 text-[#F59E0B]">
                <ShoppingCart className="w-5 h-5" />
                <h2 className="text-lg font-bold">Versión PRO Adblocker</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Protección premium sin límites de red, bloqueo avanzado en juegos, servidores DNS Dual-Stack de baja latencia y soporte prioritario 24/7.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-base font-extrabold text-[#F59E0B]">
                  Solo $2.500 pesos
                </span>
                <button
                  type="button"
                  onClick={onBuyProClick}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#F59E0B] hover:bg-[#fbbf24] text-slate-950 text-xs font-extrabold cursor-pointer transition-colors"
                >
                  ADQUIRIR
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-6 border border-[#F59E0B]/60 bg-[#12151E] text-center space-y-2">
              <Star className="w-9 h-9 text-[#F59E0B] mx-auto fill-[#F59E0B]/25" />
              <h2 className="text-lg font-extrabold text-[#F59E0B]">
                ¡Adblock Gamer PRO Activado!
              </h2>
              <p className="text-xs text-slate-400">
                Disfrutas de protección premium ilimitada en este dispositivo.
              </p>
            </div>
          )}

          {/* Estabilidad 24/7 */}
          <div className="bg-[#12151E] rounded-2xl p-5 border border-white/[0.07] space-y-3">
            <div className="flex items-start gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: isBatteryOptimizationIgnored
                    ? 'rgba(34, 197, 94, 0.12)'
                    : 'rgba(245, 158, 11, 0.14)',
                  color: isBatteryOptimizationIgnored ? '#22C55E' : '#F59E0B',
                }}
              >
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {isBatteryOptimizationIgnored
                    ? 'Persistencia 24/7 Activa'
                    : 'Persistencia Optimizada (Riesgo de corte)'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Mantiene la protección Wi-Fi y 4G/5G activa sin interrupciones.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleBatteryOptimization}
              className="w-full min-h-[44px] rounded-xl bg-[#1A1E2B] hover:bg-[#23293A] border border-white/10 text-xs font-bold text-slate-200 cursor-pointer transition-colors"
            >
              {isBatteryOptimizationIgnored
                ? 'Revisar ajustes de persistencia'
                : 'Activar Sin Restricciones'}
            </button>
          </div>

          {/* Connected GitHub Repo */}
          <div className="bg-[#12151E] rounded-2xl p-5 border border-white/[0.07] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <GitBranch className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span className="text-xs font-bold text-white truncate">
                  {repoInfo?.fullName ?? 'Crt2026/bloqueador-anuncios-youtube-android'}
                </span>
              </div>
              <a
                href={
                  repoInfo?.htmlUrl ??
                  'https://github.com/Crt2026/bloqueador-anuncios-youtube-android'
                }
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#00E5FF] inline-flex items-center gap-1 shrink-0 hover:underline"
              >
                GitHub <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="text-xs text-slate-400 flex items-center justify-between border-t border-white/[0.06] pt-2.5">
              <span>Rama: {repoInfo?.defaultBranch ?? 'master'}</span>
              <span className="font-mono text-[#22C55E]">
                {repoInfo?.latestCommit.sha ?? 'c8bcddb'}
              </span>
            </div>
          </div>

          {/* Android App Install & APK Workflow */}
          <div className="bg-[#12151E] rounded-2xl p-5 border border-[#00E5FF]/25 space-y-3.5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00E5FF]/15 text-[#00E5FF] flex items-center justify-center shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  App para Android (PWA + APK)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Instala esta versión directo en tu Android o descarga el workflow para compilar el .apk en GitHub Actions.
                </p>
              </div>
            </div>

            <PWAInstallButton variant="full" />

            <DownloadZipButton variant="full" />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(GITHUB_APK_WORKFLOW);
                    setCopiedWorkflow(true);
                    setTimeout(() => setCopiedWorkflow(false), 2000);
                  } catch {
                    // ignore
                  }
                }}
                className="flex-1 min-h-[42px] px-3 rounded-xl bg-[#1A1E2B] hover:bg-[#23293A] border border-white/10 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedWorkflow ? 'Workflow Copiado' : 'Copiar build-apk.yml'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const blob = new Blob([GITHUB_APK_WORKFLOW], {
                    type: 'text/yaml;charset=utf-8',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'build-apk.yml';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="min-h-[42px] px-3.5 rounded-xl bg-[#1A1E2B] hover:bg-[#23293A] border border-white/10 text-xs font-bold text-[#00E5FF] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.yml</span>
              </button>
            </div>
          </div>
        </section>

        {/* Right Column: FAQs, Device Info, Support */}
        <section className="lg:col-span-7 space-y-6">
          <div className="space-y-3">
            <h2 className="text-base font-bold text-white">Preguntas Frecuentes</h2>
            <div className="space-y-2.5">
              {FAQS.map((faq, index) => {
                const expanded = expandedFaqIndex === index;
                return (
                  <button
                    key={faq.question}
                    type="button"
                    onClick={() => setExpandedFaqIndex(expanded ? -1 : index)}
                    className="w-full text-left bg-[#12151E] rounded-2xl p-4 border border-white/[0.07] cursor-pointer transition-colors hover:border-white/15"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold text-white">{faq.question}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-[#00E5FF] shrink-0 transition-transform ${
                          expanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    {expanded && (
                      <p className="mt-2.5 text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {faq.answer}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-[#12151E] rounded-2xl p-5 border border-white/[0.07] space-y-3">
            <h2 className="text-sm font-bold text-white">Información del Entorno</h2>
            <div className="divide-y divide-white/[0.06]">
              {deviceInfo.map(([label, value]) => (
                <div key={label} className="py-2 flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-white font-semibold text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <a
            href={`mailto:support@adblockgamer.com?subject=${mailtoSubject}&body=${mailtoBody}`}
            className="w-full min-h-[48px] rounded-2xl bg-[#1A1E2B] hover:bg-[#24293B] border border-white/10 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Mail className="w-4 h-4 text-[#00E5FF]" />
            <span>Enviar Correo a Soporte</span>
          </a>
        </section>
      </div>
    </div>
  );
}

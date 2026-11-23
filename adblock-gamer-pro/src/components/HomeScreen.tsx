import { useState } from 'react';
import { Check, Power, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import {
  checkDomainOrUrl,
  DNS_PRESETS,
  type FilterCheckResult,
} from '../data/adblockRules';
import type { NetworkMode } from '../hooks/useAdblockPrefs';
import {
  AdBlockCrossIcon,
  BrandShieldIcon,
  DualNetworkIcon,
  GamerBoltIcon,
  MobileDataIcon,
  NavYoutubeIcon,
  WifiSignalIcon,
} from './Icons';
import { DownloadZipButton } from './DownloadZipButton';
import { PWAInstallButton } from './PWAInstallButton';

interface HomeScreenProps {
  isVpnRunning: boolean;
  onToggleVpn: () => void;
  blockedCount: number;
  onIncrementBlocked: (amount?: number) => void;
  gamerMode: boolean;
  onToggleGamerMode: (enabled: boolean) => void;
  dnsPreset: string;
  customDnsIp: string;
  networkMode: NetworkMode;
  onChangeNetworkMode: (mode: NetworkMode) => void;
  ipv6Protection: boolean;
  dohEnabled: boolean;
  isProPurchased: boolean;
  isBatteryOptimizationIgnored: boolean;
  onToggleBatteryOptimization: () => void;
  onOpenBrowser: () => void;
  onOpenDns: () => void;
}

const SAMPLE_TEST_INPUTS = [
  'googleads.g.doubleclick.net',
  'unityads.unity3d.com',
  'youtube.com/youtubei/v1/player/ad_break',
  'm.youtube.com',
];

export function HomeScreen({
  isVpnRunning,
  onToggleVpn,
  blockedCount,
  onIncrementBlocked,
  gamerMode,
  onToggleGamerMode,
  dnsPreset,
  customDnsIp,
  networkMode,
  onChangeNetworkMode,
  ipv6Protection,
  dohEnabled,
  isProPurchased,
  isBatteryOptimizationIgnored,
  onToggleBatteryOptimization,
  onOpenBrowser,
  onOpenDns,
}: HomeScreenProps) {
  const [domainInput, setDomainInput] = useState('googleads.g.doubleclick.net');
  const [lastCheck, setLastCheck] = useState<FilterCheckResult | null>(null);

  const activeColor = isVpnRunning ? (gamerMode ? '#22C55E' : '#00E5FF') : '#EF4444';
  const activePresetObj = DNS_PRESETS.find((p) => p.key === dnsPreset) ?? DNS_PRESETS[0];
  const activeDnsIp =
    dnsPreset === 'custom' && customDnsIp.trim()
      ? customDnsIp.trim()
      : activePresetObj.primaryIp;

  const handleCheckDomain = (target = domainInput) => {
    const result = checkDomainOrUrl(target);
    setLastCheck(result);
    if (result.blocked && isVpnRunning) {
      onIncrementBlocked(1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Compact Header */}
      <header className="flex items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="md:hidden w-9 h-9 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shrink-0">
            <BrandShieldIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">
              Centro de Protección
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 truncate">
              {activePresetObj.title} · {activeDnsIp}
              {isProPurchased ? ' · Licencia PRO' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <PWAInstallButton variant="compact" />
            <DownloadZipButton variant="compact" />
          </div>
          <button
            type="button"
            onClick={onOpenBrowser}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#EF4444] hover:bg-[#dc2626] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shrink-0 whitespace-nowrap cursor-pointer transition-colors"
          >
            <NavYoutubeIcon className="w-4 h-4" />
            <span>YouTube Sin Anuncios</span>
          </button>
        </div>
      </header>

      <div className="sm:hidden grid grid-cols-1 gap-2">
        <PWAInstallButton variant="full" />
        <DownloadZipButton variant="full" />
      </div>

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Shield Control & Network Mode (Wi-Fi + Datos Móviles) */}
        <section className="lg:col-span-5 bg-[#12151E] border border-white/[0.07] rounded-3xl p-6 space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Estado del Escudo</span>
            <span className="font-mono tabular-nums" style={{ color: activeColor }}>
              {isVpnRunning ? 'ACTIVO 24/7' : 'DESACTIVADO'}
            </span>
          </div>

          {/* Interactive Shield Power Button */}
          <div className="relative flex items-center justify-center py-6">
            {isVpnRunning && (
              <div
                className="absolute w-48 h-48 rounded-full border animate-shield-orbit pointer-events-none"
                style={{ borderColor: `${activeColor}66` }}
              />
            )}

            <button
              type="button"
              onClick={onToggleVpn}
              className="relative z-10 w-44 h-44 rounded-full flex flex-col items-center justify-center transition-transform duration-200 active:scale-95 cursor-pointer select-none"
              style={{
                background: 'radial-gradient(circle at 30% 25%, #1D2332, #10131C)',
                border: `2px solid ${activeColor}`,
                boxShadow: isVpnRunning
                  ? `0 0 40px ${activeColor}33, inset 0 0 24px ${activeColor}1A`
                  : '0 12px 30px rgba(0,0,0,0.55)',
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                style={{
                  backgroundColor: isVpnRunning ? `${activeColor}1A` : 'rgba(255,255,255,0.04)',
                  color: isVpnRunning ? activeColor : '#94A3B8',
                }}
              >
                {isVpnRunning ? (
                  <BrandShieldIcon className="w-8 h-8" />
                ) : (
                  <Power className="w-7 h-7" />
                )}
              </div>
              <span className="text-sm font-extrabold tracking-wide text-white">
                {isVpnRunning ? 'DESCONECTAR' : 'CONECTAR'}
              </span>
              <span className="mt-0.5 text-[11px] font-medium text-slate-400">
                {isVpnRunning ? 'Protección Activa' : 'Toque para activar'}
              </span>
            </button>
          </div>

          {/* Wi-Fi & Datos Móviles Network Profile Segmented Selector */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Cobertura de Red
              </span>
              <button
                type="button"
                onClick={onOpenDns}
                className="text-xs font-semibold text-[#00E5FF] hover:underline cursor-pointer"
              >
                Configurar DNS
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#0A0C12] border border-white/[0.06]">
              {(
                [
                  { id: 'dual', label: 'Wi-Fi + 4G/5G', Icon: DualNetworkIcon },
                  { id: 'wifi', label: 'Solo Wi-Fi', Icon: WifiSignalIcon },
                  { id: 'mobile', label: 'Datos Móviles', Icon: MobileDataIcon },
                ] as const
              ).map(({ id, label, Icon }) => {
                const active = networkMode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChangeNetworkMode(id)}
                    className={`min-h-[44px] px-2 py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#192030] text-[#00E5FF] border border-[#00E5FF]/35'
                        : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>DoH (Puerto 443): {dohEnabled ? 'Activo' : 'Inactivo'}</span>
              <span>IPv6 Dual-Stack: {ipv6Protection ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>
        </section>

        {/* Right Column: Stats, Gamer Mode, Persistence, Live Filter Tester */}
        <section className="lg:col-span-7 space-y-4">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">Anuncios Bloqueados</p>
                <p className="text-3xl font-extrabold tabular-nums text-[#00E5FF] mt-1">
                  {blockedCount.toLocaleString('es-CL')}
                </p>
                <p className="text-xs text-slate-500 mt-1">DNS + YouTube en sesión</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/25 flex items-center justify-center text-[#00E5FF]">
                <AdBlockCrossIcon className="w-6 h-6" />
              </div>
            </div>

            {/* Modo Gamer Switch Card */}
            <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: gamerMode ? 'rgba(34, 197, 94, 0.14)' : '#1A1E2B',
                    color: gamerMode ? '#22C55E' : '#94A3B8',
                  }}
                >
                  <GamerBoltIcon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white">Modo Gamer</h2>
                  <p className="text-xs text-slate-400">
                    Bloqueo estricto Unity / AppLovin / AdMob
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={gamerMode}
                onClick={() => onToggleGamerMode(!gamerMode)}
                className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 cursor-pointer ${
                  gamerMode ? 'bg-[#22C55E]/35' : 'bg-[#1D2230]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full transition-transform ${
                    gamerMode ? 'translate-x-5 bg-[#22C55E]' : 'translate-x-0 bg-slate-400'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 24/7 Mobile + Wi-Fi Persistence Card */}
          <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
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
                    ? 'Estabilidad 24/7 en Wi-Fi y Datos Móviles'
                    : 'Modo Ahorro Detectado'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isBatteryOptimizationIgnored
                    ? 'Reconexión automática entre Wi-Fi y 4G/5G activa sin cortes en segundo plano.'
                    : 'Activa Sin restricciones para evitar desconexiones al cambiar entre Wi-Fi y datos móviles.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleBatteryOptimization}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1A1E2B] hover:bg-[#232838] border border-white/10 text-xs font-bold text-slate-200 whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              {isBatteryOptimizationIgnored ? 'Verificar estado' : 'Activar 24/7'}
            </button>
          </div>

          {/* Real Domain / URL Filter Tester */}
          <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">
                Verificador de Filtros DNS y YouTube
              </h3>
              <span className="text-xs text-slate-400">Motor AdblockVpnService</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheckDomain();
                }}
                placeholder="Ej: googleads.g.doubleclick.net o m.youtube.com"
                className="flex-1 min-h-[44px] bg-[#090B10] border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#00E5FF]"
              />
              <button
                type="button"
                onClick={() => handleCheckDomain()}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#2beaff] text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 shrink-0 cursor-pointer transition-colors"
              >
                <Search className="w-4 h-4" />
                <span>Analizar</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {SAMPLE_TEST_INPUTS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setDomainInput(sample);
                    handleCheckDomain(sample);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#1A1E2B] hover:bg-[#24293A] text-xs font-mono text-slate-300 hover:text-white cursor-pointer transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>

            {lastCheck && (
              <div
                className="rounded-xl p-3.5 border text-xs flex items-start gap-2.5"
                style={{
                  backgroundColor: lastCheck.blocked
                    ? 'rgba(34, 197, 94, 0.08)'
                    : 'rgba(0, 229, 255, 0.08)',
                  borderColor: lastCheck.blocked
                    ? 'rgba(34, 197, 94, 0.35)'
                    : 'rgba(0, 229, 255, 0.35)',
                }}
              >
                {lastCheck.blocked ? (
                  <ShieldAlert className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold text-white">
                    {lastCheck.blocked ? 'ANUNCIO BLOQUEADO' : 'TRÁFICO PERMITIDO'}
                  </p>
                  <p className="text-slate-300 mt-0.5">{lastCheck.reason}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

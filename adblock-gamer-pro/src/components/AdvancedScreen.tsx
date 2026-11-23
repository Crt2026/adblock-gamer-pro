import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Gamepad2,
  Globe,
  Lock,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { DNS_PRESETS, type DnsPresetOption } from '../data/adblockRules';
import type { NetworkMode } from '../hooks/useAdblockPrefs';
import {
  DualNetworkIcon,
  MobileDataIcon,
  NavDnsIcon,
  WifiSignalIcon,
} from './Icons';

interface AdvancedScreenProps {
  dnsPreset: string;
  customDnsIp: string;
  isVpnRunning: boolean;
  networkMode: NetworkMode;
  ipv6Protection: boolean;
  dohEnabled: boolean;
  onSelectDnsPreset: (preset: string) => void;
  onChangeCustomDnsIp: (ip: string) => void;
  onChangeNetworkMode: (mode: NetworkMode) => void;
  onToggleIpv6: (enabled: boolean) => void;
  onToggleDoh: (enabled: boolean) => void;
  onRestartVpn: () => void;
}

interface VerifyBlockCheck {
  domain: string;
  blocked: boolean;
  ips: string[];
  latencyMs: number;
  wifiUdpMs: number;
  mobileDohMs: number;
}

interface ResolveTransportInfo {
  reachable: boolean;
  latencyMs: number;
  ips: string[];
  blocked: boolean;
}

interface ResolveResult {
  domain: string;
  targetIp: string;
  wifiUdp: ResolveTransportInfo;
  mobileDoh: ResolveTransportInfo;
  androidPrivateDot: ResolveTransportInfo;
}

function getPresetIcon(category: DnsPresetOption['category']) {
  switch (category) {
    case 'adblock':
      return ShieldCheck;
    case 'family':
      return Shield;
    case 'security':
      return Lock;
    case 'gaming':
      return Gamepad2;
    case 'standard':
      return Globe;
    case 'custom':
      return Sliders;
  }
}

export function AdvancedScreen({
  dnsPreset,
  customDnsIp,
  isVpnRunning,
  networkMode,
  ipv6Protection,
  dohEnabled,
  onSelectDnsPreset,
  onChangeCustomDnsIp,
  onChangeNetworkMode,
  onToggleIpv6,
  onToggleDoh,
  onRestartVpn,
}: AdvancedScreenProps) {
  const [latencies, setLatencies] = useState<Record<string, number>>({});
  const [details, setDetails] = useState<
    Record<string, { udpMs: number; dohMs: number; dotMs: number }>
  >({});
  const [isTestingAll, setIsTestingAll] = useState(false);
  const [isVerifyingBlock, setIsVerifyingBlock] = useState(false);
  const [blockChecks, setBlockChecks] = useState<VerifyBlockCheck[] | null>(null);
  const [pings, setPings] = useState<number[]>([22, 24, 20, 26, 21, 23, 20, 22]);
  const [activeMethod, setActiveMethod] = useState<string>('udp-53');
  const [copiedDot, setCopiedDot] = useState(false);
  const [copiedKotlinFix, setCopiedKotlinFix] = useState(false);

  // Real interactive Wi-Fi + Datos Móviles DNS lookup tester
  const [testDomain, setTestDomain] = useState('doubleclick.net');
  const [isResolvingDomain, setIsResolvingDomain] = useState(false);
  const [resolveResult, setResolveResult] = useState<ResolveResult | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const selectedPresetObj = useMemo(
    () => DNS_PRESETS.find((p) => p.key === dnsPreset) ?? DNS_PRESETS[0],
    [dnsPreset],
  );

  const activeIp = useMemo(() => {
    if (dnsPreset === 'custom' && customDnsIp.trim()) {
      return customDnsIp.trim();
    }
    return selectedPresetObj.primaryIp;
  }, [dnsPreset, customDnsIp, selectedPresetObj]);

  useEffect(() => {
    let active = true;

    const pingOnce = async () => {
      try {
        const params = new URLSearchParams({
          ip: activeIp,
          preset: dnsPreset,
          mode: networkMode,
        });
        const res = await fetch(`/api/dns/ping?${params.toString()}`);
        if (!res.ok) return;
        const data = (await res.json()) as { latencyMs?: number; method?: string };
        const ms = typeof data.latencyMs === 'number' ? data.latencyMs : 999;
        const clamped = ms >= 999 ? 120 : ms;
        if (active) {
          setPings((prev) => [...prev.slice(-9), clamped]);
          if (data.method) setActiveMethod(data.method);
        }
      } catch {
        // ignore transient network errors
      }
    };

    void pingOnce();
    const timer = setInterval(pingOnce, 1800);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [activeIp, dnsPreset, networkMode]);

  const handleTestAllPresets = async () => {
    if (isTestingAll) return;
    setIsTestingAll(true);
    try {
      const res = await fetch('/api/dns/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customIp: customDnsIp, mode: networkMode }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          results?: Record<string, number>;
          details?: Record<string, { udpMs: number; dohMs: number; dotMs: number }>;
        };
        if (data.results) setLatencies(data.results);
        if (data.details) setDetails(data.details);
      }
    } finally {
      setIsTestingAll(false);
    }
  };

  const handleVerifyBlocking = async () => {
    if (isVerifyingBlock) return;
    setIsVerifyingBlock(true);
    try {
      const res = await fetch('/api/dns/verify-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preset: dnsPreset, customIp: customDnsIp }),
      });
      if (res.ok) {
        const data = (await res.json()) as { checks?: VerifyBlockCheck[] };
        if (data.checks) setBlockChecks(data.checks);
      }
    } finally {
      setIsVerifyingBlock(false);
    }
  };

  const handleResolveDomain = async (target = testDomain) => {
    if (isResolvingDomain) return;
    setIsResolvingDomain(true);
    setResolveError(null);
    try {
      const res = await fetch('/api/dns/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: target,
          preset: dnsPreset,
          customIp: customDnsIp,
        }),
      });
      const data = (await res.json()) as ResolveResult & { error?: string };
      if (!res.ok) {
        setResolveError(data.error ?? 'Error al resolver dominio');
      } else {
        setResolveResult(data);
      }
    } catch {
      setResolveError('No se pudo conectar al servidor de pruebas DNS');
    } finally {
      setIsResolvingDomain(false);
    }
  };

  const handleCopyDotHost = async () => {
    try {
      await navigator.clipboard.writeText(selectedPresetObj.dotHost);
      setCopiedDot(true);
      setTimeout(() => setCopiedDot(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyAndroidKotlinFix = async () => {
    const snippet = `// Fix Wi-Fi + Datos Móviles en AdblockVpnService.kt:
// 1. NO usar fallback a 1.1.1.1 / 8.8.8.8 cuando AdGuard tarde >100ms en 4G/5G (eso filtra anuncios).
// 2. Usar respaldo únicamente entre servidores con AdBlock (AdGuard secundario + Control D 76.76.2.2) o DoH HTTPS puerto 443.
// 3. Vincular sockets al Network activo (bindSocket) tanto en Wi-Fi como en Cellular (NET_CAPABILITY_INTERNET).`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedKotlinFix(true);
      setTimeout(() => setCopiedKotlinFix(false), 2000);
    } catch {
      // ignore
    }
  };

  const avgPing = Math.round(pings.reduce((a, b) => a + b, 0) / pings.length);
  const jitter = Math.round(Math.max(...pings) - Math.min(...pings));
  const statusLabel =
    avgPing < 35
      ? `${avgPing} ms · ULTRA GAMING`
      : avgPing < 70
        ? `${avgPing} ms · ESTABLE`
        : `${avgPing} ms · LATENCIA ALTA`;
  const statusColor = avgPing < 35 ? '#22C55E' : avgPing < 70 ? '#00E5FF' : '#EF4444';

  const chartPoints = useMemo(() => {
    const width = 320;
    const height = 100;
    const maxPing = 110;
    return pings.map((p, idx) => {
      const x = (idx / Math.max(1, pings.length - 1)) * width;
      const y = Math.min(height - 8, Math.max(8, height - (p / maxPing) * height));
      return { x, y };
    });
  }, [pings]);

  const linePointsAttr = chartPoints.map((pt) => `${pt.x},${pt.y}`).join(' ');
  const areaPath =
    chartPoints.length > 0
      ? `M 0,100 ${chartPoints.map((pt) => `L ${pt.x},${pt.y}`).join(' ')} L 320,100 Z`
      : '';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#22C55E]/15 border border-[#22C55E]/35 flex items-center justify-center text-[#22C55E]">
            <NavDnsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              DNS Dual-Stack (Wi-Fi y Datos Móviles)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Prueba real simultánea en UDP-53 (Wi-Fi), DoH-443 (4G/5G) y DoT-853 (DNS Privado Android)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleVerifyBlocking}
            disabled={isVerifyingBlock}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#22C55E]/20 hover:bg-[#22C55E]/30 disabled:opacity-60 border border-[#22C55E]/40 text-[#22C55E] text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isVerifyingBlock ? 'Verificando...' : 'Verificar Bloqueo Real'}</span>
          </button>

          <button
            type="button"
            onClick={handleTestAllPresets}
            disabled={isTestingAll}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#2beaff] disabled:opacity-60 text-slate-950 text-xs font-extrabold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isTestingAll ? 'animate-spin' : ''}`} />
            <span>{isTestingAll ? 'Probando todos...' : 'Probar los 18 DNS'}</span>
          </button>
        </div>
      </header>

      {/* Real Wi-Fi + Datos Móviles Live Domain Resolver Card */}
      <section className="bg-[#12151E] border border-[#00E5FF]/25 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Prueba Real en Vivo: Wi-Fi (UDP-53) + Datos Móviles (DoH-443) + Android DoT (853)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprueba en tiempo real si el servidor seleccionado ({selectedPresetObj.title}) responde y bloquea un dominio de anuncios.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={testDomain}
            onChange={(e) => setTestDomain(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleResolveDomain();
            }}
            placeholder="Ej: doubleclick.net, ads.youtube.com, m.youtube.com"
            className="flex-1 min-h-[44px] bg-[#090B10] border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#00E5FF]"
          />
          <button
            type="button"
            onClick={() => void handleResolveDomain()}
            disabled={isResolvingDomain}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#2beaff] disabled:opacity-60 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{isResolvingDomain ? 'Consultando...' : 'Probar DNS Ahora'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {['doubleclick.net', 'ads.youtube.com', 'googleads.g.doubleclick.net', 'm.youtube.com'].map(
            (d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setTestDomain(d);
                  void handleResolveDomain(d);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#1A1E2B] hover:bg-[#252B3D] text-xs font-mono text-slate-300 hover:text-white cursor-pointer"
              >
                {d}
              </button>
            ),
          )}
        </div>

        {resolveError && (
          <p className="text-xs text-[#EF4444] font-semibold">{resolveError}</p>
        )}

        {resolveResult && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(
              [
                { label: 'Wi-Fi (UDP Puerto 53)', info: resolveResult.wifiUdp },
                { label: 'Datos Móviles 4G/5G (DoH 443)', info: resolveResult.mobileDoh },
                { label: 'DNS Privado Android (DoT 853)', info: resolveResult.androidPrivateDot },
              ] as const
            ).map(({ label, info }) => (
              <div
                key={label}
                className="bg-[#090B10] border border-white/[0.08] rounded-xl p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{label}</span>
                  <span className="font-mono tabular-nums text-[#00E5FF]">
                    {info.reachable ? `${info.latencyMs} ms` : 'Timeout'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {info.blocked ? (
                    <>
                      <ShieldAlert className="w-4 h-4 text-[#22C55E]" />
                      <span className="text-[#22C55E]">
                        BLOQUEADO ({info.ips[0] || 'NXDOMAIN'})
                      </span>
                    </>
                  ) : info.reachable ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
                      <span className="text-slate-200 font-mono">
                        IP: {info.ips[0] || 'Resuelto'}
                      </span>
                    </>
                  ) : (
                    <span className="text-[#EF4444]">Sin respuesta</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Main 2-Column DNS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Presets List */}
        <section className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300">
              Servidores DNS Disponibles ({DNS_PRESETS.length})
            </h2>
            <span className="text-xs text-slate-400">
              Modo: {networkMode === 'dual' ? 'Wi-Fi + 4G/5G' : networkMode === 'wifi' ? 'Wi-Fi' : 'Datos Móviles'}
            </span>
          </div>

          <div className="space-y-2.5">
            {DNS_PRESETS.map((preset) => {
              const isSelected = dnsPreset === preset.key;
              const latency = latencies[preset.key];
              const det = details[preset.key];
              const Icon = getPresetIcon(preset.category);

              let badgeColor = '#EF4444';
              if (typeof latency === 'number') {
                badgeColor = latency < 55 ? '#22C55E' : latency < 120 ? '#00E5FF' : '#EF4444';
              }

              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    onSelectDnsPreset(preset.key);
                    setBlockChecks(null);
                    if (isVpnRunning && preset.key !== 'custom') {
                      onRestartVpn();
                    }
                  }}
                  className={`w-full min-h-[68px] text-left rounded-2xl p-4 border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#181D2B] border-[#00E5FF]/60'
                      : 'bg-[#12151E] border-white/[0.06] hover:border-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: isSelected ? 'rgba(0, 229, 255, 0.14)' : '#1A1E2B',
                          color: isSelected ? '#00E5FF' : '#94A3B8',
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {preset.title}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {preset.subtitle}
                          {preset.ipDisplay ? ` · ${preset.ipDisplay}` : ''}
                        </p>
                        {det && (
                          <p className="text-[11px] font-mono text-slate-500 mt-0.5 tabular-nums">
                            Wi-Fi UDP: {det.udpMs < 999 ? `${det.udpMs}ms` : '—'} · 4G/5G DoH:{' '}
                            {det.dohMs < 999 ? `${det.dohMs}ms` : '—'} · DoT:{' '}
                            {det.dotMs < 999 ? `${det.dotMs}ms` : '—'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {typeof latency === 'number' && (
                        <span
                          className="text-xs font-mono font-bold tabular-nums"
                          style={{ color: badgeColor }}
                        >
                          {latency >= 999 ? 'Timeout' : `${latency} ms`}
                        </span>
                      )}

                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center border-2"
                        style={{
                          backgroundColor: isSelected ? '#00E5FF' : 'transparent',
                          borderColor: isSelected ? '#00E5FF' : 'rgba(148, 163, 184, 0.45)',
                        }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-slate-950 stroke-[3]" />}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {dnsPreset === 'custom' && (
            <div className="bg-[#12151E] rounded-2xl p-4 border border-[#00E5FF]/40 space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                IP de DNS Personalizado (IPv4)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customDnsIp}
                  onChange={(e) => onChangeCustomDnsIp(e.target.value)}
                  placeholder="Ej: 94.140.14.14"
                  className="flex-1 min-h-[44px] bg-[#090B10] border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-[#00E5FF]"
                />
                <button
                  type="button"
                  onClick={onRestartVpn}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#22C55E] text-slate-950 text-xs font-extrabold cursor-pointer"
                >
                  Aplicar DNS
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column */}
        <section className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          {/* Wi-Fi + Datos Móviles Transport Profile */}
          <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white">
              Transporte Wi-Fi y Datos Móviles (4G/5G)
            </h2>

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#090B10] border border-white/[0.06]">
              {(
                [
                  { id: 'dual', label: 'Ambos', Icon: DualNetworkIcon },
                  { id: 'wifi', label: 'Wi-Fi', Icon: WifiSignalIcon },
                  { id: 'mobile', label: '4G / 5G', Icon: MobileDataIcon },
                ] as const
              ).map(({ id, label, Icon }) => {
                const active = networkMode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onChangeNetworkMode(id)}
                    className={`min-h-[42px] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#192030] text-[#00E5FF] border border-[#00E5FF]/35'
                        : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white">DNS-over-HTTPS (Puerto 443)</p>
                  <p className="text-slate-400">
                    Obligatorio cuando tu operadora bloquea UDP/53 en 4G/5G
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={dohEnabled}
                  onClick={() => onToggleDoh(!dohEnabled)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    dohEnabled ? 'bg-[#00E5FF]/40' : 'bg-[#1D2230]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full transition-transform ${
                      dohEnabled ? 'translate-x-5 bg-[#00E5FF]' : 'translate-x-0 bg-slate-400'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/[0.06]">
                <div>
                  <p className="font-semibold text-white">Protección IPv6 Dual-Stack</p>
                  <p className="text-slate-400 font-mono truncate max-w-[230px]">
                    {selectedPresetObj.ipv6}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={ipv6Protection}
                  onClick={() => onToggleIpv6(!ipv6Protection)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    ipv6Protection ? 'bg-[#22C55E]/40' : 'bg-[#1D2230]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full transition-transform ${
                      ipv6Protection ? 'translate-x-5 bg-[#22C55E]' : 'translate-x-0 bg-slate-400'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Android Private DNS (DoT) 1-Tap Copy */}
          <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">
                DNS Privado Android (Funciona en Wi-Fi y 4G/5G)
              </h2>
              <Server className="w-4 h-4 text-[#00E5FF]" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              En tu teléfono Android ve a <strong className="text-slate-200">Ajustes → Red e Internet → DNS privado</strong> y pega este servidor para que el bloqueo funcione siempre en Wi-Fi y datos móviles:
            </p>
            <div className="flex items-center justify-between gap-2 bg-[#090B10] border border-white/10 rounded-xl px-3.5 py-2.5">
              <code className="text-xs font-mono text-[#00E5FF] truncate">
                {selectedPresetObj.dotHost}
              </code>
              <button
                type="button"
                onClick={handleCopyDotHost}
                className="px-3 py-1.5 rounded-lg bg-[#1A1E2B] hover:bg-[#242A3C] text-xs font-bold text-white flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedDot ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Diagnóstico Técnico del Repo Android (Por qué filtraba en 4G/5G) */}
          <div className="bg-[#12151E] border border-[#F59E0B]/30 rounded-2xl p-5 space-y-2.5">
            <h3 className="text-xs font-bold text-[#F59E0B]">
              Diagnóstico de AdblockVpnService.kt (Datos Móviles)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              En tu repositorio Android, <code className="text-slate-200">queryUpstreamFastParallel</code> salta a <code className="text-slate-200">1.1.1.1</code> y <code className="text-slate-200">8.8.8.8</code> después de 100ms si AdGuard demora en 4G/5G, dejando pasar anuncios. Usa solo servidores con filtro o DoH puerto 443.
            </p>
            <button
              type="button"
              onClick={handleCopyAndroidKotlinFix}
              className="w-full min-h-[40px] rounded-xl bg-[#1A1E2B] hover:bg-[#242A3C] border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copiedKotlinFix ? 'Notas copiadas' : 'Copiar notas de parche Kotlin'}</span>
            </button>
          </div>

          {/* Real DNS Ad-Block Verification Output */}
          {blockChecks && (
            <div className="bg-[#12151E] border border-[#22C55E]/35 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-white">
                Verificación de Bloqueo Real ({selectedPresetObj.title})
              </h3>
              <div className="space-y-2">
                {blockChecks.map((chk) => (
                  <div
                    key={chk.domain}
                    className="bg-[#090B10] rounded-xl px-3 py-2.5 border border-white/[0.06] space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-slate-200 truncate">{chk.domain}</span>
                      <span
                        className="font-bold shrink-0 tabular-nums"
                        style={{ color: chk.blocked ? '#22C55E' : '#F59E0B' }}
                      >
                        {chk.blocked
                          ? `BLOQUEADO (${chk.ips[0] || 'NXDOMAIN'})`
                          : `RESUELTO (${chk.ips[0] || 'OK'})`}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 tabular-nums">
                      Wi-Fi UDP: {chk.wifiUdpMs < 999 ? `${chk.wifiUdpMs}ms` : '—'} · 4G/5G DoH:{' '}
                      {chk.mobileDohMs < 999 ? `${chk.mobileDohMs}ms` : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live Latency & Jitter Chart */}
          <div className="bg-[#12151E] border border-white/[0.07] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Monitoreo en Tiempo Real</h2>
              <span className="text-xs font-mono font-bold text-[#00E5FF]">
                {activeIp} · {activeMethod.toUpperCase()}
              </span>
            </div>

            <div className="h-28 bg-[#090B10] rounded-xl border border-white/[0.07] p-2 overflow-hidden">
              <svg
                viewBox="0 0 320 100"
                preserveAspectRatio="none"
                className="w-full h-full overflow-visible"
              >
                <defs>
                  <linearGradient id="pingAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {areaPath && <path d={areaPath} fill="url(#pingAreaGrad)" />}
                {linePointsAttr && (
                  <polyline
                    fill="none"
                    stroke="#00E5FF"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={linePointsAttr}
                  />
                )}
                {chartPoints.map((pt, idx) => {
                  const isLast = idx === chartPoints.length - 1;
                  return (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={isLast ? 4 : 2.2}
                      fill={isLast ? '#22C55E' : '#00E5FF'}
                    />
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400">Estado de Red</p>
                <p className="font-bold tabular-nums mt-0.5" style={{ color: statusColor }}>
                  {statusLabel}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Jitter</p>
                <p className="font-bold tabular-nums text-white mt-0.5">±{jitter} ms</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

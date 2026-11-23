import { useEffect, useState } from 'react';
import { Activity, Check, Globe, RefreshCw, Save, Server, Smartphone, Wifi } from 'lucide-react';
import { DNS_PROVIDERS } from '../data/adblockRules';
import type { AdblockV6State, NetworkScope } from '../hooks/useAdblockPrefs';

interface FiltersTabProps {
  state: AdblockV6State;
  onSelectDnsProvider: (index: number) => void;
  onChangeNetworkScope: (scope: NetworkScope) => void;
  onToggleSwitch: (
    key: 'blockAllMode' | 'sniMode' | 'metaBlock' | 'blockQuic' | 'blockDot' | 'notifyBlocks',
    value: boolean,
  ) => void;
  onUpdateListsNow: () => void;
  onSaveManualRules: (customBlockText: string, customAllowText: string) => void;
}

interface SwitchRowProps {
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

function SwitchRow({ title, subtitle, checked, onChange }: SwitchRowProps) {
  return (
    <label className="py-3 flex items-center justify-between gap-3 cursor-pointer select-none">
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-bold text-[#F1F5FF]">{title}</p>
        <p className="text-[11px] text-[#7C90B8] mt-0.5">{subtitle}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors shrink-0 cursor-pointer ${
          checked ? 'bg-[#00E68A]' : 'bg-[#213254]'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

export function FiltersTab({
  state,
  onSelectDnsProvider,
  onChangeNetworkScope,
  onToggleSwitch,
  onUpdateListsNow,
  onSaveManualRules,
}: FiltersTabProps) {
  const [blockDraft, setBlockDraft] = useState(state.customBlockText);
  const [allowDraft, setAllowDraft] = useState(state.customAllowText);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [pingResult, setPingResult] = useState<{
    latencyMs: number;
    udpMs: number;
    dohMs: number;
    dotMs: number;
    method: string;
    loading: boolean;
  }>({ latencyMs: 0, udpMs: 0, dohMs: 0, dotMs: 0, method: '', loading: false });

  useEffect(() => {
    setBlockDraft(state.customBlockText);
    setAllowDraft(state.customAllowText);
  }, [state.customBlockText, state.customAllowText]);

  const currentProvider = DNS_PROVIDERS[state.dnsProviderIndex] ?? DNS_PROVIDERS[3];

  const handlePingDns = async () => {
    setPingResult({ latencyMs: 0, udpMs: 0, dohMs: 0, dotMs: 0, method: '', loading: true });
    try {
      const res = await fetch(
        `/api/dns/ping?ip=${encodeURIComponent(currentProvider.primary)}&preset=${encodeURIComponent(currentProvider.key)}&mode=${encodeURIComponent(state.networkScope)}`,
      );
      if (!res.ok) throw new Error('Ping error');
      const data = (await res.json()) as {
        latencyMs?: number;
        udpMs?: number;
        dohMs?: number;
        dotMs?: number;
        method?: string;
      };
      setPingResult({
        latencyMs: typeof data.latencyMs === 'number' ? data.latencyMs : 999,
        udpMs: typeof data.udpMs === 'number' ? data.udpMs : 999,
        dohMs: typeof data.dohMs === 'number' ? data.dohMs : 999,
        dotMs: typeof data.dotMs === 'number' ? data.dotMs : 999,
        method: data.method ?? 'DoH',
        loading: false,
      });
    } catch {
      setPingResult({ latencyMs: 999, udpMs: 999, dohMs: 999, dotMs: 999, method: 'Timeout', loading: false });
    }
  };

  const handleSaveRules = () => {
    onSaveManualRules(blockDraft, allowDraft);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2200);
  };

  return (
    <div className="space-y-4">
      {/* COBERTURA DE RED (WI-FI Y DATOS MÓVILES) */}
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7C90B8] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#00E68A]" />
            COBERTURA DE RED (WI-FI Y DATOS MÓVILES)
          </h2>
          <span className="text-[11px] font-bold text-[#00E68A]">Dual-Stack</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onChangeNetworkScope('dual')}
            className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              state.networkScope === 'dual'
                ? 'bg-[#082B24] border-[#00E68A] text-[#00E68A]'
                : 'bg-[#0C1322] border-[#213254] text-[#7C90B8] hover:text-[#F1F5FF]'
            }`}
          >
            <span className="flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5" />+<Smartphone className="w-3.5 h-3.5" />
            </span>
            <span>Wi-Fi + Datos</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeNetworkScope('wifi')}
            className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              state.networkScope === 'wifi'
                ? 'bg-[#0E283A] border-[#00E5FF] text-[#00E5FF]'
                : 'bg-[#0C1322] border-[#213254] text-[#7C90B8] hover:text-[#F1F5FF]'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Solo Wi-Fi</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeNetworkScope('mobile')}
            className={`min-h-[44px] px-2.5 py-2 rounded-xl border text-xs font-extrabold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
              state.networkScope === 'mobile'
                ? 'bg-[#0E283A] border-[#00E5FF] text-[#00E5FF]'
                : 'bg-[#0C1322] border-[#213254] text-[#7C90B8] hover:text-[#F1F5FF]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Datos 4G/5G</span>
          </button>
        </div>

        <p className="text-[11px] text-[#7C90B8]">
          {state.networkScope === 'dual'
            ? 'Modo Dual-Stack activo: filtra Wi-Fi (IPv4/UDP + IPv6) y Datos Móviles 4G/5G (DoH + DoT TLS 853) automáticamente.'
            : state.networkScope === 'wifi'
              ? 'Filtrando tráfico DNS por Wi-Fi local (UDP 53 + inspección SNI/QUIC).'
              : 'Filtrando tráfico DNS en Datos Móviles 4G/5G mediante DoH/DoT sin fugas de operadora.'}
        </p>
      </section>

      {/* PROVEEDOR DNS */}
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7C90B8] flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-[#00E5FF]" />
            PROVEEDOR DNS
          </h2>
          <span className="text-[11px] font-mono font-bold text-[#00E68A]">
            {currentProvider.primary}
          </span>
        </div>

        <select
          aria-label="Seleccionar proveedor DNS"
          value={state.dnsProviderIndex}
          onChange={(e) => {
            onSelectDnsProvider(Number(e.target.value));
            setPingResult({ latencyMs: 0, udpMs: 0, dohMs: 0, dotMs: 0, method: '', loading: false });
          }}
          className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#0C1322] border border-[#213254] focus:border-[#00E5FF] outline-none text-xs sm:text-sm font-bold text-[#F1F5FF] cursor-pointer"
        >
          {DNS_PROVIDERS.map((p) => (
            <option key={p.key} value={p.index} className="bg-[#0C1322] text-[#F1F5FF]">
              {p.name}
            </option>
          ))}
        </select>

        <div className="rounded-xl bg-[#0C1322] border border-[#213254] p-3 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 text-[11px] space-y-0.5">
              <p className="text-[#F1F5FF] font-bold">{currentProvider.note}</p>
              <p className="text-[#7C90B8] font-mono truncate">
                DNS: {currentProvider.primary} / {currentProvider.secondary} · DoT: {currentProvider.dotHost}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handlePingDns()}
              disabled={pingResult.loading}
              className="min-h-[36px] px-3 rounded-xl bg-[#18243E] hover:bg-[#213254] border border-[#00E5FF]/35 text-[#00E5FF] text-[11px] font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>
                {pingResult.loading
                  ? 'Midiendo...'
                  : pingResult.latencyMs > 0
                    ? `${pingResult.latencyMs} ms`
                    : 'Test Wi-Fi / 4G'}
              </span>
            </button>
          </div>

          {pingResult.latencyMs > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#213254] text-[11px] tabular-nums">
              <div className="rounded-lg bg-[#111A2D] px-2.5 py-1.5">
                <p className="text-[#7C90B8]">Wi-Fi (UDP)</p>
                <p className="font-bold text-[#00E68A]">
                  {pingResult.udpMs < 999 ? `${pingResult.udpMs} ms` : 'Timeout'}
                </p>
              </div>
              <div className="rounded-lg bg-[#111A2D] px-2.5 py-1.5">
                <p className="text-[#7C90B8]">Datos (DoH)</p>
                <p className="font-bold text-[#00E5FF]">
                  {pingResult.dohMs < 999 ? `${pingResult.dohMs} ms` : 'Timeout'}
                </p>
              </div>
              <div className="rounded-lg bg-[#111A2D] px-2.5 py-1.5">
                <p className="text-[#7C90B8]">Privado (DoT)</p>
                <p className="font-bold text-[#93C5FD]">
                  {pingResult.dotMs < 999 ? `${pingResult.dotMs} ms` : 'Timeout'}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CAPAS DE BLOQUEO AVANZADO */}
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 space-y-1">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7C90B8] pb-1">
          CAPAS DE BLOQUEO AVANZADO
        </h2>

        <div className="divide-y divide-[#213254]/70">
          <SwitchRow
            title="Bloqueo total de anuncios (de todo)"
            subtitle="Corta banners, video-ads, popups, rastreo y telemetría en juegos, apps y navegadores"
            checked={state.blockAllMode}
            onChange={(v) => onToggleSwitch('blockAllMode', v)}
          />
          <SwitchRow
            title="Inspección SNI + HTTP"
            subtitle="Detecta dominios ocultos dentro de TLS sin usar DNS"
            checked={state.sniMode}
            onChange={(v) => onToggleSwitch('sniMode', v)}
          />
          <SwitchRow
            title="Bloquear red publicitaria de Meta"
            subtitle="Corta Audience Network, Facebook Ads y rastreo en juegos"
            checked={state.metaBlock}
            onChange={(v) => onToggleSwitch('metaBlock', v)}
          />
          <SwitchRow
            title="Cortar QUIC (UDP 443 y 8443)"
            subtitle="Fuerza HTTP/2 sobre TCP para inspeccionar cabeceras SNI"
            checked={state.blockQuic}
            onChange={(v) => onToggleSwitch('blockQuic', v)}
          />
          <SwitchRow
            title="Cortar DoT / DoH evasivo"
            subtitle="Bloquea el puerto TCP 853 y DNS cifrado directo de SDKs"
            checked={state.blockDot}
            onChange={(v) => onToggleSwitch('blockDot', v)}
          />
          <SwitchRow
            title="Notificar anuncios bloqueados"
            subtitle="Muestra resumen en vivo en la barra de notificaciones"
            checked={state.notifyBlocks}
            onChange={(v) => onToggleSwitch('notifyBlocks', v)}
          />
        </div>
      </section>

      {/* BASE DE DOMINIOS PUBLICITARIOS */}
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7C90B8]">
          BASE DE DOMINIOS PUBLICITARIOS
        </h2>
        <p className="text-xs sm:text-sm font-bold text-[#F1F5FF]">
          {state.blocklistExpanded
            ? `HaGeZi Pro + StevenBlack (+${state.domainCount.toLocaleString('es-ES')} dominios)`
            : 'Lista base interna (76.000 dominios)'}
        </p>
        <button
          type="button"
          onClick={onUpdateListsNow}
          className="w-full min-h-[44px] px-4 rounded-xl bg-[#00E68A] hover:bg-[#1ef29d] text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Actualizar listas ahora</span>
        </button>
      </section>

      {/* REGLAS MANUALES */}
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 space-y-3">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7C90B8]">
          REGLAS MANUALES
        </h2>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#F1F5FF]">
            Dominios extra a bloquear (uno por línea)
          </label>
          <textarea
            rows={3}
            value={blockDraft}
            onChange={(e) => setBlockDraft(e.target.value)}
            placeholder="mollyflow.com&#10;thecatmachine.com"
            className="w-full p-3 rounded-xl bg-[#0C1322] border border-[#213254] focus:border-[#FF4D6D] outline-none font-mono text-xs text-[#F1F5FF] placeholder:text-[#7C90B8]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#F1F5FF]">
            Excepciones (permitir siempre)
          </label>
          <textarea
            rows={2}
            value={allowDraft}
            onChange={(e) => setAllowDraft(e.target.value)}
            placeholder="api.steampowered.com"
            className="w-full p-3 rounded-xl bg-[#0C1322] border border-[#213254] focus:border-[#00E68A] outline-none font-mono text-xs text-[#F1F5FF] placeholder:text-[#7C90B8]"
          />
        </div>

        <button
          type="button"
          onClick={handleSaveRules}
          className="w-full min-h-[44px] px-4 rounded-xl bg-[#00E5FF] hover:bg-[#38ebff] text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          {savedFeedback ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{savedFeedback ? 'Reglas guardadas y aplicadas' : 'Guardar y aplicar reglas'}</span>
        </button>
      </section>
    </div>
  );
}

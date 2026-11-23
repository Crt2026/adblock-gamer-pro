import { AlertTriangle, RefreshCw, ShieldAlert, Smartphone, Wifi } from 'lucide-react';
import { shortDnsName, DNS_PROVIDERS } from '../data/adblockRules';
import type { AdblockV6State, NetworkScope } from '../hooks/useAdblockPrefs';
import { PowerCoreIcon, ReactorRingSvg } from './Icons';

interface ProtectionTabProps {
  state: AdblockV6State;
  onTogglePower: () => void;
  onChangeNetworkScope: (scope: NetworkScope) => void;
  onUpdateLists: () => void;
  onGoToActivity: () => void;
  onGoToPermissions: () => void;
}

function formatDomainsShort(count: number): string {
  if (count >= 1000) {
    return `${Math.round(count / 1000)}k`;
  }
  return String(count);
}

const SCOPE_LABELS: Record<NetworkScope, string> = {
  dual: 'Wi-Fi + Datos móviles (4G/5G)',
  wifi: 'Solo Wi-Fi (IPv4/UDP + IPv6)',
  mobile: 'Solo Datos móviles 4G/5G (DoH/DoT)',
};

export function ProtectionTab({
  state,
  onTogglePower,
  onChangeNetworkScope,
  onUpdateLists,
  onGoToActivity,
  onGoToPermissions,
}: ProtectionTabProps) {
  const provider = DNS_PROVIDERS[state.dnsProviderIndex] ?? DNS_PROVIDERS[3];
  const totalBlocked =
    state.dnsBlocked + state.sniBlocked + state.quicDropped + state.encryptedCut;

  const missingPermissions =
    !state.permissions.vpn ||
    !state.permissions.notifications ||
    !state.permissions.batteryUnrestricted ||
    !state.permissions.autoStart;

  return (
    <div className="space-y-4">
      {/* Cyber-Reactor Core Card */}
      <section className="rounded-[22px] bg-[#111A2D] border border-[#213254] p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: state.enabled
              ? 'radial-gradient(circle at 50% 38%, rgba(0, 230, 138, 0.16), transparent 64%)'
              : 'radial-gradient(circle at 50% 38%, rgba(255, 77, 109, 0.12), transparent 64%)',
          }}
        />

        <div className="relative flex flex-col items-center">
          {/* Reactor Orb Container */}
          <div className="relative w-56 h-56 flex items-center justify-center">
            {state.enabled && (
              <div
                aria-hidden="true"
                className="animate-reactor-pulse-ring absolute inset-2 rounded-full border-2 border-[#00E68A]/55 shadow-[0_0_32px_rgba(0,230,138,0.28)]"
              />
            )}

            <div
              aria-hidden="true"
              className={`absolute inset-0 ${state.enabled ? 'animate-reactor-orbit-spin' : 'opacity-65'}`}
            >
              <ReactorRingSvg active={state.enabled} className="w-full h-full" />
            </div>

            <button
              type="button"
              onClick={onTogglePower}
              aria-pressed={state.enabled}
              aria-label={state.enabled ? 'Desactivar Adblock Gamer' : 'Activar Adblock Gamer'}
              className={`relative w-[152px] h-[152px] rounded-full flex flex-col items-center justify-center gap-1.5 border-2 transition-transform active:scale-95 cursor-pointer shadow-2xl ${
                state.enabled
                  ? 'border-[#00E68A]/80 shadow-[0_0_40px_rgba(0,230,138,0.25)]'
                  : 'border-[#33486E] shadow-[0_0_24px_rgba(8,13,23,0.8)]'
              }`}
              style={{
                background: state.enabled
                  ? 'radial-gradient(circle at center, #135241 0%, #0B2930 58%, #081424 100%)'
                  : 'radial-gradient(circle at center, #2B1726 0%, #151C2F 60%, #0B1220 100%)',
              }}
            >
              <div
                className={`w-[68px] h-[68px] rounded-full border flex items-center justify-center ${
                  state.enabled
                    ? 'bg-[#081F22]/90 border-[#00E68A]/50'
                    : 'bg-[#0C1322]/90 border-[#33486E]'
                }`}
              >
                <PowerCoreIcon active={state.enabled} className="w-11 h-11" />
              </div>
              <span
                className={`text-xs font-black tracking-[0.16em] ${
                  state.enabled ? 'text-[#00E68A]' : 'text-[#F1F5FF]'
                }`}
              >
                {state.enabled ? 'ACTIVA' : 'ACTIVAR'}
              </span>
            </button>
          </div>

          {/* Primary Status Title */}
          <p
            className={`mt-2 text-base font-extrabold tracking-tight text-center ${
              state.enabled ? 'text-[#00E68A]' : 'text-[#FF4D6D]'
            }`}
          >
            {state.enabled ? 'Protegido · Llave VPN activa' : 'Protección desactivada'}
          </p>
          <p className="mt-1 text-xs text-[#7C90B8] text-center">
            {state.enabled
              ? `Bloqueando anuncios de todo (juegos, apps y web) · ${shortDnsName(provider.name)}`
              : 'Toca el reactor central para iniciar el túnel local (tun0)'}
          </p>

          {/* Wi-Fi & Datos Móviles Selector Strip */}
          <div className="mt-4 w-full grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#0C1322] border border-[#213254]">
            <button
              type="button"
              onClick={() => onChangeNetworkScope('dual')}
              className={`min-h-[38px] px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                state.networkScope === 'dual'
                  ? 'bg-[#00E68A] text-slate-950'
                  : 'text-[#7C90B8] hover:text-[#F1F5FF]'
              }`}
            >
              <Wifi className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Wi-Fi + Datos</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeNetworkScope('wifi')}
              className={`min-h-[38px] px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                state.networkScope === 'wifi'
                  ? 'bg-[#00E5FF] text-slate-950'
                  : 'text-[#7C90B8] hover:text-[#F1F5FF]'
              }`}
            >
              <Wifi className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Solo Wi-Fi</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeNetworkScope('mobile')}
              className={`min-h-[38px] px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                state.networkScope === 'mobile'
                  ? 'bg-[#00E5FF] text-slate-950'
                  : 'text-[#7C90B8] hover:text-[#F1F5FF]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Datos 4G/5G</span>
            </button>
          </div>

          {/* 3-Column Feature Strip */}
          <div className="mt-3 w-full grid grid-cols-3 gap-2 pt-3 border-t border-[#213254] text-center">
            <div className="rounded-xl bg-[#0C1322] border border-[#213254] py-2 px-1.5">
              <p
                className={`text-[11px] font-bold truncate ${
                  state.enabled ? 'text-[#00E68A]' : 'text-[#7C90B8]'
                }`}
              >
                ● {state.enabled ? 'Túnel activo' : 'Túnel pausado'}
              </p>
            </div>
            <div className="rounded-xl bg-[#0C1322] border border-[#213254] py-2 px-1.5">
              <p
                className={`text-[11px] font-bold truncate ${
                  state.enabled && state.blockAllMode ? 'text-[#00E68A]' : 'text-[#7C90B8]'
                }`}
              >
                {state.blockAllMode ? 'Bloqueo total' : 'Filtro estándar'}
              </p>
            </div>
            <div className="rounded-xl bg-[#0C1322] border border-[#213254] py-2 px-1.5">
              <p
                className={`text-[11px] font-bold truncate ${
                  state.enabled && state.sniMode ? 'text-[#00E5FF]' : 'text-[#7C90B8]'
                }`}
              >
                {state.blockQuic ? 'QUIC + SNI' : 'Solo DNS'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conditional Missing Permissions Alert Banner */}
      {missingPermissions && (
        <div className="rounded-2xl bg-[#271E0B] border border-[#FFC247]/50 px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertTriangle className="w-5 h-5 text-[#FFC247] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#FFC247]">
                Faltan permisos recomendados
              </p>
              <p className="text-[11px] text-amber-200/80 truncate">
                Actívalos para evitar desconexiones en segundo plano.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onGoToPermissions}
            className="min-h-[36px] px-3 rounded-xl bg-[#FFC247] hover:bg-[#ffd06b] text-slate-950 text-xs font-extrabold shrink-0 cursor-pointer transition-colors"
          >
            Revisar
          </button>
        </div>
      )}

      {/* 3 Metric Cards */}
      <section className="grid grid-cols-3 gap-2.5">
        <div className="rounded-[18px] bg-[#111A2D] border border-[#213254] p-3.5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#7C90B8]">
            Bloqueados
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-[#00E68A] tabular-nums">
            {totalBlocked.toLocaleString('es-ES')}
          </p>
        </div>
        <div className="rounded-[18px] bg-[#111A2D] border border-[#213254] p-3.5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#7C90B8]">
            Consultas
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-[#00E5FF] tabular-nums">
            {state.packetsRead.toLocaleString('es-ES')}
          </p>
        </div>
        <div className="rounded-[18px] bg-[#111A2D] border border-[#213254] p-3.5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#7C90B8]">
            Dominios
          </p>
          <p className="mt-1 text-xl sm:text-2xl font-black text-[#93C5FD] tabular-nums">
            {formatDomainsShort(state.domainCount)}
          </p>
        </div>
      </section>

      {/* ÚLTIMO ANUNCIO CORTADO */}
      <section className="rounded-[18px] bg-[#111A2D] border border-[#213254] p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#2C101C] border border-[#FF4D6D]/40 flex items-center justify-center text-[#FF4D6D] shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#7C90B8]">
            ÚLTIMO ANUNCIO CORTADO
          </p>
          <p className="mt-0.5 text-sm font-mono font-bold text-[#FF4D6D] truncate">
            {state.lastBlockedDomain || 'Ninguno aún'}
          </p>
        </div>
      </section>

      {/* ESTADO DEL TÚNEL (tun0) */}
      <section className="rounded-[18px] bg-[#111A2D] border border-[#213254] p-4 space-y-2.5">
        <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#7C90B8]">
          ESTADO DEL TÚNEL (tun0)
        </h2>

        <div className="divide-y divide-[#213254]/70 text-xs sm:text-sm">
          <div className="py-2 flex items-center justify-between gap-2">
            <span className="text-[#7C90B8]">Cobertura de red</span>
            <span className="font-bold text-[#00E68A] truncate">
              {SCOPE_LABELS[state.networkScope]}
            </span>
          </div>
          <div className="py-2 flex items-center justify-between gap-2">
            <span className="text-[#7C90B8]">Alcance del filtro</span>
            <span className="font-bold text-[#00E5FF] truncate">
              {state.blockAllMode ? 'Todo (Juegos, Apps, Web y Video)' : 'Solo listas DNS'}
            </span>
          </div>
          <div className="py-2 flex items-center justify-between gap-2">
            <span className="text-[#7C90B8]">Paquetes filtrados</span>
            <span className="font-bold text-[#F1F5FF] tabular-nums">
              {state.packetsRead.toLocaleString('es-ES')}
            </span>
          </div>
          <div className="py-2 flex items-center justify-between gap-2">
            <span className="text-[#7C90B8]">DoT / DoH bloqueados</span>
            <span className="font-bold text-[#00E5FF] tabular-nums">
              {state.encryptedCut.toLocaleString('es-ES')}
            </span>
          </div>
          <div className="py-2 flex items-center justify-between gap-2">
            <span className="text-[#7C90B8]">QUIC cortados (443/8443)</span>
            <span className="font-bold text-[#00E5FF] tabular-nums">
              {state.quicDropped.toLocaleString('es-ES')}
            </span>
          </div>
          <div className="py-2 flex items-center justify-between gap-2">
            <span className="text-[#7C90B8]">Servidor DNS</span>
            <span className="font-bold text-[#00E68A] truncate">
              {shortDnsName(provider.name)}
            </span>
          </div>
        </div>
      </section>

      {/* 2 Bottom Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onUpdateLists}
          className="min-h-[46px] px-4 rounded-2xl bg-[#00E68A] hover:bg-[#1ef29d] text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <RefreshCw className="w-4 h-4 shrink-0" />
          <span>Actualizar listas</span>
        </button>

        <button
          type="button"
          onClick={onGoToActivity}
          className="min-h-[46px] px-4 rounded-2xl bg-[#18243E] hover:bg-[#213254] border border-[#213254] text-[#F1F5FF] text-xs sm:text-sm font-extrabold flex items-center justify-center cursor-pointer transition-colors"
        >
          Ver actividad
        </button>
      </div>
    </div>
  );
}

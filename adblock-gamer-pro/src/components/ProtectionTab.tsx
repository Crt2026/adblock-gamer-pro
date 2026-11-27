import { AlertTriangle } from 'lucide-react';
import { DNS_PROVIDERS, shortDnsName } from '../data/adblockRules';
import type { AdblockV6State, NetworkScope } from '../hooks/useAdblockPrefs';
import {
  BlockedShieldIcon,
  DatabaseGlobeIcon,
  LastCutAlertIcon,
  MobileSignalIcon,
  NavActivityIcon,
  PowerCoreIcon,
  QueryPulseIcon,
  ReactorInnerRingSvg,
  ReactorRingSvg,
  RefreshSyncIcon,
  ServerDnsIcon,
  TunnelStackIcon,
  WifiDualIcon,
  WifiWaveIcon,
} from './Icons';

interface ProtectionTabProps {
  state: AdblockV6State;
  onTogglePower: () => void;
  onChangeNetworkScope: (scope: NetworkScope) => void;
  onToggleBlockAll: (enabled: boolean) => void;
  onUpdateLists: () => void;
  onGoToActivity: () => void;
  onGoToFilters: () => void;
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
  onToggleBlockAll,
  onUpdateLists,
  onGoToActivity,
  onGoToFilters,
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
            className="min-h-[38px] px-3.5 rounded-xl bg-[#FFC247] hover:bg-[#ffd06b] text-slate-950 text-xs font-extrabold shrink-0 cursor-pointer transition-colors whitespace-nowrap"
          >
            Revisar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left / Primary Anchor: Upgraded Machined Cyber-Reactor Core */}
        <section className="lg:col-span-7 rounded-[24px] bg-[#111A2D] border border-[#213254] p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between">
          <div
            className="pointer-events-none absolute inset-0 opacity-50"
            style={{
              background: state.enabled
                ? 'radial-gradient(circle at 50% 35%, rgba(0, 230, 138, 0.18), rgba(0, 229, 255, 0.04) 45%, transparent 70%)'
                : 'radial-gradient(circle at 50% 35%, rgba(255, 77, 109, 0.14), transparent 65%)',
            }}
          />

          <div className="relative flex flex-col items-center">
            {/* Dual Counter-Rotating HUD + Machined Bezel Power Button */}
            <div className="relative w-64 h-64 sm:w-68 sm:h-68 flex items-center justify-center">
              {state.enabled && (
                <div
                  aria-hidden="true"
                  className="animate-reactor-pulse-ring absolute inset-3 rounded-full border-2 border-[#00E68A]/50 shadow-[0_0_40px_rgba(0,230,138,0.28)]"
                />
              )}

              {/* Outer HUD ring (clockwise) */}
              <div
                aria-hidden="true"
                className={`absolute inset-0 ${state.enabled ? 'animate-reactor-orbit-spin' : 'opacity-60'}`}
              >
                <ReactorRingSvg active={state.enabled} className="w-full h-full" />
              </div>

              {/* Inner reticle ring (counter-clockwise) */}
              <div
                aria-hidden="true"
                className={`absolute inset-0 ${state.enabled ? 'animate-reactor-orbit-spin-reverse' : 'opacity-50'}`}
              >
                <ReactorInnerRingSvg active={state.enabled} className="w-full h-full" />
              </div>

              {/* Machined Titanium Outer Bezel */}
              <div
                className="relative p-[6px] rounded-full shadow-[0_18px_45px_rgba(0,0,0,0.65)]"
                style={{
                  background: state.enabled
                    ? 'linear-gradient(145deg, #1E5D55 0%, #0E1B30 48%, #0E4B5A 100%)'
                    : 'linear-gradient(145deg, #34486E 0%, #0F1729 52%, #3D1B2C 100%)',
                }}
              >
                <button
                  type="button"
                  onClick={onTogglePower}
                  aria-pressed={state.enabled}
                  aria-label={state.enabled ? 'Desactivar Adblock Gamer' : 'Activar Adblock Gamer'}
                  className={`group relative w-[158px] h-[158px] sm:w-[166px] sm:h-[166px] rounded-full flex flex-col items-center justify-center gap-1.5 border transition-transform duration-150 active:scale-[0.94] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                    state.enabled
                      ? 'border-[#00E68A]/85 shadow-[inset_0_2px_18px_rgba(0,230,138,0.32)]'
                      : 'border-[#445B87] shadow-[inset_0_2px_14px_rgba(0,0,0,0.7)]'
                  }`}
                  style={{
                    background: state.enabled
                      ? 'radial-gradient(circle at 50% 34%, #18644F 0%, #0B2D35 55%, #071321 100%)'
                      : 'radial-gradient(circle at 50% 34%, #311B2B 0%, #151E33 58%, #090F1D 100%)',
                  }}
                >
                  {/* Specular highlight arc */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-2 rounded-full border border-white/10"
                  />

                  <div
                    className={`w-[74px] h-[74px] rounded-full border flex items-center justify-center transition-transform duration-150 group-hover:scale-105 ${
                      state.enabled
                        ? 'bg-[#071D21]/90 border-[#00E68A]/55 shadow-[0_0_22px_rgba(0,230,138,0.25)]'
                        : 'bg-[#0B1221]/90 border-[#3B507A]'
                    }`}
                  >
                    <PowerCoreIcon active={state.enabled} className="w-13 h-13" />
                  </div>

                  <span
                    className={`text-xs font-black tracking-[0.18em] ${
                      state.enabled ? 'text-[#00E68A]' : 'text-[#F1F5FF]'
                    }`}
                  >
                    {state.enabled ? 'ACTIVA' : 'ACTIVAR'}
                  </span>
                  <span className="text-[10px] font-bold tracking-wider text-[#7C90B8]">
                    {state.enabled ? 'TUN0 PROTEGIDO' : 'TOCA PARA INICIAR'}
                  </span>
                </button>
              </div>
            </div>

            {/* Primary Status Title */}
            <p
              className={`mt-2 text-base sm:text-lg font-extrabold tracking-tight text-center ${
                state.enabled ? 'text-[#00E68A]' : 'text-[#FF4D6D]'
              }`}
            >
              {state.enabled ? 'Protegido · Llave VPN activa' : 'Protección desactivada'}
            </p>
            <p className="mt-1 text-xs text-[#7C90B8] text-center max-w-md">
              {state.enabled
                ? `Bloqueando anuncios de todo (juegos, apps y web) · ${shortDnsName(provider.name)}`
                : 'Pulsa el reactor central para iniciar el túnel local (tun0)'}
            </p>

            {/* Wi-Fi & Datos Móviles Selector Strip */}
            <div className="mt-4 w-full grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#0C1322] border border-[#213254]">
              <button
                type="button"
                onClick={() => onChangeNetworkScope('dual')}
                className={`min-h-[42px] px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  state.networkScope === 'dual'
                    ? 'bg-[#00E68A] text-slate-950'
                    : 'text-[#7C90B8] hover:text-[#F1F5FF]'
                }`}
              >
                <WifiDualIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Wi-Fi + Datos</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeNetworkScope('wifi')}
                className={`min-h-[42px] px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  state.networkScope === 'wifi'
                    ? 'bg-[#00E5FF] text-slate-950'
                    : 'text-[#7C90B8] hover:text-[#F1F5FF]'
                }`}
              >
                <WifiWaveIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Solo Wi-Fi</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeNetworkScope('mobile')}
                className={`min-h-[42px] px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                  state.networkScope === 'mobile'
                    ? 'bg-[#00E5FF] text-slate-950'
                    : 'text-[#7C90B8] hover:text-[#F1F5FF]'
                }`}
              >
                <MobileSignalIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">Datos 4G/5G</span>
              </button>
            </div>
          </div>

          {/* Bottom 3-Column Feature Strip inside Reactor Card */}
          <div className="relative mt-4 pt-3.5 border-t border-[#213254] grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
            <button
              type="button"
              onClick={onTogglePower}
              className="min-h-[36px] py-1.5 px-1 rounded-lg hover:bg-[#16223B] transition-colors cursor-pointer truncate"
            >
              <span className={state.enabled ? 'text-[#00E68A]' : 'text-[#FF4D6D]'}>
                {state.enabled ? 'Túnel activo' : 'Túnel pausado'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onToggleBlockAll(!state.blockAllMode)}
              className="min-h-[36px] py-1.5 px-1 rounded-lg hover:bg-[#16223B] transition-colors cursor-pointer truncate"
            >
              <span className={state.blockAllMode ? 'text-[#00E68A]' : 'text-[#7C90B8]'}>
                {state.blockAllMode ? 'Bloqueo total ON' : 'Filtro básico'}
              </span>
            </button>
            <button
              type="button"
              onClick={onGoToFilters}
              className="min-h-[36px] py-1.5 px-1 rounded-lg hover:bg-[#16223B] transition-colors cursor-pointer truncate flex items-center justify-center gap-1"
            >
              <ServerDnsIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[#00E5FF] truncate">{shortDnsName(provider.name)}</span>
            </button>
          </div>
        </section>

        {/* Right Column: Metrics, Last Cut & Tunnel State */}
        <div className="lg:col-span-5 flex flex-col gap-4 justify-between">
          {/* 3 Metric Cards with custom bitono icons */}
          <section className="grid grid-cols-3 gap-2.5">
            <div className="rounded-[18px] bg-[#111A2D] border border-[#213254] p-3.5 flex flex-col items-center text-center gap-1">
              <BlockedShieldIcon className="w-5 h-5" />
              <p className="text-[11px] font-semibold text-[#7C90B8]">Bloqueados</p>
              <p className="text-xl font-black text-[#00E68A] tabular-nums">
                {totalBlocked.toLocaleString('es-ES')}
              </p>
            </div>
            <div className="rounded-[18px] bg-[#111A2D] border border-[#213254] p-3.5 flex flex-col items-center text-center gap-1">
              <QueryPulseIcon className="w-5 h-5" />
              <p className="text-[11px] font-semibold text-[#7C90B8]">Consultas</p>
              <p className="text-xl font-black text-[#00E5FF] tabular-nums">
                {state.packetsRead.toLocaleString('es-ES')}
              </p>
            </div>
            <div className="rounded-[18px] bg-[#111A2D] border border-[#213254] p-3.5 flex flex-col items-center text-center gap-1">
              <DatabaseGlobeIcon className="w-5 h-5" />
              <p className="text-[11px] font-semibold text-[#7C90B8]">Dominios</p>
              <p className="text-xl font-black text-[#93C5FD] tabular-nums">
                {formatDomainsShort(state.domainCount)}
              </p>
            </div>
          </section>

          {/* Último anuncio cortado */}
          <button
            type="button"
            onClick={onGoToActivity}
            className="w-full text-left rounded-[18px] bg-[#111A2D] hover:bg-[#152038] border border-[#213254] p-4 flex items-center gap-3 cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[#2C101C] border border-[#FF4D6D]/40 flex items-center justify-center shrink-0">
              <LastCutAlertIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#7C90B8]">Último anuncio cortado</p>
              <p className="mt-0.5 text-sm font-mono font-bold text-[#FF4D6D] truncate">
                {state.lastBlockedDomain || 'Ninguno aún'}
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#00E5FF] shrink-0">Ver →</span>
          </button>

          {/* Estado del túnel (tun0) */}
          <section className="rounded-[18px] bg-[#111A2D] border border-[#213254] p-4 space-y-2.5 flex-1">
            <h2 className="text-xs font-bold text-[#F1F5FF] flex items-center gap-2">
              <TunnelStackIcon className="w-4 h-4 shrink-0" />
              <span>Estado del túnel (tun0)</span>
            </h2>

            <div className="divide-y divide-[#213254]/70 text-xs">
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

          {/* 2 Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onUpdateLists}
              className="min-h-[48px] px-4 rounded-2xl bg-[#00E68A] hover:bg-[#1ef29d] text-slate-950 text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
            >
              <RefreshSyncIcon className="w-4 h-4 shrink-0" />
              <span>Actualizar listas</span>
            </button>

            <button
              type="button"
              onClick={onGoToActivity}
              className="min-h-[48px] px-4 rounded-2xl bg-[#18243E] hover:bg-[#213254] border border-[#213254] text-[#F1F5FF] text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
            >
              <NavActivityIcon active className="w-4 h-4 shrink-0 text-[#00E5FF]" />
              <span>Ver actividad</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

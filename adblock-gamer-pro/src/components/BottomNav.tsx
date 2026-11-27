import { useState } from 'react';
import {
  AppBrandShieldIcon,
  KeyGamerIcon,
  NavActivityIcon,
  NavFiltersIcon,
  NavPermsIcon,
  NavShieldIcon,
} from './Icons';

export type V6Tab = 'PROTECTION' | 'ACTIVITY' | 'FILTERS' | 'PERMS';

interface NavProps {
  selectedTab: V6Tab;
  onSelectTab: (tab: V6Tab) => void;
  enabled: boolean;
  onTogglePower: () => void;
  networkLabel: string;
}

const TABS: Array<{ id: V6Tab; label: string; Icon: typeof NavShieldIcon }> = [
  { id: 'PROTECTION', label: 'Protección', Icon: NavShieldIcon },
  { id: 'ACTIVITY', label: 'Actividad', Icon: NavActivityIcon },
  { id: 'FILTERS', label: 'Filtros', Icon: NavFiltersIcon },
  { id: 'PERMS', label: 'Permisos', Icon: NavPermsIcon },
];

function BrandLogo({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const dim = size === 'sm' ? 'w-9 h-9' : 'w-10 h-10';

  if (imgFailed) {
    return (
      <div
        className={`${dim} rounded-xl border border-[#213254] bg-[#111A2D] flex items-center justify-center shrink-0`}
      >
        <AppBrandShieldIcon className="w-6 h-6" />
      </div>
    );
  }

  return (
    <img
      src="/icono_gamer_v6.png"
      alt="Adblock Gamer v6.2"
      referrerPolicy="no-referrer"
      onError={() => setImgFailed(true)}
      className={`${dim} rounded-xl border border-[#213254] object-cover shrink-0 bg-[#111A2D]`}
    />
  );
}

export function TopHeaderBar({
  enabled,
  onTogglePower,
  networkLabel,
}: {
  enabled: boolean;
  onTogglePower: () => void;
  networkLabel: string;
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#0C1322]/95 backdrop-blur-md border-b border-[#213254]">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandLogo size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#F1F5FF] tracking-tight">
              <span className="truncate">Adblock Gamer</span>
              <span className="text-xs font-bold text-[#00E5FF] shrink-0">v6.2</span>
            </div>
            <p className="text-[11px] font-medium text-[#7C90B8] truncate">
              {enabled ? 'Activo' : 'Pausado'} · {networkLabel}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTogglePower}
          title={enabled ? 'Desactivar protección VPN' : 'Activar protección VPN'}
          className={`min-h-[40px] px-3 py-1.5 rounded-xl border flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
            enabled
              ? 'bg-[#082B24] border-[#00E68A]/50 text-[#00E68A] hover:bg-[#0B382F]'
              : 'bg-[#2C101C] border-[#FF4D6D]/50 text-[#FF4D6D] hover:bg-[#3A1424]'
          }`}
        >
          <KeyGamerIcon className="w-4 h-4 shrink-0" />
          <span className="text-[11px] font-extrabold tracking-wide">
            {enabled ? 'Llave activa' : 'Sin llave'}
          </span>
        </button>
      </div>
    </header>
  );
}

export function BottomNav({
  selectedTab,
  onSelectTab,
}: {
  selectedTab: V6Tab;
  onSelectTab: (tab: V6Tab) => void;
}) {
  return (
    <nav
      aria-label="Navegación principal"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0C1322]/98 backdrop-blur-md border-t border-[#213254] h-16 grid grid-cols-4"
    >
      {TABS.map(({ id, label, Icon }) => {
        const active = selectedTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectTab(id)}
            className="relative min-h-[44px] flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-[#00E5FF]"
          >
            <span
              className={`absolute top-0 h-[3px] w-10 rounded-b-full transition-opacity ${
                active ? 'bg-[#00E5FF] opacity-100' : 'opacity-0'
              }`}
            />
            <Icon active={active} className={`w-5 h-5 ${active ? 'text-[#00E5FF]' : 'text-[#7C90B8]'}`} />
            <span
              className={`text-[11px] font-bold leading-none whitespace-nowrap ${
                active ? 'text-[#F1F5FF]' : 'text-[#7C90B8]'
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export function DesktopSidebar({
  selectedTab,
  onSelectTab,
  enabled,
  onTogglePower,
  networkLabel,
}: NavProps) {
  return (
    <aside className="hidden md:flex md:w-68 md:shrink-0 md:flex-col md:sticky md:top-0 md:h-screen bg-[#0C1322] border-r border-[#213254] p-5 justify-between">
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-[#213254]">
          <BrandLogo size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold text-[#F1F5FF] truncate">Adblock Gamer</span>
              <span className="text-xs font-bold text-[#00E5FF] shrink-0">v6.2</span>
            </div>
            <p className="text-[11px] text-[#7C90B8] truncate">
              {enabled ? 'Activo' : 'Pausado'} · {networkLabel}
            </p>
          </div>
        </div>

        <nav className="space-y-1.5" aria-label="Menú lateral">
          {TABS.map(({ id, label, Icon }) => {
            const active = selectedTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectTab(id)}
                className={`w-full min-h-[46px] px-3.5 rounded-xl flex items-center gap-3 text-left transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
                  active
                    ? 'bg-[#111A2D] border border-[#00E5FF]/45 text-[#F1F5FF]'
                    : 'border border-transparent text-[#7C90B8] hover:bg-[#111A2D]/70 hover:text-[#F1F5FF]'
                }`}
              >
                <Icon active={active} className={`w-5 h-5 shrink-0 ${active ? 'text-[#00E5FF]' : 'text-[#7C90B8]'}`} />
                <span className="text-sm font-bold">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <button
        type="button"
        onClick={onTogglePower}
        className={`w-full min-h-[46px] px-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#00E5FF] ${
          enabled
            ? 'bg-[#082B24] border-[#00E68A]/50 text-[#00E68A] hover:bg-[#0B382F]'
            : 'bg-[#2C101C] border-[#FF4D6D]/50 text-[#FF4D6D] hover:bg-[#3A1424]'
        }`}
      >
        <span className="flex items-center gap-2 text-xs font-extrabold tracking-wide">
          <KeyGamerIcon className="w-4 h-4 shrink-0" />
          {enabled ? 'Llave VPN activa' : 'Sin llave VPN'}
        </span>
        <span className="text-[11px] font-extrabold">{enabled ? 'ON' : 'OFF'}</span>
      </button>
    </aside>
  );
}

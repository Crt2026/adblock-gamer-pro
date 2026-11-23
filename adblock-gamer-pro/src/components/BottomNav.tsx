import {
  BrandShieldIcon,
  NavDnsIcon,
  NavHomeIcon,
  NavSettingsIcon,
  NavYoutubeIcon,
} from './Icons';

export type AppTab = 'HOME' | 'BROWSER' | 'ADVANCED' | 'SETTINGS';

interface BottomNavProps {
  selectedTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  isVpnRunning: boolean;
  isProPurchased: boolean;
}

const TABS: Array<{
  id: AppTab;
  label: string;
  shortLabel: string;
  Icon: typeof NavHomeIcon;
  accent: string;
}> = [
  { id: 'HOME', label: 'Protección', shortLabel: 'Inicio', Icon: NavHomeIcon, accent: '#00E5FF' },
  { id: 'BROWSER', label: 'YouTube Sin Anuncios', shortLabel: 'YouTube', Icon: NavYoutubeIcon, accent: '#EF4444' },
  { id: 'ADVANCED', label: 'DNS Wi-Fi y Móvil', shortLabel: 'DNS', Icon: NavDnsIcon, accent: '#22C55E' },
  { id: 'SETTINGS', label: 'Ajustes y PRO', shortLabel: 'Ajustes', Icon: NavSettingsIcon, accent: '#F59E0B' },
];

export function DesktopSidebar({
  selectedTab,
  onSelectTab,
  isVpnRunning,
  isProPurchased,
}: BottomNavProps) {
  return (
    <aside className="hidden md:flex md:flex-col md:w-64 lg:w-72 shrink-0 border-r border-white/[0.07] bg-[#0D1017] min-h-screen sticky top-0 self-start">
      <div className="px-6 py-6 border-b border-white/[0.07] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] shrink-0">
          <BrandShieldIcon className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white truncate">
              Adblock Gamer
            </span>
            {isProPurchased && (
              <span className="text-[11px] font-bold text-[#F59E0B]">PRO</span>
            )}
          </div>
          <p className="text-xs text-slate-400 truncate">
            {isVpnRunning ? 'Escudo Activo' : 'En pausa'} · Dual-Stack
          </p>
        </div>
      </div>

      <nav aria-label="Navegación principal" className="flex-1 p-4 space-y-1.5">
        {TABS.map((tab) => {
          const isSelected = selectedTab === tab.id;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center gap-3 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-[#171C28] text-white border border-white/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <TabIcon
                className="w-5 h-5 shrink-0"
                style={{ color: isSelected ? tab.accent : undefined }}
              />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-5 border-t border-white/[0.07] text-xs text-slate-500 space-y-1">
        <p className="font-semibold text-slate-300">Cobertura Dual-Stack</p>
        <p>Wi-Fi + Datos Móviles (4G/5G)</p>
      </div>
    </aside>
  );
}

export function BottomNav({ selectedTab, onSelectTab }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegación móvil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#0D1017]/95 backdrop-blur-md border-t border-white/[0.08]"
    >
      <div className="h-full grid grid-cols-4 items-center px-2">
        {TABS.map((tab) => {
          const isSelected = selectedTab === tab.id;
          const TabIcon = tab.Icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className="min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-colors cursor-pointer"
            >
              <TabIcon
                className="w-[22px] h-[22px]"
                style={{ color: isSelected ? tab.accent : '#94A3B8' }}
              />
              <span
                className="mt-1 text-[10px] font-semibold tracking-tight whitespace-nowrap"
                style={{ color: isSelected ? tab.accent : '#94A3B8' }}
              >
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import { useMemo, useState, type FormEvent } from 'react';
import { parseDomainLines } from '../data/adblockRules';
import type { AdblockV6State } from '../hooks/useAdblockPrefs';
import {
  AdAllowEntryIcon,
  AdBlockEntryIcon,
  BlockedShieldIcon,
  NavActivityIcon,
  ProbePlayIcon,
  SearchGlassIcon,
} from './Icons';

interface ActivityTabProps {
  state: AdblockV6State;
  onToggleDomainRule: (domain: string, block: boolean) => void;
  onInspectDomain: (rawDomain: string) => { domain: string; blocked: boolean; reason: string } | null;
}

type ActivityFilter = 0 | 1 | 2;

const QUICK_TEST_DOMAINS = [
  'doubleclick.net',
  'unityads.unity3d.com',
  'ads.youtube.com',
  'pixel.facebook.com',
  'm.youtube.com',
];

export function ActivityTab({
  state,
  onToggleDomainRule,
  onInspectDomain,
}: ActivityTabProps) {
  const [filterMode, setFilterMode] = useState<ActivityFilter>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [probeInput, setProbeInput] = useState('');
  const [lastProbeMsg, setLastProbeMsg] = useState<string | null>(null);

  const counts = useMemo(() => {
    const blocked = state.trafficLog.filter((item) => item.blocked).length;
    const allowed = state.trafficLog.length - blocked;
    return {
      total: state.trafficLog.length,
      blocked,
      allowed,
    };
  }, [state.trafficLog]);

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.trafficLog.filter((item) => {
      if (filterMode === 1 && !item.blocked) return false;
      if (filterMode === 2 && item.blocked) return false;
      if (q && !item.domain.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [state.trafficLog, filterMode, searchQuery]);

  const manualBlockedCount = useMemo(
    () => parseDomainLines(state.customBlockText).length,
    [state.customBlockText],
  );
  const manualAllowedCount = useMemo(
    () => parseDomainLines(state.customAllowText).length,
    [state.customAllowText],
  );

  const runProbe = (rawDomain: string) => {
    const res = onInspectDomain(rawDomain);
    if (!res) {
      setLastProbeMsg('Ingresa un dominio válido (ej: googleads.g.doubleclick.net)');
      return;
    }
    setLastProbeMsg(
      `${res.domain}: ${res.blocked ? 'Bloqueado' : 'Permitido'} · ${res.reason}`,
    );
  };

  const handleProbeSubmit = (e: FormEvent) => {
    e.preventDefault();
    runProbe(probeInput);
    setProbeInput('');
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-extrabold text-[#F1F5FF] flex items-center gap-2">
            <NavActivityIcon active className="w-5 h-5 text-[#00E5FF]" />
            <span>Tráfico en tiempo real</span>
          </h2>
          <span className="text-xs font-bold text-[#7C90B8] tabular-nums">
            {counts.total} eventos registrados
          </span>
        </div>

        {/* 3 Filter Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setFilterMode(0)}
            className={`min-h-[40px] px-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors tabular-nums whitespace-nowrap ${
              filterMode === 0
                ? 'bg-[#00E5FF] text-slate-950'
                : 'bg-[#0C1322] border border-[#213254] text-[#7C90B8] hover:text-[#F1F5FF]'
            }`}
          >
            Todos ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode(1)}
            className={`min-h-[40px] px-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors tabular-nums whitespace-nowrap ${
              filterMode === 1
                ? 'bg-[#FF4D6D] text-white'
                : 'bg-[#0C1322] border border-[#213254] text-[#7C90B8] hover:text-[#F1F5FF]'
            }`}
          >
            Bloqueados ({counts.blocked})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode(2)}
            className={`min-h-[40px] px-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors tabular-nums whitespace-nowrap ${
              filterMode === 2
                ? 'bg-[#00E68A] text-slate-950'
                : 'bg-[#0C1322] border border-[#213254] text-[#7C90B8] hover:text-[#F1F5FF]'
            }`}
          >
            Permitidos ({counts.allowed})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Search Input */}
          <div className="relative">
            <SearchGlassIcon className="w-4 h-4 text-[#7C90B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar dominio en el historial..."
              className="w-full min-h-[44px] pl-10 pr-3.5 rounded-xl bg-[#0C1322] border border-[#213254] focus:border-[#00E5FF] outline-none text-xs sm:text-sm text-[#F1F5FF] placeholder:text-[#7C90B8]"
            />
          </div>

          {/* Live Domain Probe */}
          <form onSubmit={handleProbeSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={probeInput}
              onChange={(e) => setProbeInput(e.target.value)}
              placeholder="Probar dominio (ej: unityads.unity3d.com)"
              className="flex-1 min-w-0 min-h-[44px] px-3.5 rounded-xl bg-[#0C1322] border border-[#213254] focus:border-[#00E68A] outline-none text-xs sm:text-sm text-[#F1F5FF] placeholder:text-[#7C90B8]"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-xl bg-[#18243E] hover:bg-[#213254] border border-[#213254] text-[#00E68A] text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors whitespace-nowrap"
            >
              <ProbePlayIcon className="w-4 h-4 shrink-0" />
              <span>Probar</span>
            </button>
          </form>
        </div>

        {/* Quick 1-tap test buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-[#7C90B8]">Prueba rápida:</span>
          {QUICK_TEST_DOMAINS.map((domain) => (
            <button
              key={domain}
              type="button"
              onClick={() => runProbe(domain)}
              className="min-h-[32px] px-2.5 rounded-lg bg-[#0C1322] hover:bg-[#18243E] border border-[#213254] text-[11px] font-mono text-[#00E5FF] cursor-pointer transition-colors"
            >
              {domain}
            </button>
          ))}
        </div>

        {lastProbeMsg && (
          <p className="text-xs font-medium text-[#00E5FF] bg-[#0C1322] border border-[#213254] rounded-xl px-3.5 py-2.5">
            {lastProbeMsg}
          </p>
        )}
      </section>

      {/* Traffic List */}
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#7C90B8] space-y-2">
            <p>No hay dominios que coincidan con el filtro actual.</p>
            {(searchQuery || filterMode !== 0) && (
              <button
                type="button"
                onClick={() => {
                  setFilterMode(0);
                  setSearchQuery('');
                }}
                className="min-h-[36px] px-3.5 rounded-xl bg-[#18243E] text-[#00E5FF] text-xs font-bold cursor-pointer"
              >
                Mostrar todos los eventos
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[#213254]/70">
            {filteredEntries.map((item) => (
              <li
                key={item.id}
                className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#162138]/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.blocked
                        ? 'bg-[#2C101C] text-[#FF4D6D]'
                        : 'bg-[#082B24] text-[#00E68A]'
                    }`}
                  >
                    {item.blocked ? (
                      <AdBlockEntryIcon className="w-4 h-4" />
                    ) : (
                      <AdAllowEntryIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-mono font-bold text-[#F1F5FF] truncate">
                      {item.domain}
                    </p>
                    <p className="text-[11px] text-[#7C90B8] tabular-nums">
                      <span className={item.blocked ? 'text-[#FF4D6D]' : 'text-[#00E68A]'}>
                        {item.blocked ? 'Bloqueado' : 'Permitido'}
                      </span>{' '}
                      · {item.time}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleDomainRule(item.domain, !item.blocked)}
                  className={`min-h-[38px] px-3.5 rounded-xl text-xs font-extrabold shrink-0 cursor-pointer transition-colors whitespace-nowrap ${
                    item.blocked
                      ? 'bg-[#082B24] border border-[#00E68A]/45 text-[#00E68A] hover:bg-[#0D3B32]'
                      : 'bg-[#2C101C] border border-[#FF4D6D]/45 text-[#FF4D6D] hover:bg-[#3A1424]'
                  }`}
                >
                  {item.blocked ? 'Permitir' : 'Bloquear'}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="px-4 py-3 bg-[#0C1322] border-t border-[#213254] flex items-center justify-between text-xs font-bold text-[#7C90B8] tabular-nums">
          <span className="flex items-center gap-2">
            <BlockedShieldIcon className="w-4 h-4 shrink-0" />
            <span>
              Bloqueados a mano: {manualBlockedCount} · Permitidos: {manualAllowedCount}
            </span>
          </span>
        </div>
      </section>
    </div>
  );
}

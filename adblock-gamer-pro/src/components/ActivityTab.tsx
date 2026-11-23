import { useMemo, useState, type FormEvent } from 'react';
import { Ban, CheckCircle2, Play, Search, ShieldCheck } from 'lucide-react';
import { parseDomainLines } from '../data/adblockRules';
import type { AdblockV6State } from '../hooks/useAdblockPrefs';

interface ActivityTabProps {
  state: AdblockV6State;
  onToggleDomainRule: (domain: string, block: boolean) => void;
  onInspectDomain: (rawDomain: string) => { domain: string; blocked: boolean; reason: string } | null;
}

type ActivityFilter = 0 | 1 | 2; // 0 = Todos, 1 = Bloqueados, 2 = Permitidos

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

  const handleProbeSubmit = (e: FormEvent) => {
    e.preventDefault();
    const res = onInspectDomain(probeInput);
    if (!res) {
      setLastProbeMsg('Ingresa un dominio válido (ej: googleads.g.doubleclick.net)');
      return;
    }
    setLastProbeMsg(
      `${res.domain}: ${res.blocked ? 'BLOQUEADO' : 'PERMITIDO'} · ${res.reason}`,
    );
    setProbeInput('');
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7C90B8]">
            TRÁFICO EN TIEMPO REAL
          </h2>
          <span className="text-[11px] font-bold text-[#00E5FF] tabular-nums">
            {counts.total} eventos
          </span>
        </div>

        {/* 3 Filter Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setFilterMode(0)}
            className={`min-h-[38px] px-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors tabular-nums ${
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
            className={`min-h-[38px] px-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors tabular-nums ${
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
            className={`min-h-[38px] px-2 rounded-xl text-xs font-extrabold cursor-pointer transition-colors tabular-nums ${
              filterMode === 2
                ? 'bg-[#00E68A] text-slate-950'
                : 'bg-[#0C1322] border border-[#213254] text-[#7C90B8] hover:text-[#F1F5FF]'
            }`}
          >
            Permitidos ({counts.allowed})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#7C90B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filtrar dominio en el historial..."
            className="w-full min-h-[42px] pl-10 pr-3.5 rounded-xl bg-[#0C1322] border border-[#213254] focus:border-[#00E5FF] outline-none text-xs sm:text-sm text-[#F1F5FF] placeholder:text-[#7C90B8]"
          />
        </div>

        {/* Live Domain Probe */}
        <form onSubmit={handleProbeSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={probeInput}
            onChange={(e) => setProbeInput(e.target.value)}
            placeholder="Probar consulta (ej: unityads.unity3d.com)"
            className="flex-1 min-w-0 min-h-[42px] px-3.5 rounded-xl bg-[#0C1322] border border-[#213254] focus:border-[#00E68A] outline-none text-xs text-[#F1F5FF] placeholder:text-[#7C90B8]"
          />
          <button
            type="submit"
            className="min-h-[42px] px-3.5 rounded-xl bg-[#18243E] hover:bg-[#213254] border border-[#213254] text-[#00E68A] text-xs font-extrabold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Probar</span>
          </button>
        </form>

        {lastProbeMsg && (
          <p className="text-[11px] font-medium text-[#00E5FF] bg-[#0C1322] border border-[#213254] rounded-xl px-3 py-2">
            {lastProbeMsg}
          </p>
        )}
      </section>

      {/* Traffic List */}
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] overflow-hidden">
        {filteredEntries.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#7C90B8]">
            No hay dominios que coincidan con el filtro actual.
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
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      item.blocked
                        ? 'bg-[#2C101C] text-[#FF4D6D]'
                        : 'bg-[#082B24] text-[#00E68A]'
                    }`}
                  >
                    {item.blocked ? (
                      <Ban className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
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
                  className={`min-h-[34px] px-3 rounded-xl text-[11px] font-extrabold shrink-0 cursor-pointer transition-colors ${
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

        <div className="px-4 py-3 bg-[#0C1322] border-t border-[#213254] flex items-center justify-between text-[11px] font-bold text-[#7C90B8] tabular-nums">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
            Bloqueados a mano: {manualBlockedCount} | Permitidos: {manualAllowedCount}
          </span>
        </div>
      </section>
    </div>
  );
}

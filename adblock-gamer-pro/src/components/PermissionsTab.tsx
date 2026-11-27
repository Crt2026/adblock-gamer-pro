import { useCallback, useEffect, useState } from 'react';
import { Check, CheckCircle2, ExternalLink, X } from 'lucide-react';
import type { AdblockV6State, AndroidPermissionsState } from '../hooks/useAdblockPrefs';
import { DownloadZipButton } from './DownloadZipButton';
import {
  CacheSweepIcon,
  CopyPromptIcon,
  DownloadApkIcon,
  GitCommitNodeIcon,
  GitHubBranchIcon,
  PermBatteryIcon,
  PermBellIcon,
  PermBoltIcon,
  PermVpnIcon,
  RefreshSyncIcon,
  TerminalDiagIcon,
} from './Icons';
import { PWAInstallButton } from './PWAInstallButton';

interface PermissionsTabProps {
  state: AdblockV6State;
  onTogglePermission: (key: keyof AndroidPermissionsState) => void;
  onGrantAllPermissions: () => void;
  onClearCrashLog: () => void;
  onAppendDiagnosticNote: (note: string) => void;
  onToast: (message: string) => void;
}

interface GithubCommitItem {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  htmlUrl: string;
}

interface GithubArtifactItem {
  name: string;
  sizeBytes: number;
  downloadUrl: string;
}

interface GithubSnapshot {
  fullName: string;
  htmlUrl: string;
  defaultBranch: string;
  description: string;
  pushedAt: string;
  liveSync: boolean;
  latestCommit: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
  commits: GithubCommitItem[];
  artifacts: GithubArtifactItem[];
  releaseNotesV6: string[];
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function PermissionsTab({
  state,
  onTogglePermission,
  onGrantAllPermissions,
  onClearCrashLog,
  onAppendDiagnosticNote,
  onToast,
}: PermissionsTabProps) {
  const [showLogModal, setShowLogModal] = useState(false);
  const [githubData, setGithubData] = useState<GithubSnapshot | null>(null);
  const [syncingGithub, setSyncingGithub] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const loadGithub = useCallback(async (forceRefresh = false) => {
    setSyncingGithub(true);
    try {
      const url = forceRefresh ? '/api/github/repo?refresh=1' : '/api/github/repo';
      const res = await fetch(url);
      if (res.ok) {
        const json = (await res.json()) as GithubSnapshot;
        setGithubData(json);
      }
    } catch {
      // keep existing snapshot
    } finally {
      setSyncingGithub(false);
    }
  }, []);

  useEffect(() => {
    void loadGithub(false);
  }, [loadGithub]);

  const handleTestNotification = () => {
    onAppendDiagnosticNote('Notificación de prueba enviada (canal Cyber-Reactor v6.2).');
    onToast('Notificación enviada: Túnel Cyber-Reactor activo · Bloqueo en tiempo real');
  };

  const handleClearGameCache = () => {
    onAppendDiagnosticNote('Instrucciones de limpieza de caché mostradas para juegos.');
    onToast('Ve a Ajustes > Apps > [Juego] > Almacenamiento > Borrar caché');
  };

  const handleCopyOpenCodePrompt = async () => {
    const promptText =
      'Aplica y sincroniza estos cambios reales de Adblock Gamer Pro v6.2 (Cyber-Reactor): 1) Sube la versión a v6.2 en UI, manifest y build.gradle. 2) Usa el nuevo botón central Cyber-Reactor de doble anillo contrarrotatorio y toda la suite de iconos bitono degradados. 3) Mantén Dual-Stack Wi-Fi + Datos Móviles 4G/5G (IPv4/UDP 53 + IPv6 + DoH/DoT 853) y Bloqueo Total de anuncios (juegos, apps, YouTube/video, banners, popups, Meta Ads, píxeles y telemetría) + corte de QUIC (UDP 443/8443) y DoT (TCP 853). 4) Mantén los 12 proveedores DNS con Control D + OISD por defecto, reglas manuales/excepciones y lista HaGeZi Pro + StevenBlack (+204.312 dominios). Revisa OPENCODE_CAMBIOS_V6_2.md dentro de este ZIP.';
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      onToast('Prompt para OpenCode copiado al portapapeles');
      setTimeout(() => setCopiedPrompt(false), 2400);
    } catch {
      onToast('Revisa el archivo OPENCODE_CAMBIOS_V6_2.md incluido en el ZIP');
    }
  };

  const permissionRows: Array<{
    key: keyof AndroidPermissionsState;
    title: string;
    okText: string;
    warnText: string;
    Icon: typeof PermVpnIcon;
  }> = [
    {
      key: 'vpn',
      title: 'Servicio VPN (tun0)',
      okText: 'Activo',
      warnText: 'Sin permiso',
      Icon: PermVpnIcon,
    },
    {
      key: 'notifications',
      title: 'Notificaciones',
      okText: 'Concedido',
      warnText: 'Desactivado',
      Icon: PermBellIcon,
    },
    {
      key: 'batteryUnrestricted',
      title: 'Batería sin restricciones',
      okText: 'Sin restricciones',
      warnText: 'Recomendado activar',
      Icon: PermBatteryIcon,
    },
    {
      key: 'autoStart',
      title: 'Arranque automático',
      okText: 'Habilitado',
      warnText: 'Manual',
      Icon: PermBoltIcon,
    },
  ];

  const grantedCount = Object.values(state.permissions).filter(Boolean).length;
  const readinessPct = Math.round((grantedCount / 4) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
      {/* Left Column: Android System Permissions + Maintenance */}
      <div className="lg:col-span-6 space-y-4">
        <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 sm:p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-[#F1F5FF] flex items-center gap-2">
                <PermVpnIcon className="w-4 h-4 text-[#00E68A]" />
                <span>Permisos del sistema Android</span>
              </h2>
              <p className="text-xs text-[#7C90B8] mt-1">
                Mantén el servicio anti-desconexión activo en primer plano y tras reiniciar.
              </p>
            </div>
            <span
              className={`text-xs font-extrabold tabular-nums shrink-0 ${
                grantedCount === 4 ? 'text-[#00E68A]' : 'text-[#FFC247]'
              }`}
            >
              {grantedCount}/4 listos
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-[#0C1322] overflow-hidden border border-[#213254]">
            <div
              className={`h-full transition-all duration-300 ${
                grantedCount === 4 ? 'bg-[#00E68A]' : 'bg-[#FFC247]'
              }`}
              style={{ width: `${readinessPct}%` }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onGrantAllPermissions();
                onToast('Todos los permisos recomendados activados');
              }}
              className="min-h-[44px] px-4 rounded-xl bg-[#00E68A] hover:bg-[#1ef29d] text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Conceder permisos</span>
            </button>

            <button
              type="button"
              onClick={handleTestNotification}
              className="min-h-[44px] px-4 rounded-xl bg-[#18243E] hover:bg-[#213254] border border-[#213254] text-[#00E5FF] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors whitespace-nowrap"
            >
              <PermBellIcon className="w-4 h-4 shrink-0" />
              <span>Notificación de prueba</span>
            </button>
          </div>
        </section>

        {/* Estado detallado */}
        <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 sm:p-5 space-y-2">
          <h2 className="text-sm font-extrabold text-[#F1F5FF]">Estado detallado</h2>

          <div className="divide-y divide-[#213254]/70">
            {permissionRows.map(({ key, title, okText, warnText, Icon }) => {
              const granted = state.permissions[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onTogglePermission(key)}
                  className="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#162138]/40 px-1.5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        granted
                          ? 'bg-[#082B24] text-[#00E68A]'
                          : 'bg-[#271E0B] text-[#FFC247]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#F1F5FF] truncate">{title}</p>
                      <p
                        className={`text-[11px] font-bold ${
                          granted ? 'text-[#00E68A]' : 'text-[#FFC247]'
                        }`}
                      >
                        {granted ? okText : warnText}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-extrabold shrink-0 ${
                      granted ? 'text-[#00E68A]' : 'text-[#FFC247]'
                    }`}
                  >
                    {granted ? 'OK' : 'Activar'}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Caché de anuncios + Diagnóstico */}
        <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 sm:p-5 space-y-2.5">
          <button
            type="button"
            onClick={handleClearGameCache}
            className="w-full min-h-[44px] px-4 rounded-xl bg-[#18243E] hover:bg-[#213254] border border-[#213254] text-[#F1F5FF] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <CacheSweepIcon className="w-4 h-4 text-[#FFC247] shrink-0" />
            <span>Limpiar caché de anuncios en juegos</span>
          </button>

          <button
            type="button"
            onClick={() => setShowLogModal(true)}
            className="w-full min-h-[44px] px-4 rounded-xl bg-[#0C1322] hover:bg-[#162138] border border-[#213254] text-[#7C90B8] hover:text-[#F1F5FF] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <TerminalDiagIcon className="w-4 h-4 shrink-0" />
            <span>Registro de errores (diagnóstico)</span>
          </button>
        </section>
      </div>

      {/* Right Column: Live GitHub Sync, APK Downloads & WinRAR Package */}
      <section className="lg:col-span-6 rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <GitHubBranchIcon className="w-5 h-5 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-[#F1F5FF] truncate">
                {githubData?.fullName ?? 'Crt2026/adblock-gamer-pro'}
              </h2>
              <p className="text-xs text-[#7C90B8]">
                Rama {githubData?.defaultBranch ?? 'master'} ·{' '}
                {githubData?.liveSync ? 'Sincronizado en vivo' : 'Caché local'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadGithub(true)}
            disabled={syncingGithub}
            className="min-h-[36px] px-3 rounded-xl bg-[#0C1322] hover:bg-[#162138] border border-[#213254] text-[#00E5FF] text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors whitespace-nowrap"
          >
            <RefreshSyncIcon className={`w-3.5 h-3.5 ${syncingGithub ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>

        {/* APK & Patch downloads from repo */}
        {githubData && githubData.artifacts.length > 0 && (
          <div className="space-y-2">
            {githubData.artifacts.map((art) => (
              <a
                key={art.name}
                href={art.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0C1322] hover:bg-[#162138] border border-[#213254] flex items-center justify-between gap-2 transition-colors"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <DownloadApkIcon className="w-4 h-4 text-[#00E68A] shrink-0" />
                  <span className="text-xs font-mono font-bold text-[#F1F5FF] truncate">
                    {art.name}
                  </span>
                </span>
                <span className="text-[11px] font-bold text-[#00E5FF] shrink-0 tabular-nums">
                  {formatBytes(art.sizeBytes)}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Latest commits */}
        {githubData && githubData.commits.length > 0 && (
          <div className="rounded-xl bg-[#0C1322] border border-[#213254] p-3.5 space-y-2">
            <p className="text-xs font-bold text-[#7C90B8]">Últimos commits</p>
            <ul className="space-y-1.5">
              {githubData.commits.slice(0, 3).map((commit) => (
                <li key={commit.sha} className="flex items-start gap-2 text-xs">
                  <GitCommitNodeIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-mono text-[#00E68A] shrink-0 tabular-nums">
                    {commit.shortSha}
                  </span>
                  <span className="text-[#F1F5FF] truncate">{commit.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* WinRAR ZIP Export, Web App Install & OpenCode Prompt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <DownloadZipButton variant="full" />
          <PWAInstallButton variant="full" />
        </div>

        <button
          type="button"
          onClick={() => void handleCopyOpenCodePrompt()}
          className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#18243E] hover:bg-[#213254] border border-[#00E5FF]/35 text-[#00E5FF] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          {copiedPrompt ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <CopyPromptIcon className="w-4 h-4 shrink-0" />
          )}
          <span>
            {copiedPrompt
              ? 'Prompt para OpenCode copiado'
              : 'Copiar instrucciones v6.2 para OpenCode'}
          </span>
        </button>

        <a
          href={githubData?.htmlUrl ?? 'https://github.com/Crt2026/adblock-gamer-pro'}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[42px] px-3 rounded-xl bg-[#0C1322] hover:bg-[#162138] border border-[#213254] text-[#7C90B8] hover:text-[#F1F5FF] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
        >
          <span>Abrir repositorio en GitHub</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </section>

      {/* Diagnostic Log Modal */}
      {showLogModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowLogModal(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#111A2D] border border-[#213254] p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TerminalDiagIcon className="w-5 h-5" />
                <h3 className="text-sm font-extrabold text-[#F1F5FF]">
                  Diagnóstico interno (v6.2)
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar diagnóstico"
                onClick={() => setShowLogModal(false)}
                className="w-9 h-9 rounded-full bg-[#18243E] hover:bg-[#213254] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-[#F1F5FF]" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto rounded-xl bg-[#080D17] border border-[#213254] p-3 space-y-1.5 font-mono text-[11px] text-slate-300">
              {state.crashLog.map((line, i) => (
                <p key={`${i}-${line.slice(0, 12)}`} className="leading-relaxed">
                  {line}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onClearCrashLog}
                className="min-h-[42px] rounded-xl bg-[#18243E] hover:bg-[#213254] border border-[#213254] text-xs font-extrabold text-[#F1F5FF] cursor-pointer"
              >
                Limpiar registro
              </button>
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="min-h-[42px] rounded-xl bg-[#00E5FF] hover:bg-[#38ebff] text-slate-950 text-xs font-extrabold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

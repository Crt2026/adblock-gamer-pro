import { useCallback, useEffect, useState } from 'react';
import {
  BatteryCharging,
  Bell,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  GitBranch,
  GitCommit,
  RefreshCw,
  Shield,
  Terminal,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import type { AdblockV6State, AndroidPermissionsState } from '../hooks/useAdblockPrefs';
import { DownloadZipButton } from './DownloadZipButton';
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
    onAppendDiagnosticNote('Notificación de prueba enviada (canal Cyber-Reactor v6.1).');
    onToast('Notificación enviada: Túnel Cyber-Reactor activo · Bloqueo en tiempo real');
  };

  const handleClearGameCache = () => {
    onAppendDiagnosticNote('Instrucciones de limpieza de caché mostradas para juegos.');
    onToast('Ve a Ajustes > Apps > [Juego] > Almacenamiento > Borrar caché');
  };

  const handleCopyOpenCodePrompt = async () => {
    const promptText =
      'Aplica y sincroniza estos cambios reales de Adblock Gamer Pro v6.1 (Cyber-Reactor): 1) Sube la versión a v6.1 en UI, manifest y build.gradle. 2) Activa modo Dual-Stack Wi-Fi + Datos Móviles 4G/5G (IPv4/UDP 53 + IPv6 + DoH/DoT 853) con conmutador en Protección y Filtros. 3) Activa Bloqueo Total de anuncios (juegos, apps, YouTube/video, banners, popups, Meta Ads, píxeles y telemetría) + corte de QUIC (UDP 443/8443) y DoT (TCP 853). 4) Mantén los 12 proveedores DNS con Control D + OISD por defecto, reglas manuales/excepciones y lista HaGeZi Pro + StevenBlack (+204.312 dominios). Revisa OPENCODE_CAMBIOS_V6_1.md dentro de este ZIP.';
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPrompt(true);
      onToast('Prompt para OpenCode copiado al portapapeles');
      setTimeout(() => setCopiedPrompt(false), 2400);
    } catch {
      onToast('Revisa el archivo OPENCODE_CAMBIOS_V6_1.md incluido en el ZIP');
    }
  };

  const permissionRows: Array<{
    key: keyof AndroidPermissionsState;
    title: string;
    okText: string;
    warnText: string;
    Icon: typeof Shield;
  }> = [
    {
      key: 'vpn',
      title: 'Servicio VPN (tun0)',
      okText: 'Activo',
      warnText: 'Sin permiso',
      Icon: Shield,
    },
    {
      key: 'notifications',
      title: 'Notificaciones',
      okText: 'Concedido',
      warnText: 'Desactivado',
      Icon: Bell,
    },
    {
      key: 'batteryUnrestricted',
      title: 'Batería sin restricciones',
      okText: 'Sin restricciones',
      warnText: 'Recomendado activar',
      Icon: BatteryCharging,
    },
    {
      key: 'autoStart',
      title: 'Arranque automático',
      okText: 'Habilitado',
      warnText: 'Manual',
      Icon: Zap,
    },
  ];

  return (
    <div className="space-y-4">
      {/* PERMISOS DEL SISTEMA ANDROID */}
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 space-y-3">
        <div>
          <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7C90B8]">
            PERMISOS DEL SISTEMA ANDROID
          </h2>
          <p className="text-[11px] text-[#7C90B8] mt-1">
            Mantén el servicio anti-desconexión activo en primer plano y tras reiniciar.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              onGrantAllPermissions();
              onToast('Todos los permisos recomendados activados');
            }}
            className="min-h-[44px] px-4 rounded-xl bg-[#00E68A] hover:bg-[#1ef29d] text-slate-950 text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Conceder permisos pendientes</span>
          </button>

          <button
            type="button"
            onClick={handleTestNotification}
            className="min-h-[44px] px-4 rounded-xl bg-[#18243E] hover:bg-[#213254] border border-[#213254] text-[#00E5FF] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Enviar notificación de prueba</span>
          </button>
        </div>
      </section>

      {/* ESTADO DETALLADO */}
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 space-y-2">
        <h2 className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7C90B8]">
          ESTADO DETALLADO
        </h2>

        <div className="divide-y divide-[#213254]/70">
          {permissionRows.map(({ key, title, okText, warnText, Icon }) => {
            const granted = state.permissions[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => onTogglePermission(key)}
                className="w-full py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-[#162138]/40 px-1 rounded-lg transition-colors"
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
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                    granted
                      ? 'bg-[#082B24] border border-[#00E68A]/40 text-[#00E68A]'
                      : 'bg-[#271E0B] border border-[#FFC247]/40 text-[#FFC247]'
                  }`}
                >
                  {granted ? 'OK' : 'Activar'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* CACHÉ DE ANUNCIOS + DIAGNÓSTICO */}
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 space-y-2.5">
        <button
          type="button"
          onClick={handleClearGameCache}
          className="w-full min-h-[44px] px-4 rounded-xl bg-[#18243E] hover:bg-[#213254] border border-[#213254] text-[#F1F5FF] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Trash2 className="w-4 h-4 text-[#FFC247]" />
          <span>LIMPIAR CACHÉ DE ANUNCIOS EN JUEGOS</span>
        </button>

        <button
          type="button"
          onClick={() => setShowLogModal(true)}
          className="w-full min-h-[42px] px-4 rounded-xl bg-[#0C1322] hover:bg-[#162138] border border-[#213254] text-[#7C90B8] hover:text-[#F1F5FF] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          <Terminal className="w-4 h-4 text-[#00E5FF]" />
          <span>Registro de errores (diagnóstico)</span>
        </button>
      </section>

      {/* REPOSITORIO GITHUB EN VIVO + INSTALACIÓN */}
      <section className="rounded-[20px] bg-[#111A2D] border border-[#213254] p-4 space-y-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <GitBranch className="w-4 h-4 text-[#00E68A] shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#F1F5FF] truncate">
                GitHub: {githubData?.fullName ?? 'Crt2026/adblock-gamer-pro'}
              </h2>
              <p className="text-[11px] text-[#7C90B8]">
                Rama {githubData?.defaultBranch ?? 'master'} ·{' '}
                {githubData?.liveSync ? 'Sincronizado en vivo' : 'Caché local'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadGithub(true)}
            disabled={syncingGithub}
            className="min-h-[34px] px-2.5 rounded-xl bg-[#0C1322] hover:bg-[#162138] border border-[#213254] text-[#00E5FF] text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingGithub ? 'animate-spin' : ''}`} />
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
                className="w-full min-h-[42px] px-3.5 py-2 rounded-xl bg-[#0C1322] hover:bg-[#162138] border border-[#213254] flex items-center justify-between gap-2 transition-colors"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Download className="w-4 h-4 text-[#00E68A] shrink-0" />
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
          <div className="rounded-xl bg-[#0C1322] border border-[#213254] p-3 space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#7C90B8]">
              Últimos commits
            </p>
            <ul className="space-y-1.5">
              {githubData.commits.slice(0, 3).map((commit) => (
                <li key={commit.sha} className="flex items-start gap-2 text-[11px]">
                  <GitCommit className="w-3.5 h-3.5 text-[#00E5FF] shrink-0 mt-0.5" />
                  <span className="font-mono text-[#00E68A] shrink-0 tabular-nums">
                    {commit.shortSha}
                  </span>
                  <span className="text-[#F1F5FF] truncate">{commit.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Web Install, WinRAR ZIP Export & OpenCode Prompt */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <DownloadZipButton variant="full" />
          <PWAInstallButton variant="full" />
        </div>

        <button
          type="button"
          onClick={() => void handleCopyOpenCodePrompt()}
          className="w-full min-h-[42px] px-3.5 rounded-xl bg-[#18243E] hover:bg-[#213254] border border-[#00E5FF]/35 text-[#00E5FF] text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          {copiedPrompt ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
          <span>
            {copiedPrompt
              ? '¡Prompt para OpenCode copiado!'
              : 'Copiar instrucciones v6.1 para OpenCode'}
          </span>
        </button>

        <a
          href={githubData?.htmlUrl ?? 'https://github.com/Crt2026/adblock-gamer-pro'}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full min-h-[40px] px-3 rounded-xl bg-[#0C1322] hover:bg-[#162138] border border-[#213254] text-[#7C90B8] hover:text-[#F1F5FF] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
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
                <Terminal className="w-5 h-5 text-[#00E5FF]" />
                <h3 className="text-sm font-extrabold text-[#F1F5FF]">
                  Diagnóstico interno (v6.1)
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

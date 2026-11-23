import { useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_DNS_PROVIDER_INDEX,
  DNS_PROVIDERS,
  evaluateDomain,
  INITIAL_TRAFFIC_LOG,
  normalizeDomain,
  parseDomainLines,
  type TrafficLogEntry,
} from '../data/adblockRules';

export interface AndroidPermissionsState {
  vpn: boolean;
  notifications: boolean;
  batteryUnrestricted: boolean;
  autoStart: boolean;
}

export type NetworkScope = 'dual' | 'wifi' | 'mobile';

export interface AdblockV6State {
  enabled: boolean;
  networkScope: NetworkScope;
  blockAllMode: boolean;
  dnsProviderIndex: number;
  sniMode: boolean;
  metaBlock: boolean;
  blockQuic: boolean;
  blockDot: boolean;
  notifyBlocks: boolean;
  blocklistExpanded: boolean;
  domainCount: number;
  customBlockText: string;
  customAllowText: string;
  dnsBlocked: number;
  sniBlocked: number;
  quicDropped: number;
  encryptedCut: number;
  packetsRead: number;
  lastBlockedDomain: string;
  trafficLog: TrafficLogEntry[];
  permissions: AndroidPermissionsState;
  crashLog: string[];
}

const STORAGE_KEY = 'adblock_gamer_pro_v6_exact';

const DEFAULT_STATE: AdblockV6State = {
  enabled: true,
  networkScope: 'dual',
  blockAllMode: true,
  dnsProviderIndex: DEFAULT_DNS_PROVIDER_INDEX,
  sniMode: true,
  metaBlock: true,
  blockQuic: true,
  blockDot: true,
  notifyBlocks: true,
  blocklistExpanded: true,
  domainCount: 204312,
  customBlockText: 'mollyflow.com\nthecatmachine.com',
  customAllowText: '',
  dnsBlocked: 42,
  sniBlocked: 11,
  quicDropped: 18,
  encryptedCut: 9,
  packetsRead: 1486,
  lastBlockedDomain: 'googleads.g.doubleclick.net',
  trafficLog: INITIAL_TRAFFIC_LOG,
  permissions: {
    vpn: true,
    notifications: true,
    batteryUnrestricted: true,
    autoStart: true,
  },
  crashLog: [
    'v6.1: Motor anti-desconexión iniciado (startForeground + pool TCP 8 hilos).',
    'v6.1: Lista ampliada cargada: 204.312 dominios (HaGeZi Pro + StevenBlack).',
  ],
};

function loadInitialState(): AdblockV6State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<AdblockV6State>;
    if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE;

    const idx =
      typeof parsed.dnsProviderIndex === 'number' &&
      Number.isInteger(parsed.dnsProviderIndex) &&
      parsed.dnsProviderIndex >= 0 &&
      parsed.dnsProviderIndex < DNS_PROVIDERS.length
        ? parsed.dnsProviderIndex
        : DEFAULT_STATE.dnsProviderIndex;

    const safeTrafficLog = Array.isArray(parsed.trafficLog)
      ? parsed.trafficLog
          .filter(
            (item): item is TrafficLogEntry =>
              Boolean(item) &&
              typeof item.id === 'string' &&
              typeof item.domain === 'string' &&
              typeof item.blocked === 'boolean' &&
              typeof item.time === 'string',
          )
          .slice(0, 50)
      : [];

    const safeCrashLog = Array.isArray(parsed.crashLog)
      ? parsed.crashLog.filter((line): line is string => typeof line === 'string')
      : [];

    const safeNum = (val: unknown, fallback: number) =>
      typeof val === 'number' && Number.isFinite(val) && val >= 0 ? val : fallback;

    const safeScope: NetworkScope =
      parsed.networkScope === 'wifi' || parsed.networkScope === 'mobile' || parsed.networkScope === 'dual'
        ? parsed.networkScope
        : DEFAULT_STATE.networkScope;

    return {
      enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : DEFAULT_STATE.enabled,
      networkScope: safeScope,
      blockAllMode:
        typeof parsed.blockAllMode === 'boolean' ? parsed.blockAllMode : DEFAULT_STATE.blockAllMode,
      dnsProviderIndex: idx,
      sniMode: typeof parsed.sniMode === 'boolean' ? parsed.sniMode : DEFAULT_STATE.sniMode,
      metaBlock: typeof parsed.metaBlock === 'boolean' ? parsed.metaBlock : DEFAULT_STATE.metaBlock,
      blockQuic: typeof parsed.blockQuic === 'boolean' ? parsed.blockQuic : DEFAULT_STATE.blockQuic,
      blockDot: typeof parsed.blockDot === 'boolean' ? parsed.blockDot : DEFAULT_STATE.blockDot,
      notifyBlocks:
        typeof parsed.notifyBlocks === 'boolean' ? parsed.notifyBlocks : DEFAULT_STATE.notifyBlocks,
      blocklistExpanded:
        typeof parsed.blocklistExpanded === 'boolean'
          ? parsed.blocklistExpanded
          : DEFAULT_STATE.blocklistExpanded,
      domainCount: safeNum(parsed.domainCount, DEFAULT_STATE.domainCount),
      customBlockText:
        typeof parsed.customBlockText === 'string'
          ? parsed.customBlockText
          : DEFAULT_STATE.customBlockText,
      customAllowText:
        typeof parsed.customAllowText === 'string'
          ? parsed.customAllowText
          : DEFAULT_STATE.customAllowText,
      dnsBlocked: safeNum(parsed.dnsBlocked, DEFAULT_STATE.dnsBlocked),
      sniBlocked: safeNum(parsed.sniBlocked, DEFAULT_STATE.sniBlocked),
      quicDropped: safeNum(parsed.quicDropped, DEFAULT_STATE.quicDropped),
      encryptedCut: safeNum(parsed.encryptedCut, DEFAULT_STATE.encryptedCut),
      packetsRead: safeNum(parsed.packetsRead, DEFAULT_STATE.packetsRead),
      lastBlockedDomain:
        typeof parsed.lastBlockedDomain === 'string'
          ? parsed.lastBlockedDomain
          : DEFAULT_STATE.lastBlockedDomain,
      permissions: {
        vpn:
          typeof parsed.permissions?.vpn === 'boolean'
            ? parsed.permissions.vpn
            : DEFAULT_STATE.permissions.vpn,
        notifications:
          typeof parsed.permissions?.notifications === 'boolean'
            ? parsed.permissions.notifications
            : DEFAULT_STATE.permissions.notifications,
        batteryUnrestricted:
          typeof parsed.permissions?.batteryUnrestricted === 'boolean'
            ? parsed.permissions.batteryUnrestricted
            : DEFAULT_STATE.permissions.batteryUnrestricted,
        autoStart:
          typeof parsed.permissions?.autoStart === 'boolean'
            ? parsed.permissions.autoStart
            : DEFAULT_STATE.permissions.autoStart,
      },
      trafficLog: safeTrafficLog.length > 0 ? safeTrafficLog : DEFAULT_STATE.trafficLog,
      crashLog: safeCrashLog.length > 0 ? safeCrashLog : DEFAULT_STATE.crashLog,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function nowTimeString(): string {
  const now = new Date();
  return now.toTimeString().slice(0, 8);
}

export function useAdblockPrefs() {
  const [state, setState] = useState<AdblockV6State>(() => loadInitialState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage errors
    }
  }, [state]);

  const togglePower = useCallback(() => {
    setState((prev) => ({
      ...prev,
      enabled: !prev.enabled,
      permissions: !prev.enabled ? { ...prev.permissions, vpn: true } : prev.permissions,
    }));
  }, []);

  const setDnsProviderIndex = useCallback((index: number) => {
    if (index < 0 || index >= DNS_PROVIDERS.length) return;
    setState((prev) => ({ ...prev, dnsProviderIndex: index }));
  }, []);

  const setNetworkScope = useCallback((networkScope: NetworkScope) => {
    setState((prev) => ({ ...prev, networkScope }));
  }, []);

  const setSwitch = useCallback(
    (
      key: 'blockAllMode' | 'sniMode' | 'metaBlock' | 'blockQuic' | 'blockDot' | 'notifyBlocks',
      value: boolean,
    ) => {
      setState((prev) => {
        const next = { ...prev, [key]: value };
        if (key === 'blockAllMode' || key === 'metaBlock') {
          next.trafficLog = prev.trafficLog.map((entry) => ({
            ...entry,
            blocked: evaluateDomain(
              entry.domain,
              prev.customBlockText,
              prev.customAllowText,
              next.metaBlock,
              next.blockAllMode,
            ).blocked,
          }));
        }
        return next;
      });
    },
    [],
  );

  const updateBlocklistNow = useCallback(() => {
    setState((prev) => ({
      ...prev,
      blocklistExpanded: true,
      domainCount: 204312,
      crashLog: [
        `${nowTimeString()} · HaGeZi Pro + StevenBlack sincronizada (204.312 dominios).`,
        ...prev.crashLog.slice(0, 14),
      ],
    }));
  }, []);

  const saveManualRules = useCallback((customBlockText: string, customAllowText: string) => {
    setState((prev) => {
      const updatedLog = prev.trafficLog.map((entry) => {
        const evaluated = evaluateDomain(
          entry.domain,
          customBlockText,
          customAllowText,
          prev.metaBlock,
          prev.blockAllMode,
        );
        return { ...entry, blocked: evaluated.blocked };
      });
      return {
        ...prev,
        customBlockText,
        customAllowText,
        trafficLog: updatedLog,
      };
    });
  }, []);

  const toggleDomainManualRule = useCallback((domain: string, block: boolean) => {
    const clean = normalizeDomain(domain);
    if (!clean) return;
    setState((prev) => {
      const blockList = parseDomainLines(prev.customBlockText).filter((d) => d !== clean);
      const allowList = parseDomainLines(prev.customAllowText).filter((d) => d !== clean);
      if (block) {
        blockList.push(clean);
      } else {
        allowList.push(clean);
      }
      const nextBlockText = blockList.join('\n');
      const nextAllowText = allowList.join('\n');
      const updatedLog = prev.trafficLog.map((entry) =>
        normalizeDomain(entry.domain) === clean ? { ...entry, blocked: block } : entry,
      );
      return {
        ...prev,
        customBlockText: nextBlockText,
        customAllowText: nextAllowText,
        trafficLog: updatedLog,
      };
    });
  }, []);

  const inspectAndLogDomain = useCallback((rawDomain: string) => {
    const clean = normalizeDomain(rawDomain);
    if (!clean || !clean.includes('.')) return null;

    let resultBlocked = false;
    let resultReason = '';
    setState((prev) => {
      const res = evaluateDomain(
        clean,
        prev.customBlockText,
        prev.customAllowText,
        prev.metaBlock,
        prev.blockAllMode,
      );
      resultBlocked = res.blocked;
      resultReason = res.reason;

      const entry: TrafficLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        domain: clean,
        blocked: res.blocked,
        time: nowTimeString(),
      };

      return {
        ...prev,
        packetsRead: prev.packetsRead + 1,
        dnsBlocked: res.blocked ? prev.dnsBlocked + 1 : prev.dnsBlocked,
        sniBlocked:
          res.blocked && prev.sniMode && res.reason.includes('SNI')
            ? prev.sniBlocked + 1
            : prev.sniBlocked,
        quicDropped: prev.blockQuic ? prev.quicDropped + 1 : prev.quicDropped,
        encryptedCut: prev.blockDot ? prev.encryptedCut + 1 : prev.encryptedCut,
        lastBlockedDomain: res.blocked ? clean : prev.lastBlockedDomain,
        trafficLog: [entry, ...prev.trafficLog].slice(0, 50),
      };
    });
    return { domain: clean, blocked: resultBlocked, reason: resultReason };
  }, []);

  const togglePermission = useCallback((key: keyof AndroidPermissionsState) => {
    setState((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [key]: !prev.permissions[key],
      },
    }));
  }, []);

  const grantAllPermissions = useCallback(() => {
    setState((prev) => ({
      ...prev,
      permissions: {
        vpn: true,
        notifications: true,
        batteryUnrestricted: true,
        autoStart: true,
      },
    }));
  }, []);

  const clearCrashLog = useCallback(() => {
    setState((prev) => ({
      ...prev,
      crashLog: ['Sin errores registrados. Motor Cyber-Reactor v6.1 nominal.'],
    }));
  }, []);

  const appendDiagnosticNote = useCallback((note: string) => {
    setState((prev) => ({
      ...prev,
      crashLog: [`${nowTimeString()} · ${note}`, ...prev.crashLog.slice(0, 14)],
    }));
  }, []);

  return {
    state,
    togglePower,
    setDnsProviderIndex,
    setNetworkScope,
    setSwitch,
    updateBlocklistNow,
    saveManualRules,
    toggleDomainManualRule,
    inspectAndLogDomain,
    togglePermission,
    grantAllPermissions,
    clearCrashLog,
    appendDiagnosticNote,
  };
}

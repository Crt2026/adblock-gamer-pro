import { useCallback, useEffect, useState } from 'react';

export type NetworkMode = 'dual' | 'wifi' | 'mobile';

export interface AdblockPrefsState {
  isVpnEnabled: boolean;
  dnsPreset: string;
  customDnsIp: string;
  gamerModeEnabled: boolean;
  blockedCount: number;
  isProPurchased: boolean;
  isBatteryOptimizationIgnored: boolean;
  networkMode: NetworkMode;
  ipv6Protection: boolean;
  dohEnabled: boolean;
  antiSponsoredFeed: boolean;
}

const STORAGE_KEY = 'adblock_gamer_prefs_v2';

const DEFAULT_PREFS: AdblockPrefsState = {
  isVpnEnabled: true,
  dnsPreset: 'adguard',
  customDnsIp: '',
  gamerModeEnabled: false,
  blockedCount: 14,
  isProPurchased: false,
  isBatteryOptimizationIgnored: true,
  networkMode: 'dual',
  ipv6Protection: true,
  dohEnabled: true,
  antiSponsoredFeed: true,
};

function loadInitialPrefs(): AdblockPrefsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('adblock_gamer_prefs_v1');
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<AdblockPrefsState>;
    return {
      isVpnEnabled: typeof parsed.isVpnEnabled === 'boolean' ? parsed.isVpnEnabled : DEFAULT_PREFS.isVpnEnabled,
      dnsPreset: typeof parsed.dnsPreset === 'string' ? parsed.dnsPreset : DEFAULT_PREFS.dnsPreset,
      customDnsIp: typeof parsed.customDnsIp === 'string' ? parsed.customDnsIp : DEFAULT_PREFS.customDnsIp,
      gamerModeEnabled: Boolean(parsed.gamerModeEnabled ?? DEFAULT_PREFS.gamerModeEnabled),
      blockedCount: typeof parsed.blockedCount === 'number' ? parsed.blockedCount : DEFAULT_PREFS.blockedCount,
      isProPurchased: Boolean(parsed.isProPurchased ?? DEFAULT_PREFS.isProPurchased),
      isBatteryOptimizationIgnored:
        typeof parsed.isBatteryOptimizationIgnored === 'boolean'
          ? parsed.isBatteryOptimizationIgnored
          : DEFAULT_PREFS.isBatteryOptimizationIgnored,
      networkMode:
        parsed.networkMode === 'wifi' || parsed.networkMode === 'mobile' || parsed.networkMode === 'dual'
          ? parsed.networkMode
          : DEFAULT_PREFS.networkMode,
      ipv6Protection: typeof parsed.ipv6Protection === 'boolean' ? parsed.ipv6Protection : DEFAULT_PREFS.ipv6Protection,
      dohEnabled: typeof parsed.dohEnabled === 'boolean' ? parsed.dohEnabled : DEFAULT_PREFS.dohEnabled,
      antiSponsoredFeed:
        typeof parsed.antiSponsoredFeed === 'boolean' ? parsed.antiSponsoredFeed : DEFAULT_PREFS.antiSponsoredFeed,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function useAdblockPrefs() {
  const [prefs, setPrefs] = useState<AdblockPrefsState>(() => loadInitialPrefs());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore storage errors
    }
  }, [prefs]);

  const toggleVpn = useCallback(() => {
    setPrefs((prev) => ({ ...prev, isVpnEnabled: !prev.isVpnEnabled }));
  }, []);

  const setVpnEnabled = useCallback((isVpnEnabled: boolean) => {
    setPrefs((prev) => ({ ...prev, isVpnEnabled }));
  }, []);

  const setDnsPreset = useCallback((dnsPreset: string) => {
    setPrefs((prev) => ({ ...prev, dnsPreset }));
  }, []);

  const setCustomDnsIp = useCallback((customDnsIp: string) => {
    setPrefs((prev) => ({ ...prev, customDnsIp }));
  }, []);

  const setGamerModeEnabled = useCallback((gamerModeEnabled: boolean) => {
    setPrefs((prev) => ({ ...prev, gamerModeEnabled }));
  }, []);

  const incrementBlockedCount = useCallback((amount = 1) => {
    setPrefs((prev) => ({ ...prev, blockedCount: prev.blockedCount + amount }));
  }, []);

  const setProPurchased = useCallback((isProPurchased: boolean) => {
    setPrefs((prev) => ({ ...prev, isProPurchased }));
  }, []);

  const setBatteryOptimizationIgnored = useCallback((isBatteryOptimizationIgnored: boolean) => {
    setPrefs((prev) => ({ ...prev, isBatteryOptimizationIgnored }));
  }, []);

  const setNetworkMode = useCallback((networkMode: NetworkMode) => {
    setPrefs((prev) => ({ ...prev, networkMode }));
  }, []);

  const setIpv6Protection = useCallback((ipv6Protection: boolean) => {
    setPrefs((prev) => ({ ...prev, ipv6Protection }));
  }, []);

  const setDohEnabled = useCallback((dohEnabled: boolean) => {
    setPrefs((prev) => ({ ...prev, dohEnabled }));
  }, []);

  const setAntiSponsoredFeed = useCallback((antiSponsoredFeed: boolean) => {
    setPrefs((prev) => ({ ...prev, antiSponsoredFeed }));
  }, []);

  return {
    prefs,
    toggleVpn,
    setVpnEnabled,
    setDnsPreset,
    setCustomDnsIp,
    setGamerModeEnabled,
    incrementBlockedCount,
    setProPurchased,
    setBatteryOptimizationIgnored,
    setNetworkMode,
    setIpv6Protection,
    setDohEnabled,
    setAntiSponsoredFeed,
  };
}

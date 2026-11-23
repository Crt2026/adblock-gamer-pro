/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { AdvancedScreen } from './components/AdvancedScreen';
import { BottomNav, DesktopSidebar, type AppTab } from './components/BottomNav';
import { BrowserScreen } from './components/BrowserScreen';
import { GooglePlayBillingDialog } from './components/GooglePlayBillingDialog';
import { HomeScreen } from './components/HomeScreen';
import { OfflineIndicator } from './components/PWAInstallButton';
import { SettingsScreen } from './components/SettingsScreen';
import { useAdblockPrefs } from './hooks/useAdblockPrefs';
import { useGoogleAccount } from './hooks/useGoogleAccount';

export default function App() {
  const [selectedTab, setSelectedTab] = useState<AppTab>('HOME');
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const googleAccount = useGoogleAccount();

  const {
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
  } = useAdblockPrefs();

  const handleRestartVpn = () => {
    setVpnEnabled(false);
    setTimeout(() => setVpnEnabled(true), 120);
  };

  return (
    <div className="min-h-screen bg-[#090B10] text-slate-100 flex flex-col md:flex-row">
      <DesktopSidebar
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        isVpnRunning={prefs.isVpnEnabled}
        isProPurchased={prefs.isProPurchased}
      />

      <main
        className={`flex-1 min-w-0 overflow-y-auto ${
          selectedTab === 'BROWSER' ? 'pb-16 md:pb-0' : 'pb-20 md:pb-8'
        }`}
      >
        {selectedTab === 'HOME' && (
          <HomeScreen
            isVpnRunning={prefs.isVpnEnabled}
            onToggleVpn={toggleVpn}
            blockedCount={prefs.blockedCount}
            onIncrementBlocked={incrementBlockedCount}
            gamerMode={prefs.gamerModeEnabled}
            onToggleGamerMode={(enabled) => {
              setGamerModeEnabled(enabled);
              if (prefs.isVpnEnabled) handleRestartVpn();
            }}
            dnsPreset={prefs.dnsPreset}
            customDnsIp={prefs.customDnsIp}
            networkMode={prefs.networkMode}
            onChangeNetworkMode={setNetworkMode}
            ipv6Protection={prefs.ipv6Protection}
            dohEnabled={prefs.dohEnabled}
            isProPurchased={prefs.isProPurchased}
            isBatteryOptimizationIgnored={prefs.isBatteryOptimizationIgnored}
            onToggleBatteryOptimization={() =>
              setBatteryOptimizationIgnored(!prefs.isBatteryOptimizationIgnored)
            }
            onOpenBrowser={() => setSelectedTab('BROWSER')}
            onOpenDns={() => setSelectedTab('ADVANCED')}
          />
        )}

        {selectedTab === 'BROWSER' && (
          <BrowserScreen
            isVpnRunning={prefs.isVpnEnabled}
            blockedCount={prefs.blockedCount}
            antiSponsoredFeed={prefs.antiSponsoredFeed}
            onToggleAntiSponsoredFeed={setAntiSponsoredFeed}
            onIncrementBlocked={incrementBlockedCount}
            onBackToHome={() => setSelectedTab('HOME')}
            googleAccount={googleAccount}
          />
        )}

        {selectedTab === 'ADVANCED' && (
          <AdvancedScreen
            dnsPreset={prefs.dnsPreset}
            customDnsIp={prefs.customDnsIp}
            isVpnRunning={prefs.isVpnEnabled}
            networkMode={prefs.networkMode}
            ipv6Protection={prefs.ipv6Protection}
            dohEnabled={prefs.dohEnabled}
            onSelectDnsPreset={setDnsPreset}
            onChangeCustomDnsIp={setCustomDnsIp}
            onChangeNetworkMode={setNetworkMode}
            onToggleIpv6={setIpv6Protection}
            onToggleDoh={setDohEnabled}
            onRestartVpn={handleRestartVpn}
          />
        )}

        {selectedTab === 'SETTINGS' && (
          <SettingsScreen
            isProPurchased={prefs.isProPurchased}
            onBuyProClick={() => setShowBillingDialog(true)}
            isBatteryOptimizationIgnored={prefs.isBatteryOptimizationIgnored}
            onToggleBatteryOptimization={() =>
              setBatteryOptimizationIgnored(!prefs.isBatteryOptimizationIgnored)
            }
          />
        )}
      </main>

      <BottomNav
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        isVpnRunning={prefs.isVpnEnabled}
        isProPurchased={prefs.isProPurchased}
      />

      <GooglePlayBillingDialog
        open={showBillingDialog}
        onDismiss={() => setShowBillingDialog(false)}
        onPaymentSuccess={() => {
          setProPurchased(true);
          setShowBillingDialog(false);
        }}
      />

      <OfflineIndicator />
    </div>
  );
}

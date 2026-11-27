/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ActivityTab } from './components/ActivityTab';
import { BottomNav, DesktopSidebar, TopHeaderBar, type V6Tab } from './components/BottomNav';
import { FiltersTab } from './components/FiltersTab';
import { OfflineIndicator } from './components/PWAInstallButton';
import { PermissionsTab } from './components/PermissionsTab';
import { ProtectionTab } from './components/ProtectionTab';
import { useAdblockPrefs, type NetworkScope } from './hooks/useAdblockPrefs';

export default function App() {
  const [selectedTab, setSelectedTab] = useState<V6Tab>('PROTECTION');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  const {
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
  } = useAdblockPrefs();

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const networkLabel = !isOnline
    ? 'Sin conexión · Caché local'
    : state.networkScope === 'dual'
      ? 'Wi-Fi + Datos Móviles · Bloqueo total'
      : state.networkScope === 'wifi'
        ? 'Solo Wi-Fi · Túnel UDP/IPv6 listo'
        : 'Datos Móviles 4G/5G · DoH/DoT listo';

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 2800);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const handleTogglePower = () => {
    const nextEnabled = !state.enabled;
    togglePower();
    showToast(
      nextEnabled
        ? 'Protección activada · Wi-Fi + Datos Móviles filtrados'
        : 'Protección desactivada · Sin llave VPN',
    );
  };

  const handleChangeNetworkScope = (scope: NetworkScope) => {
    setNetworkScope(scope);
    const label =
      scope === 'dual'
        ? 'Wi-Fi + Datos Móviles (bloqueo de todo activo)'
        : scope === 'wifi'
          ? 'Modo Solo Wi-Fi activado'
          : 'Modo Datos Móviles 4G/5G activado';
    showToast(label);
  };

  const handleUpdateLists = () => {
    updateBlocklistNow();
    showToast('Listas actualizadas: HaGeZi Pro + StevenBlack (204.312 dominios)');
  };

  return (
    <div className="min-h-screen bg-[#080D17] text-[#F1F5FF] flex flex-col md:flex-row">
      <DesktopSidebar
        selectedTab={selectedTab}
        onSelectTab={setSelectedTab}
        enabled={state.enabled}
        onTogglePower={handleTogglePower}
        networkLabel={networkLabel}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="md:hidden">
          <TopHeaderBar
            enabled={state.enabled}
            onTogglePower={handleTogglePower}
            networkLabel={networkLabel}
          />
        </div>

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-10">
          {selectedTab === 'PROTECTION' && (
            <ProtectionTab
              state={state}
              onTogglePower={handleTogglePower}
              onChangeNetworkScope={handleChangeNetworkScope}
              onToggleBlockAll={(enabled) => {
                setSwitch('blockAllMode', enabled);
                showToast(
                  enabled
                    ? 'Bloqueo total de anuncios activado'
                    : 'Modo filtro DNS estándar activado',
                );
              }}
              onUpdateLists={handleUpdateLists}
              onGoToActivity={() => setSelectedTab('ACTIVITY')}
              onGoToFilters={() => setSelectedTab('FILTERS')}
              onGoToPermissions={() => setSelectedTab('PERMS')}
            />
          )}

          {selectedTab === 'ACTIVITY' && (
            <ActivityTab
              state={state}
              onToggleDomainRule={(domain, block) => {
                toggleDomainManualRule(domain, block);
                showToast(
                  block
                    ? `${domain} añadido a bloqueos manuales`
                    : `${domain} añadido a excepciones`,
                );
              }}
              onInspectDomain={inspectAndLogDomain}
            />
          )}

          {selectedTab === 'FILTERS' && (
            <FiltersTab
              state={state}
              onSelectDnsProvider={(idx) => {
                setDnsProviderIndex(idx);
                showToast('Proveedor DNS actualizado');
              }}
              onChangeNetworkScope={handleChangeNetworkScope}
              onToggleSwitch={setSwitch}
              onUpdateListsNow={handleUpdateLists}
              onSaveManualRules={(b, a) => {
                saveManualRules(b, a);
                showToast('Reglas manuales guardadas y aplicadas');
              }}
            />
          )}

          {selectedTab === 'PERMS' && (
            <PermissionsTab
              state={state}
              onTogglePermission={togglePermission}
              onGrantAllPermissions={grantAllPermissions}
              onClearCrashLog={() => {
                clearCrashLog();
                showToast('Registro de diagnóstico limpiado');
              }}
              onAppendDiagnosticNote={appendDiagnosticNote}
              onToast={showToast}
            />
          )}
        </main>
      </div>

      <BottomNav selectedTab={selectedTab} onSelectTab={setSelectedTab} />

      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[90vw] px-4 py-2.5 rounded-2xl bg-[#111A2D]/95 border border-[#00E5FF]/45 text-xs font-bold text-[#F1F5FF] shadow-2xl backdrop-blur-md text-center"
        >
          {toastMsg}
        </div>
      )}

      <OfflineIndicator />
    </div>
  );
}

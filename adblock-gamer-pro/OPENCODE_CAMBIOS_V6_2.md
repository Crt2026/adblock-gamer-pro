# Adblock Gamer Pro v6.2 — Resumen de cambios para OpenCode

Repositorio base: `https://github.com/Crt2026/adblock-gamer-pro`

## Cambios reales aplicados en v6.2 (edición Cyber-Reactor + iconos bitono con degradado)

1. **Botón central Cyber-Reactor v6.2 (`src/components/ProtectionTab.tsx` + `src/index.css`)**:
   - Nuevo reactor con doble anillo HUD contrarrotatorio (`ReactorRingSvg` de 36 marcas y `ReactorInnerRingSvg`), bisel metálico mecanizado y núcleo tricolor (`#00E68A` activo / `#FF4D6D` detenido) con lectura directa `TUN0 PROTEGIDO` / `TOCA PARA INICIAR`.
   - Acceso directo interactivo desde la tarjeta de DNS activo hacia **Filtros** y desde **Último anuncio cortado** hacia **Actividad**.

2. **Suite completa de iconos vectoriales bitono degradados (`src/components/Icons.tsx`)**:
   - Gradientes lineales únicos por instancia (`useId()`) en toda la interfaz:
     - `AppBrandShieldIcon`, `PowerCoreIcon`, `ReactorRingSvg`, `ReactorInnerRingSvg`, `KeyGamerIcon`.
     - Navegación: `NavShieldIcon`, `NavActivityIcon`, `NavFiltersIcon`, `NavPermsIcon`.
     - Red Dual-Stack: `WifiDualIcon`, `WifiWaveIcon`, `MobileSignalIcon`.
     - Métricas y túnel: `BlockedShieldIcon`, `QueryPulseIcon`, `DatabaseGlobeIcon`, `LastCutAlertIcon`, `TunnelStackIcon`.
     - Filtros, DNS y diagnóstico: `ServerDnsIcon`, `SpeedGaugeIcon`, `FilterLayerIcon`, `ManualRulesIcon`, `SearchGlassIcon`, `ProbePlayIcon`, `AdBlockEntryIcon`, `AdAllowEntryIcon`, `PermVpnIcon`, `PermBellIcon`, `PermBatteryIcon`, `PermBoltIcon`, `CacheSweepIcon`, `TerminalDiagIcon`, `GitHubBranchIcon`, `GitCommitNodeIcon`, `ArchiveZipIcon`, `DownloadApkIcon`, `CopyPromptIcon`.

3. **Diseño responsivo completo (móvil y escritorio) + 4 pestañas**:
   - Barra superior y barra lateral (`src/components/BottomNav.tsx`) con `icono_gamer_v6.png` (y respaldo SVG automático), insignia `v6.2`, estado de red en vivo y conmutador `Llave activa` / `Sin llave`.
   - Pestañas **Protección**, **Actividad**, **Filtros** y **Permisos** adaptadas a escritorio en 2 columnas (`max-w-5xl`, `lg:grid-cols-12`) y en una columna ergonómica en móvil, con barra de progreso `4/4 listos` en **Permisos**.

4. **Modo Dual-Stack Wi-Fi + Datos Móviles + Bloqueo total**:
   - Estado persistente en `src/hooks/useAdblockPrefs.ts` (`networkScope: 'dual' | 'wifi' | 'mobile'` y `blockAllMode: boolean`, ambos activos por defecto).
   - Selector rápido **Wi-Fi + Datos / Solo Wi-Fi / Datos 4G/5G** en **Protección** y **Filtros**, más botón directo de **Bloqueo total ON / Filtro básico**.
   - En **Actividad**: pruebas rápidas (`doubleclick.net`, `unityads.unity3d.com`, `ads.youtube.com`, `m.youtube.com`, `pixel.facebook.com`), buscador y conmutación instantánea `Permitir` / `Bloquear`.
   - En **Filtros**: los 12 proveedores DNS exactos de `DnsProviders.java` (con `Control D + OISD (recomendado)` por defecto), test real de latencia `/api/dns/ping` (**Wi-Fi UDP**, **Datos DoH**, **Privado DoT**) y verificación real de bloqueo `/api/dns/verify-block`.

5. **Estabilidad, GitHub en vivo y paquete WinRAR/ZIP v6.2**:
   - `vite.config.ts`: `allowedHosts: true`, `devOptions: { enabled: false }` para evitar Service Workers rotos en desarrollo.
   - `server.ts`: puerto `Number(process.env.PORT) || 3000`, `Cache-Control: no-store` en `index.html`/`sw.js`/`registerSW.js`, sincronización en vivo `/api/github/repo` y descarga WinRAR/ZIP `/api/download/adblock-gamer-pro-v6.2.zip`.

## Nota importante para compilaciones Android (`app/build.gradle`)
- Usar un **keystore fijo** en `signingConfigs.release` (tanto en PC local como en GitHub Actions) para evitar el error *"No se instaló la app debido a un conflicto con un paquete"* al actualizar encima de versiones previas de `com.bloqueador.anuncios`.

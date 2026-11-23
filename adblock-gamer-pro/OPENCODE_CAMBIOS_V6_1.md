# Adblock Gamer Pro v6.1 — Resumen de cambios para OpenCode

Repositorio base: `https://github.com/Crt2026/adblock-gamer-pro`

## Cambios reales aplicados en v6.1

1. **Interfaz Cyber-Reactor v6.1 (réplica exacta de Android `MainActivity.java`)**:
   - Barra superior (`src/components/BottomNav.tsx`) con `icono_gamer_v6.png`, insignia `v6.1`, estado de red en vivo y conmutador `LLAVE ACTIVA` / `SIN LLAVE`.
   - 4 pestañas principales: **Protección**, **Actividad**, **Filtros** y **Permisos**.
   - **Protección** (`src/components/ProtectionTab.tsx`): botón central Cyber-Reactor con anillo orbital HUD (`animate-reactor-orbit-spin`), halo pulsante (`animate-reactor-pulse-ring`), estado del túnel (`tun0`), banner de permisos pendientes, tarjetas métricas (`Bloqueados`, `Consultas`, `Dominios`) y último dominio cortado.

2. **Modo Dual-Stack Wi-Fi + Datos Móviles + Bloqueo total**:
   - Estado persistente en `src/hooks/useAdblockPrefs.ts` (`networkScope: 'dual' | 'wifi' | 'mobile'` y `blockAllMode: boolean`, ambos activos por defecto en `dual` + `true`).
   - Selector rápido **Wi-Fi + Datos / Solo Wi-Fi / Datos 4G/5G** en **Protección** y **Filtros**.
   - Interruptor **Bloqueo total de anuncios (de todo)** en **Filtros** (`src/components/FiltersTab.tsx`) y ampliación de reglas en `src/data/adblockRules.ts` para bloquear banners, video-ads, popups, SDKs de juegos, Meta Ads, píxeles y telemetría.
   - Los 12 proveedores DNS exactos de `DnsProviders.java` (con `Control D + OISD (recomendado)` por defecto) y test real de latencia `/api/dns/ping` mostrando **Wi-Fi (UDP)**, **Datos (DoH)** y **Privado (DoT)**.

3. **Estabilidad y carga en servidor / PWA**:
   - `vite.config.ts`: `allowedHosts: true`, `devOptions: { enabled: false }` para evitar Service Workers rotos en desarrollo.
   - `server.ts`: puerto `Number(process.env.PORT) || 3000`, `Cache-Control: no-store` en `index.html`/`sw.js`/`registerSW.js` en producción, presets completos en `PRESET_SERVERS`, sincronización en vivo `/api/github/repo` y empaquetado ZIP `/api/download/adblock-gamer-pro-v6.1.zip`.
   - `src/main.tsx`: limpieza de Service Workers antiguos en desarrollo y `RootErrorBoundary` ante estados corruptos.

## Instrucción rápida para aplicar también en el proyecto Android (`app/`) con OpenCode
- Actualizar `versionName` a `"6.1"` en `app/build.gradle`.
- Asegurar que `AdblockVpnService` aplique el bloqueo tanto en redes `TRANSPORT_WIFI` como `TRANSPORT_CELLULAR` (4G/5G) con `addDnsServer` IPv4/IPv6 y bloqueo de DoT (`853`) / QUIC (`443`/`8443`).
- Mantener la inspección SNI + HTTP y la lista combinada HaGeZi Pro + StevenBlack + reglas manuales/excepciones para bloquear anuncios en juegos, apps y navegadores sin cortar el tráfico legítimo.

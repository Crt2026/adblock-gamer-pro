# Adblock Gamer Pro

Bloqueador de anuncios para juegos y apps de Android mediante `VpnService` + filtro DNS + inspección SNI.

## Estado actual

- Versión **6.1** (`versionCode 16`), `versionName '6.1'`.
- APK v6.0 listo para instalar: `AdblockGamerPro-v6.0.apk`. El APK v6.1 se genera en GitHub Actions como artefacto `AdblockGamerPro-v6.0-apk`.
- Proyecto web/PWA v6.1: carpeta `adblock-gamer-pro/` y paquete `adblock-gamer-pro-v6.1.zip`.
- Idioma de la interfaz: español.
- Pestañas: **Protección / Actividad / Filtros / Permisos** (la interfaz que se ve en el video de la app y en la web v6.1).

## Qué hace

- Botón central **Cyber-Reactor** con anillo orbital HUD: **ACTIVAR / DESACTIVAR**, indicador **SIN LLAVE / CON LLAVE** y estado **Protección desactivada / Protección activa**.
- Motor anti-desconexión v6.1: `startForeground` inmediato, `connect` TCP asíncrono en pool de 8 hilos, `NetworkCallback` seguro en **TRANSPORT_WIFI + TRANSPORT_CELLULAR** y auto-reconexión con `RestartReceiver`.
- **Dual-Stack** activo por defecto: Wi-Fi + Datos 4G/5G, dirección IPv6 en el túnel y DNS IPv4/IPv6 (`10.233.233.1` / `fd00:233::1`).
- **Bloqueo total de anuncios (de todo)** activo por defecto: juegos, video/YouTube, banners, popups, píxeles, telemetría y SDKs (doubleclick, pubmatic, adcolony, chartboost, inmobi, criteo, taboola, outbrain, adjust, appsflyer, pixel.facebook.com, analytics.tiktok.com).
- Bloqueo DNS con lista ampliada HaGeZi Pro + StevenBlack (**+204.312 dominios**), reglas personalizadas y excepciones.
- Inspección SNI para cortar anuncios que usan IP fija sin pasar por DNS.
- Bloqueo de QUIC (UDP 443), DNS cifrado (DoT 853 / DoH) y evasión del proveedor DNS.
- Opción **Anuncios de Meta bloqueados**: enruta rangos IP de Meta al túnel y deja fuera las apps de Meta para no romper chats.
- Historial de tráfico en vivo con botones **Permitir / Bloquear** por dominio.
- Notificación permanente con contadores y avisos silenciosos por cada anuncio cortado.
- Selector de proveedor DNS (12 opciones, **Control D + OISD (recomendado)** por defecto). Aplica igual en Wi-Fi y datos móviles.
- Test de latencia DNS separado en la web: **Wi-Fi (UDP 53)**, **Datos (DoH HTTPS)** y **Privado (DoT 853)**.
- Service Worker desactivado en desarrollo, limpieza de cachés antiguas, estado validado en `localStorage` y `Cache-Control: no-store` en HTML/SW en producción.
- Permisos solicitados desde Android: VPN, notificaciones, batería y arranque automático.
- Registro de errores accesible desde la app (`Ver registro de errores`).

## Limitaciones reales

No bloquea el 100 % de los anuncios:

- Anuncios servidos desde el **mismo dominio** del juego no se pueden cortar sin romper la app.
- Anuncios **con recompensa** pueden dejar de dar el premio si se bloquean; añade ese dominio a **Excepciones**.
- Anuncios ya descargados en caché pueden aparecer una vez más; hay un botón para abrir los ajustes de Google Play Services y limpiar caché.
- Sin root no se puede inspeccionar tráfico de apps que usan certificate pinning propio fuera de los casos cubiertos.

## Compilar

Requiere JDK 17 o 21 (GitHub Actions usa Temurin 17) y Android SDK (compileSdk 34). El proyecto no incluye `gradlew`: se compila con Gradle 8.11.1 instalado.

```powershell
$env:JAVA_HOME='C:\Program Files\Microsoft\jdk-21.0.13.21-hotspot'
$env:ANDROID_HOME='C:\Android\Sdk'
$env:ANDROID_SDK_ROOT='C:\Android\Sdk'
gradle assembleDebug --no-daemon
```

El APK se genera en `app/build/outputs/apk/debug/app-debug.apk`.

## Pruebas

La suite de pruebas del motor está en `%TEMP%\opencode\blocktests` y verifica lista de bloqueo, respuestas DNS, SNI, checksums, evasión DoH, proveedores e historial. Último resultado: **26/26 pruebas superadas**.

## Estructura

- `app/src/main/java/com/bloqueador/anuncios/MainActivity.java` — interfaz y permisos.
- `app/src/main/java/com/bloqueador/anuncios/AdBlockVpnService.java` — túnel VPN, DNS, SNI, contadores.
- `app/src/main/java/com/bloqueador/anuncios/Blocklist.java` — listas y reglas manuales.
- `app/src/main/java/com/bloqueador/anuncios/DnsProviders.java` — proveedores DNS.
- `app/src/main/java/com/bloqueador/anuncios/TrafficLog.java` — historial en vivo.
- `app/src/main/java/com/bloqueador/anuncios/CrashLogger.java` — diagnóstico de errores.
- `LEEME.txt` — instrucciones de uso en español.
- `LEEME_V6.txt` — instrucciones del parche v6.0 (motor anti-desconexión, Cyber-Reactor, iconos y permisos para Xiaomi/HyperOS).
- `adblock-gamer-pro-v6.0-parche.zip` — parche completo v6.0.
- `adblock-gamer-pro-v6.1.zip` — proyecto web/PWA v6.1 completo (descargable también desde la propia app web).
- `adblock-gamer-pro/OPENCODE_CAMBIOS_V6_1.md` — resumen de los cambios reales de v6.1.

El repositorio incluye la app nativa Android (`app/`) y la versión web/PWA (`adblock-gamer-pro/`), ambas en v6.1 con las pestañas **Protección / Actividad / Filtros / Permisos**.

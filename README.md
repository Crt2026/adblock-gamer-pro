# Adblock Gamer Pro

Bloqueador de anuncios para juegos y apps de Android mediante `VpnService` + filtro DNS + inspección SNI.

## Estado actual

- Versión 4.1 (`versionCode 8`).
- APK listo para instalar: `AdblockGamerPro-v4.1.apk`.
- Idioma de la interfaz: español.

## Qué hace

- Botón central con llave: **ACTIVAR / DESACTIVAR**, estado `PROTEGIDO`.
- Bloqueo DNS con lista de ~76.000 dominios (`app/src/main/assets/ad_domains.txt`, lista base StevenBlack + reglas propias).
- Inspección SNI para cortar anuncios que usan IP fija sin pasar por DNS.
- Bloqueo de QUIC (UDP 443), DNS cifrado (DoT 853 / DoH) y evasión del proveedor DNS.
- Opción **Anuncios de Meta bloqueados**: enruta rangos IP de Meta al túnel y deja fuera las apps de Meta para no romper chats.
- Historial de tráfico en vivo con botones **Permitir / Bloquear** por dominio.
- Notificación permanente con contadores y avisos silenciosos por cada anuncio cortado.
- Selector de proveedor DNS (Control D + OISD por defecto). Aplica igual en Wi-Fi y datos móviles.
- Permisos solicitados desde Android: VPN, notificaciones, batería y arranque automático.
- Registro de errores accesible desde la app (`Ver registro de errores`).

## Limitaciones reales

No bloquea el 100 % de los anuncios:

- Anuncios servidos desde el **mismo dominio** del juego no se pueden cortar sin romper la app.
- Anuncios **con recompensa** pueden dejar de dar el premio si se bloquean; añade ese dominio a **Excepciones**.
- Anuncios ya descargados en caché pueden aparecer una vez más; hay un botón para abrir los ajustes de Google Play Services y limpiar caché.
- Sin root no se puede inspeccionar tráfico de apps que usan certificate pinning propio fuera de los casos cubiertos.

## Compilar

Requiere JDK 21 y Android SDK (compileSdk 34). El proyecto incluye `gradlew`? No: se compila con Gradle 8.11.1 instalado.

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

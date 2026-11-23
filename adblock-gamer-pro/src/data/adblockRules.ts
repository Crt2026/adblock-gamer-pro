export interface DnsPresetOption {
  key: string;
  title: string;
  subtitle: string;
  ipDisplay: string;
  primaryIp: string;
  ipv6: string;
  dohUrl: string;
  dotHost: string;
  blocksAdsNatively: boolean;
  category: 'adblock' | 'family' | 'security' | 'gaming' | 'standard' | 'custom';
}

export const DNS_PRESETS: DnsPresetOption[] = [
  {
    key: 'adguard',
    title: 'AdGuard AdBlock DNS',
    subtitle: 'Recomendado · Bloqueo nativo IPv4/IPv6 + DoH',
    ipDisplay: '94.140.14.14 / 94.140.15.15',
    primaryIp: '94.140.14.14',
    ipv6: '2a10:50c0::ad1:ff',
    dohUrl: 'https://dns.adguard-dns.com/dns-query',
    dotHost: 'dns.adguard-dns.com',
    blocksAdsNatively: true,
    category: 'adblock',
  },
  {
    key: 'adguard_family',
    title: 'AdGuard Family Shield',
    subtitle: 'Anuncios + Control parental',
    ipDisplay: '94.140.14.15 / 94.140.15.16',
    primaryIp: '94.140.14.15',
    ipv6: '2a10:50c0::bad1:ff',
    dohUrl: 'https://family.adguard-dns.com/dns-query',
    dotHost: 'family.adguard-dns.com',
    blocksAdsNatively: true,
    category: 'family',
  },
  {
    key: 'controld',
    title: 'Control D AdBlock',
    subtitle: 'Ads, rastreadores y malware en 4G/5G y Wi-Fi',
    ipDisplay: '76.76.2.2 / 76.76.10.2',
    primaryIp: '76.76.2.2',
    ipv6: '2606:1a40::2',
    dohUrl: 'https://freedns.controld.com/p2',
    dotHost: 'p2.freedns.controld.com',
    blocksAdsNatively: true,
    category: 'adblock',
  },
  {
    key: 'controld_family',
    title: 'Control D Full Shield',
    subtitle: 'Filtro estricto contra anuncios y rastreo',
    ipDisplay: '76.76.2.3 / 76.76.10.3',
    primaryIp: '76.76.2.3',
    ipv6: '2606:1a40::3',
    dohUrl: 'https://freedns.controld.com/p3',
    dotHost: 'p3.freedns.controld.com',
    blocksAdsNatively: true,
    category: 'family',
  },
  {
    key: 'mullvad',
    title: 'Mullvad AdBlock & Privacidad',
    subtitle: 'Sin registros · Suecia · DoH/DoT',
    ipDisplay: '194.242.2.3 / 194.242.2.4',
    primaryIp: '194.242.2.3',
    ipv6: '2a07:e340::3',
    dohUrl: 'https://adblock.dns.mullvad.net/dns-query',
    dotHost: 'adblock.dns.mullvad.net',
    blocksAdsNatively: true,
    category: 'adblock',
  },
  {
    key: 'nextdns',
    title: 'NextDNS Ultra Anycast',
    subtitle: 'Baja latencia Anycast global',
    ipDisplay: '45.90.28.0 / 45.90.30.0',
    primaryIp: '45.90.28.0',
    ipv6: '2a07:a8c0::',
    dohUrl: 'https://dns.nextdns.io',
    dotHost: 'dns.nextdns.io',
    blocksAdsNatively: true,
    category: 'adblock',
  },
  {
    key: 'dns4eu',
    title: 'DNS4EU Protective',
    subtitle: 'Estándar Unión Europea 2026',
    ipDisplay: '86.54.11.1 / 86.54.11.201',
    primaryIp: '86.54.11.1',
    ipv6: '2a13:1001::86:54:11:1',
    dohUrl: 'https://protective.joindns4.eu/dns-query',
    dotHost: 'protective.joindns4.eu',
    blocksAdsNatively: true,
    category: 'security',
  },
  {
    key: 'dns4eu_family',
    title: 'DNS4EU Family',
    subtitle: 'Protección infantil europea',
    ipDisplay: '86.54.11.12 / 86.54.11.212',
    primaryIp: '86.54.11.12',
    ipv6: '2a13:1001::86:54:11:12',
    dohUrl: 'https://child.joindns4.eu/dns-query',
    dotHost: 'child.joindns4.eu',
    blocksAdsNatively: true,
    category: 'family',
  },
  {
    key: 'cleanbrowsing',
    title: 'CleanBrowsing Security',
    subtitle: 'Antimalware y phishing',
    ipDisplay: '185.228.168.9 / 185.228.169.9',
    primaryIp: '185.228.168.9',
    ipv6: '2a0d:2a00:1::2',
    dohUrl: 'https://doh.cleanbrowsing.org/doh/security-filter/',
    dotHost: 'security-filter-dns.cleanbrowsing.org',
    blocksAdsNatively: false,
    category: 'security',
  },
  {
    key: 'cleanbrowsing_family',
    title: 'CleanBrowsing Family',
    subtitle: 'Navegación familiar segura',
    ipDisplay: '185.228.168.168 / 185.228.169.168',
    primaryIp: '185.228.168.168',
    ipv6: '2a0d:2a00:1::',
    dohUrl: 'https://doh.cleanbrowsing.org/doh/family-filter/',
    dotHost: 'family-filter-dns.cleanbrowsing.org',
    blocksAdsNatively: false,
    category: 'family',
  },
  {
    key: 'cloudflare_security',
    title: 'Cloudflare 1.1.1.2',
    subtitle: 'Bloqueo de malware y amenazas',
    ipDisplay: '1.1.1.2 / 1.0.0.2',
    primaryIp: '1.1.1.2',
    ipv6: '2606:4700:4700::1112',
    dohUrl: 'https://security.cloudflare-dns.com/dns-query',
    dotHost: 'security.cloudflare-dns.com',
    blocksAdsNatively: false,
    category: 'security',
  },
  {
    key: 'cloudflare_family',
    title: 'Cloudflare 1.1.1.3',
    subtitle: 'Protección familiar + antimalware',
    ipDisplay: '1.1.1.3 / 1.0.0.3',
    primaryIp: '1.1.1.3',
    ipv6: '2606:4700:4700::1113',
    dohUrl: 'https://family.cloudflare-dns.com/dns-query',
    dotHost: 'family.cloudflare-dns.com',
    blocksAdsNatively: false,
    category: 'family',
  },
  {
    key: 'quad9',
    title: 'Quad9 Secure Anycast',
    subtitle: 'Inteligencia contra amenazas',
    ipDisplay: '9.9.9.9 / 149.112.112.112',
    primaryIp: '9.9.9.9',
    ipv6: '2620:fe::fe',
    dohUrl: 'https://dns.quad9.net/dns-query',
    dotHost: 'dns.quad9.net',
    blocksAdsNatively: false,
    category: 'security',
  },
  {
    key: 'quad9_ecs',
    title: 'Quad9 ECS',
    subtitle: 'Baja latencia CDN',
    ipDisplay: '9.9.9.11 / 149.112.112.11',
    primaryIp: '9.9.9.11',
    ipv6: '2620:fe::11',
    dohUrl: 'https://dns11.quad9.net/dns-query',
    dotHost: 'dns11.quad9.net',
    blocksAdsNatively: false,
    category: 'security',
  },
  {
    key: 'opendns_family',
    title: 'OpenDNS FamilyShield',
    subtitle: 'Cisco Umbrella Familiar',
    ipDisplay: '208.67.222.123 / 208.67.220.123',
    primaryIp: '208.67.222.123',
    ipv6: '2620:119:35::123',
    dohUrl: 'https://doh.familyshield.opendns.com/dns-query',
    dotHost: 'familyshield.opendns.com',
    blocksAdsNatively: false,
    category: 'family',
  },
  {
    key: 'cloudflare',
    title: 'Cloudflare Ultra Gaming (1.1.1.1)',
    subtitle: 'Latencia mínima para gaming',
    ipDisplay: '1.1.1.1 / 1.0.0.1',
    primaryIp: '1.1.1.1',
    ipv6: '2606:4700:4700::1111',
    dohUrl: 'https://cloudflare-dns.com/dns-query',
    dotHost: '1dot1dot1dot1.cloudflare-dns.com',
    blocksAdsNatively: false,
    category: 'gaming',
  },
  {
    key: 'google',
    title: 'Google Public DNS',
    subtitle: 'Rápido y estable',
    ipDisplay: '8.8.8.8 / 8.8.4.4',
    primaryIp: '8.8.8.8',
    ipv6: '2001:4860:4860::8888',
    dohUrl: 'https://dns.google/dns-query',
    dotHost: 'dns.google',
    blocksAdsNatively: false,
    category: 'standard',
  },
  {
    key: 'custom',
    title: 'DNS Personalizado',
    subtitle: 'Configura tu propia IPv4 / DNS Privado',
    ipDisplay: '',
    primaryIp: '94.140.14.14',
    ipv6: '2a10:50c0::ad1:ff',
    dohUrl: 'https://dns.adguard-dns.com/dns-query',
    dotHost: 'dns.adguard-dns.com',
    blocksAdsNatively: true,
    category: 'custom',
  },
];

export const ESSENTIAL_WHITELISTED_DOMAINS = [
  'connectivitycheck.gstatic.com', 'connectivitycheck.android.com',
  'clients3.google.com', 'clients1.google.com', 'clients.l.google.com',
  'time.google.com', 'time.android.com', 'msftconnecttest.com',
  'msftncsi.com', 'captive.apple.com', 'airport.us',
  'play.google.com', 'dl.google.com', 'android.clients.google.com',
  'accounts.google.com', 'play.googleapis.com', 'google.com', 'googleapis.com', 'gstatic.com',
  'm.youtube.com', 'www.youtube.com', 'googlevideo.com', 'ytimg.com', 'youtu.be', 'youtube.com',
  'whatsapp.com', 'whatsapp.net', 'telegram.org', 't.me', 'signal.org',
  'spotify.com', 'scdn.co', 'netflix.com', 'nflxvideo.net',
  'discord.com', 'discord.gg', 'discordapp.com',
  'roblox.com', 'rbxcdn.com', 'steampowered.com', 'steamcommunity.com', 'riotgames.com', 'leagueoflegends.com',
  'apple.com', 'icloud.com', 'microsoft.com', 'live.com', 'office.com', 'outlook.com',
  'wikipedia.org', 'github.com', 'gitlab.com',
  'facebook.com', 'fbcdn.net', 'instagram.com', 'cdninstagram.com',
  'tiktok.com', 'tiktokcdn.com', 'twitter.com', 'x.com', 'twimg.com',
  'twitch.tv', 'ttvnw.net',
];

export const AD_DOMAINS_LIST = [
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'adservice.google',
  'adservice.google.com', 'pagead2.googlesyndication.com', 'pagead2.googleadservices.com',
  'googleads.g.doubleclick.net', 'pubads.g.doubleclick.net', 'securepubads.g.doubleclick.net',
  'gads.pubmatic.com', 's0.2mdn.net', 'static.doubleclick.net', 'stats.g.doubleclick.net',
  'admob.com', 'mediavisor.doubleclick.net', 'ads.google.com', 'afs.googlesyndication.com',
  'adwords.google.com', 'partnerad.l.google.com', 'admob-mobile.com', 'firebase-settings.crashlytics.com',
  'imasdk.googleapis.com', 'googleads4.g.doubleclick.net', 'ade.googlesyndication.com',
  'ad.doubleclick.net', 'm.doubleclick.net', 'ade.google.com', 'pagead-google.com',
  'fundingchoicesmessages.google.com', 'admob.google.com', 'ads-api.google.com', 'app-measurement.com',
  'ad.youtube.com', 'ads.youtube.com', 's.youtube.com',
  'unityads.unity3d.com', 'ads.unity3d.com', 'auction.unityads.unity3d.com',
  'config.unityads.unity3d.com', 'webview.unityads.unity3d.com', 'cdn.unityads.unity3d.com',
  'operate.unity3d.com', 'ads.unity.com', 'unityads.unity.com', 'adserver.unityads.unity3d.com',
  'analytics.unity3d.com', 'tracking.unityads.unity3d.com', 'unityads.com',
  'applovin.com', 'applvn.com', 'assets.applovin.com', 'rtb.applovin.com',
  'a.applovin.com', 'd.applovin.com', 'ms.applovin.com', 'al-syn.com', 'safedk.com',
  'ironsrc.com', 'supersonicads.com', 'supersonic.com', 'atom-data.io',
  'vungle.com', 'ads.vungle.com', 'liftoff.io', 'inmobi.com', 'inmobicdn.net',
  'mintegral.com', 'mintegral.net', 'pangle.io', 'ads.tiktok.com', 'analytics.tiktok.com',
  'chartboost.com', 'adcolony.com', 'tapjoy.com', 'fyber.com', 'hyprmx.com',
  'smaato.net', 'smartadserver.com', 'ogury.io', 'criteo.com', 'taboola.com', 'outbrain.com',
  'amazon-adsystem.com', 'an.yandex.ru', 'appmetrica.yandex.ru', 'ads.facebook.com',
  'adform.net', 'rubiconproject.com', 'openx.net', 'adnxs.com', 'pubmatic.com',
  'adjust.com', 'appsflyer.com', 'kochava.com', 'branch.io', 'mixpanel.com', 'mopub.com',
  'exoclick.com', 'popads.net', 'popcash.net', 'propellerads.com', 'adsterra.com',
  'moloco.com', 'samsungads.com', 'petalads.com', 'ads.snapchat.com',
];

export const AD_KEYWORDS = [
  'doubleclick', 'googlesyndication', 'googleadservices', 'adservice',
  'pagead', 'googleads', 'pubads', 'securepubads', 'admob', 'unityads',
  'applovin', 'applvn', 'vungle', 'inmobi', 'ironsrc', 'chartboost',
  'adcolony', 'liftoff', 'tapjoy', 'pangle', 'pangolin', 'amazon-adsystem',
  'ad-delivery', 'supersonicads', 'flurry', 'fyber', 'smaato',
  'smartadserver', 'ogury', 'criteo', 'taboola', 'outbrain', 'adserver',
  'adsystem', 'adnetwork', 'adform', 'mopub', 'mintegral', 'appmetrica',
  'adjust', 'appsflyer', 'kochava', 'propellerads', 'adsterra',
  'exoclick', 'popcash', 'popads', 'adclick', 'adnxs', 'adskeeper',
  'adroll', 'admaven', 'monetag', 'richads', 'rollerads',
  'moloco', 'petalads', 'app-measurement',
];

export const WEBVIEW_AD_BLOCK_FILTERS = [
  'doubleclick.net',
  'googlesyndication.com',
  'googleadservices.com',
  'adservice.google.',
  'youtube.com/pagead',
  'youtube.com/api/stats/ads',
  'youtube.com/api/stats/atr',
  'youtube.com/api/stats/qoe?adformat',
  'youtube.com/ptracking',
  'youtube.com/get_midroll_info',
  'youtube.com/pcs/activeview',
  'youtube.com/youtubei/v1/player/ad_break',
  'youtube.com/youtubei/v1/ads',
  'youtube.com/youtubei/v1/att/get',
  'youtube.com/youtubei/v1/log_event',
  'ad.youtube.com',
  'ads.youtube.com',
  'unityads.unity3d.com',
  'applovin.com',
  'vungle.com',
  'ironsrc.com',
];

// Enhanced anti-"Patrocinado" & feed ad CSS selectors (fixes sponsored cards like Entel in YouTube feed)
export const YOUTUBE_SPONSORED_SELECTORS = [
  'ytd-ad-slot-renderer',
  'ytm-promoted-sparkles-web-renderer',
  'ytm-promoted-video-renderer',
  'ytm-companion-ad-renderer',
  'ytd-promoted-sparkles-text-search-renderer',
  'ytd-display-ad-renderer',
  'ytd-statement-banner-renderer',
  'ytd-in-feed-ad-layout-renderer',
  'ytd-banner-promo-renderer',
  'ad-slot-renderer',
  '[data-ad-slot-id]',
  'ytm-reel-shelf-renderer:has([aria-label*="Patrocinado" i])',
];

const essentialSet = new Set(ESSENTIAL_WHITELISTED_DOMAINS);
const adSet = new Set(AD_DOMAINS_LIST);

export interface FilterCheckResult {
  input: string;
  normalizedDomain: string;
  blocked: boolean;
  reason: string;
}

export function checkDomainOrUrl(rawInput: string): FilterCheckResult {
  const trimmed = rawInput.trim().toLowerCase();
  if (!trimmed) {
    return { input: rawInput, normalizedDomain: '', blocked: false, reason: 'Entrada vacía' };
  }

  for (const filter of WEBVIEW_AD_BLOCK_FILTERS) {
    if (trimmed.includes(filter)) {
      return {
        input: rawInput,
        normalizedDomain: trimmed,
        blocked: true,
        reason: `Bloqueado por filtro WebView YouTube (${filter})`,
      };
    }
  }

  const domain = trimmed
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .split(':')[0]
    .replace(/\.+$/, '');

  if (
    essentialSet.has(domain) ||
    ESSENTIAL_WHITELISTED_DOMAINS.some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`))
  ) {
    return {
      input: rawInput,
      normalizedDomain: domain,
      blocked: false,
      reason: 'Permitido por Whitelist Esencial (YouTube / Google / WhatsApp / Gaming)',
    };
  }

  let current: string | null = domain;
  while (current && current.includes('.')) {
    if (adSet.has(current)) {
      return {
        input: rawInput,
        normalizedDomain: domain,
        blocked: true,
        reason: `Bloqueado por lista exacta de dominios (${current})`,
      };
    }
    const nextDot = current.indexOf('.');
    current = nextDot !== -1 && nextDot < current.length - 1 ? current.slice(nextDot + 1) : null;
  }

  const matchedKeyword = AD_KEYWORDS.find((kw) => domain.includes(kw));
  if (matchedKeyword) {
    return {
      input: rawInput,
      normalizedDomain: domain,
      blocked: true,
      reason: `Bloqueado por palabra clave publicitaria (${matchedKeyword})`,
    };
  }

  const adPrefixes = [
    'ad.', 'ads.', 'adservice.', 'adserver.', 'mobileads.', 'track.',
    'pixel.', 'analytics.', 'ads-', 'telemetry.', 'stat.', 'metrics.',
    'ad-', 'tracking.', 'banner.', 'popup.', 'popunder.', 'monetize.',
  ];
  const matchedPrefix = adPrefixes.find((p) => domain.startsWith(p));
  if (matchedPrefix) {
    return {
      input: rawInput,
      normalizedDomain: domain,
      blocked: true,
      reason: `Bloqueado por patrón estructural (${matchedPrefix}*)`,
    };
  }

  return {
    input: rawInput,
    normalizedDomain: domain,
    blocked: false,
    reason: 'Dominio limpio — Resuelto mediante DNS Dual-Stack (Wi-Fi / 4G·5G)',
  };
}

export function recursiveCleanYouTubePayload(
  obj: unknown,
): { cleaned: unknown; removedKeys: string[] } {
  const removedKeys: string[] = [];

  function clean(node: unknown, seen = new WeakSet<object>()): unknown {
    if (!node || typeof node !== 'object') return node;
    if (seen.has(node)) return node;
    seen.add(node);

    if (Array.isArray(node)) {
      return node
        .filter((item) => {
          if (item && typeof item === 'object') {
            const keys = Object.keys(item as Record<string, unknown>);
            if (
              keys.some(
                (k) =>
                  k.includes('adSlotRenderer') ||
                  k.includes('promotedSparkles') ||
                  k.includes('promotedVideoRenderer') ||
                  k.includes('brandVideoSingletonRenderer'),
              )
            ) {
              removedKeys.push('adSlotRenderer (Patrocinado)');
              return false;
            }
          }
          return true;
        })
        .map((item) => clean(item, seen));
    }

    const record = node as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
      if (
        key === 'adPlacements' ||
        key === 'adSlots' ||
        key === 'playerAds' ||
        key === 'adBreakHeartbeatParams' ||
        key === 'adBreakServiceParams' ||
        key === 'adSlotRenderer' ||
        key === 'promotedSparklesWebRenderer' ||
        key === 'brandVideoSingletonRenderer'
      ) {
        removedKeys.push(key);
        if (key === 'adPlacements' || key === 'adSlots' || key === 'playerAds') {
          out[key] = [];
        }
        continue;
      }
      out[key] = clean(record[key], seen);
    }
    return out;
  }

  return {
    cleaned: clean(obj),
    removedKeys,
  };
}

export const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: '¿Cómo funciona el bloqueador en Wi-Fi y Datos Móviles?',
    answer:
      'Combina DNS Dual-Stack (IPv4 + IPv6) con DNS-over-HTTPS (DoH) y DNS Privado (DoT) en el puerto 443/853 para evitar que las operadoras móviles (Entel, Movistar, Claro, WOM) bloqueen o desvíen las consultas UDP/53.',
  },
  {
    question: '¿Por qué a veces aparecen anuncios "Patrocinado" en la app oficial de YouTube?',
    answer:
      'La app oficial de YouTube mezcla las tarjetas "Patrocinado" dentro del mismo flujo JSON que los videos normales. Para eliminarlos al 100%, usa nuestra pestaña YouTube Sin Anuncios, que limpia adSlotRenderer, adPlacements y reproduce en modo limpio sin pre-roll ni banners.',
  },
  {
    question: '¿Cómo activo el DNS en todo el teléfono Android (Wi-Fi + 4G/5G)?',
    answer:
      'En Ajustes de Android > Red e Internet > DNS privado, elige "Nombre de host del proveedor de DNS privado" y pega dns.adguard-dns.com o p2.freedns.controld.com desde nuestra pestaña DNS.',
  },
  {
    question: '¿Bloquea anuncios dentro de juegos?',
    answer:
      'Sí. Al activar el Modo Gamer bloqueamos redes de SDK publicitarios móviles (Unity Ads, AppLovin, ironSource, Vungle, AdMob, Mintegral) manteniendo las rutas de juego con latencia mínima.',
  },
];

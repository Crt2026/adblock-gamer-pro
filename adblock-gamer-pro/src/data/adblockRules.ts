export interface DnsProviderOption {
  index: number;
  key: string;
  name: string;
  primary: string;
  secondary: string;
  dotHost: string;
  note: string;
}

export const DNS_PROVIDERS: DnsProviderOption[] = [
  {
    index: 0,
    key: 'adguard',
    name: 'AdGuard DNS',
    primary: '94.140.14.14',
    secondary: '94.140.15.15',
    dotHost: 'dns.adguard-dns.com',
    note: 'Anuncios, rastreadores y malware',
  },
  {
    index: 1,
    key: 'adguard_family',
    name: 'AdGuard Familiar',
    primary: '94.140.14.15',
    secondary: '94.140.15.16',
    dotHost: 'family.adguard-dns.com',
    note: 'Además bloquea contenido adulto',
  },
  {
    index: 2,
    key: 'controld',
    name: 'Control D (Ads)',
    primary: '76.76.2.2',
    secondary: '76.76.10.2',
    dotHost: 'p2.freedns.controld.com',
    note: 'Anuncios, rastreo y malware',
  },
  {
    index: 3,
    key: 'controld_oisd',
    name: 'Control D + OISD (recomendado)',
    primary: '76.76.2.32',
    secondary: '76.76.10.32',
    dotHost: 'x-oisd.freedns.controld.com',
    note: 'Lista OISD Full: muy fuerte en anuncios',
  },
  {
    index: 4,
    key: 'controld_hagezi',
    name: 'Control D + Hagezi',
    primary: '76.76.2.46',
    secondary: '76.76.10.46',
    dotHost: 'x-hagezi-tif.freedns.controld.com',
    note: 'Hagezi TIF: ideal para juegos y móvil',
  },
  {
    index: 5,
    key: 'controld_adguard',
    name: 'Control D + AdGuard',
    primary: '76.76.2.44',
    secondary: '76.76.10.44',
    dotHost: 'x-adguard.freedns.controld.com',
    note: 'Filtro AdGuard sobre Control D',
  },
  {
    index: 6,
    key: 'controld_stevenblack',
    name: 'Control D + StevenBlack',
    primary: '76.76.2.35',
    secondary: '76.76.10.35',
    dotHost: 'x-stevenblack.freedns.controld.com',
    note: 'Misma lista base de esta app',
  },
  {
    index: 7,
    key: 'ahadns',
    name: 'AhaDNS',
    primary: '5.2.75.75',
    secondary: '185.213.26.187',
    dotHost: 'dot.nl.ahadns.net',
    note: 'Anuncios y rastreo general',
  },
  {
    index: 8,
    key: 'dns0',
    name: 'DNS0.eu',
    primary: '193.110.81.1',
    secondary: '185.253.5.1',
    dotHost: 'zero.dns0.eu',
    note: 'Protección europea',
  },
  {
    index: 9,
    key: 'cleanbrowsing_family',
    name: 'CleanBrowsing Family',
    primary: '185.228.168.168',
    secondary: '185.228.169.168',
    dotHost: 'family-filter-dns.cleanbrowsing.org',
    note: 'Familiar + publicidad maliciosa',
  },
  {
    index: 10,
    key: 'alternate',
    name: 'Alternate DNS',
    primary: '76.76.19.19',
    secondary: '76.223.122.150',
    dotHost: 'dns.alternate-dns.com',
    note: 'Filtro básico de banners',
  },
  {
    index: 11,
    key: 'cloudflare',
    name: 'Cloudflare (sin filtro)',
    primary: '1.1.1.1',
    secondary: '1.0.0.1',
    dotHost: 'cloudflare-dns.com',
    note: 'Solo filtra la app, no el proveedor',
  },
];

export const DEFAULT_DNS_PROVIDER_INDEX = 3;

export function shortDnsName(raw: string): string {
  const idx = raw.indexOf(' (');
  return idx > 0 ? raw.slice(0, idx) : raw;
}

export const BUILTIN_AD_DOMAINS = [
  'googleadservices.com',
  'doubleclick.net',
  'googlesyndication.com',
  'googleadapis.com',
  'googleads.com',
  'adservice.google.com',
  'ads.google.com',
  'pagead2.googlesyndication.com',
  'securepubads.g.doubleclick.net',
  'googleads.g.doubleclick.net',
  'googletagservices.com',
  'imasdk.googleapis.com',
  'fundingchoicesmessages.google.com',
  'adtrafficquality.google',
  'app-measurement.com',
  'adservice.google.cl',
  'adservice.google.es',
  'facebook.net',
  'facebookads.com',
  'audiencenetwork.com',
  'an.facebook.com',
  'ads.facebook.com',
  'fbads.com',
  'applovin.com',
  'app-lovin.com',
  'applvn.com',
  'al-cdn.com',
  'safedk.com',
  'rt.applovin.com',
  'unityads.unity3d.com',
  'unityads.com',
  'config.unityads.unity3d.com',
  'unity3dusercontent.com',
  'cdp.cloud.unity3d.com',
  'ironsource.com',
  'ironsrc.com',
  'supersonicads.com',
  'supersonic.com',
  'isnssdk.com',
  'atom-data.io',
  'vungle.com',
  'vungleads.com',
  'liftoff.io',
  'pangle.io',
  'pangle-ads.com',
  'pangolin.com',
  'panglesdk.com',
  'pangolin-sdk-toutiao.com',
  'byteadx.com',
  'pglstatp.com',
  'tiktokads.com',
  'ads.tiktok.com',
  'mintegral.com',
  'mintegral.net',
  'rayjump.com',
  'mobvista.com',
  'mollyflow.com',
  'mmtk.mollyflow.com',
  'anythinktech.com',
  'toponad.com',
  'tradplusad.com',
  'thecatmachine.com',
  'x.thecatmachine.com',
  'blueduckredapple.com',
  'x.blueduckredapple.com',
  'appsflyersdk.com',
  'launches.appsflyersdk.com',
  'bigo.sg',
  'bigoad.com',
  'bidmachine.io',
  'appodeal.com',
  'ogury.com',
  'presage.io',
  'hyprmx.com',
  'digitalturbine.com',
  'fyber.com',
  'startapp.com',
  'start.io',
  'smaato.net',
  'verve.com',
  'pubnative.net',
  'yodo1.com',
  'ads.youtube.com',
  'ad.youtube.com',
  'ad.doubleclick.net',
  'static.doubleclick.net',
  's0.2mdn.net',
  'tpc.googlesyndication.com',
  'pubmatic.com',
  'openx.net',
  'rubiconproject.com',
  'adnxs.com',
  'casalemedia.com',
  'criteo.com',
  'criteo.net',
  'taboola.com',
  'outbrain.com',
  'adcolony.com',
  'chartboost.com',
  'inmobi.com',
  'mopub.com',
  'flurry.com',
  'scorecardresearch.com',
  'moatads.com',
  'doubleverify.com',
  'analytics.tiktok.com',
  'pixel.facebook.com',
  'ads-api.twitter.com',
  'ads.pinterest.com',
  'adjust.com',
  'app.adjust.com',
  'branch.io',
  'app.appsflyer.com',
  'kochava.com',
  'singular.net',
];

export const AD_KEYWORDS = [
  'doubleclick',
  'googlesyndication',
  'googleadservices',
  'adservice',
  'pagead',
  'googleads',
  'admob',
  'unityads',
  'applovin',
  'applvn',
  'vungle',
  'ironsrc',
  'ironsource',
  'pangle',
  'pangolin',
  'mintegral',
  'rayjump',
  'mollyflow',
  'appsflyer',
  'bigoad',
  'hyprmx',
  'ogury',
  'smaato',
  'taboola',
  'outbrain',
  'criteo',
  'app-measurement',
  'adcolony',
  'chartboost',
  'inmobi',
  'pubmatic',
  'adnxs',
  'moatads',
  'doubleverify',
];

export const TOTAL_BLOCK_KEYWORDS = [
  'telemetry',
  'metrics',
  'analytics',
  'tracker',
  'tracking',
  'beacon',
  'adserver',
  'banner',
  'popunder',
  'sponsor',
  'pixel',
];

const builtinSet = new Set(BUILTIN_AD_DOMAINS);

export function normalizeDomain(rawInput: string): string {
  const trimmed = rawInput.trim().toLowerCase();
  if (!trimmed) return '';
  let host = trimmed;
  try {
    const withProtocol = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    host = new URL(withProtocol).hostname.toLowerCase();
  } catch {
    host = trimmed.split('/')[0].split(':')[0];
  }
  return host.replace(/^\.+|\.+$/g, '');
}

export function parseDomainLines(rawText: string): string[] {
  if (!rawText.trim()) return [];
  const items = new Set<string>();
  for (const part of rawText.split(/[\n,; ]+/)) {
    const clean = normalizeDomain(part);
    if (clean && clean.includes('.')) items.add(clean);
  }
  return Array.from(items);
}

export interface DomainEvalResult {
  domain: string;
  blocked: boolean;
  reason: string;
}

export function evaluateDomain(
  rawDomain: string,
  customBlockRaw: string,
  customAllowRaw: string,
  metaBlock = true,
  blockAllMode = true,
): DomainEvalResult {
  const host = normalizeDomain(rawDomain);
  if (!host) {
    return { domain: '', blocked: false, reason: 'Entrada vacía' };
  }

  const allowList = parseDomainLines(customAllowRaw);
  for (const allow of allowList) {
    if (host === allow || host.endsWith(`.${allow}`)) {
      return { domain: host, blocked: false, reason: `Excepción manual (${allow})` };
    }
  }

  const blockList = parseDomainLines(customBlockRaw);
  for (const blk of blockList) {
    if (host === blk || host.endsWith(`.${blk}`)) {
      return { domain: host, blocked: true, reason: `Regla manual (${blk})` };
    }
  }

  if (
    metaBlock &&
    (host.includes('facebookads') ||
      host.includes('audiencenetwork') ||
      host === 'an.facebook.com' ||
      host === 'ads.facebook.com' ||
      host === 'pixel.facebook.com')
  ) {
    return { domain: host, blocked: true, reason: 'Red publicitaria Meta' };
  }

  let cursor = host;
  while (cursor.includes('.')) {
    if (builtinSet.has(cursor)) {
      return {
        domain: host,
        blocked: true,
        reason: `Bloqueado por HaGeZi Pro + StevenBlack (${cursor})`,
      };
    }
    const dot = cursor.indexOf('.');
    if (dot === -1) break;
    cursor = cursor.slice(dot + 1);
  }

  for (const kw of AD_KEYWORDS) {
    if (host.includes(kw)) {
      return { domain: host, blocked: true, reason: `Inspección SNI / SDK (${kw})` };
    }
  }

  if (blockAllMode) {
    for (const kw of TOTAL_BLOCK_KEYWORDS) {
      if (host.includes(kw)) {
        return { domain: host, blocked: true, reason: `Bloqueo total de rastreo/anuncios (${kw})` };
      }
    }
  }

  return { domain: host, blocked: false, reason: 'Tráfico permitido' };
}

export interface TrafficLogEntry {
  id: string;
  domain: string;
  blocked: boolean;
  time: string;
}

export const INITIAL_TRAFFIC_LOG: TrafficLogEntry[] = [
  { id: '1', domain: 'googleads.g.doubleclick.net', blocked: true, time: '09:11:42' },
  { id: '2', domain: 'unityads.unity3d.com', blocked: true, time: '09:11:38' },
  { id: '3', domain: 'rt.applovin.com', blocked: true, time: '09:11:31' },
  { id: '4', domain: 'm.youtube.com', blocked: false, time: '09:11:25' },
  { id: '5', domain: 'mmtk.mollyflow.com', blocked: true, time: '09:11:19' },
  { id: '6', domain: 'api.steampowered.com', blocked: false, time: '09:11:12' },
  { id: '7', domain: 'pangolin-sdk-toutiao.com', blocked: true, time: '09:11:04' },
  { id: '8', domain: 'connectivitycheck.gstatic.com', blocked: false, time: '09:10:55' },
  { id: '9', domain: 'x.thecatmachine.com', blocked: true, time: '09:10:49' },
  { id: '10', domain: 'an.facebook.com', blocked: true, time: '09:10:41' },
];

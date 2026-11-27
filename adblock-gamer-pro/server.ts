import express from 'express';
import dgram from 'node:dgram';
import net from 'node:net';
import tls from 'node:tls';
import path from 'node:path';
import fs from 'node:fs';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const GITHUB_OWNER = 'Crt2026';
const GITHUB_REPO = 'adblock-gamer-pro';

interface DnsServerTarget {
  ipv4: string;
  ipv6: string;
  dohUrl: string;
  dotHost: string;
}

const PRESET_SERVERS: Record<string, DnsServerTarget> = {
  adguard: {
    ipv4: '94.140.14.14',
    ipv6: '2a10:50c0::ad1:ff',
    dohUrl: 'https://dns.adguard-dns.com/dns-query',
    dotHost: 'dns.adguard-dns.com',
  },
  adguard_family: {
    ipv4: '94.140.14.15',
    ipv6: '2a10:50c0::bad1:ff',
    dohUrl: 'https://family.adguard-dns.com/dns-query',
    dotHost: 'family.adguard-dns.com',
  },
  controld: {
    ipv4: '76.76.2.2',
    ipv6: '2606:1a40::2',
    dohUrl: 'https://freedns.controld.com/p2',
    dotHost: 'p2.freedns.controld.com',
  },
  controld_family: {
    ipv4: '76.76.2.3',
    ipv6: '2606:1a40::3',
    dohUrl: 'https://freedns.controld.com/p3',
    dotHost: 'p3.freedns.controld.com',
  },
  nextdns: {
    ipv4: '45.90.28.0',
    ipv6: '2a07:a8c0::',
    dohUrl: 'https://dns.nextdns.io/dns-query',
    dotHost: 'dns.nextdns.io',
  },
  mullvad: {
    ipv4: '194.242.2.3',
    ipv6: '2a07:e340::3',
    dohUrl: 'https://adblock.dns.mullvad.net/dns-query',
    dotHost: 'adblock.dns.mullvad.net',
  },
  dns4eu: {
    ipv4: '86.54.11.1',
    ipv6: '2a13:1001::86:54:11:1',
    dohUrl: 'https://protective.joindns4.eu/dns-query',
    dotHost: 'protective.joindns4.eu',
  },
  dns4eu_family: {
    ipv4: '86.54.11.12',
    ipv6: '2a13:1001::86:54:11:12',
    dohUrl: 'https://child.joindns4.eu/dns-query',
    dotHost: 'child.joindns4.eu',
  },
  cleanbrowsing: {
    ipv4: '185.228.168.9',
    ipv6: '2a0d:2a00:1::2',
    dohUrl: 'https://doh.cleanbrowsing.org/doh/security-filter/',
    dotHost: 'security-filter-dns.cleanbrowsing.org',
  },
  cleanbrowsing_family: {
    ipv4: '185.228.168.168',
    ipv6: '2a0d:2a00:1::',
    dohUrl: 'https://doh.cleanbrowsing.org/doh/family-filter/',
    dotHost: 'family-filter-dns.cleanbrowsing.org',
  },
  cloudflare_security: {
    ipv4: '1.1.1.2',
    ipv6: '2606:4700:4700::1112',
    dohUrl: 'https://security.cloudflare-dns.com/dns-query',
    dotHost: 'security.cloudflare-dns.com',
  },
  cloudflare_family: {
    ipv4: '1.1.1.3',
    ipv6: '2606:4700:4700::1113',
    dohUrl: 'https://family.cloudflare-dns.com/dns-query',
    dotHost: 'family.cloudflare-dns.com',
  },
  quad9: {
    ipv4: '9.9.9.9',
    ipv6: '2620:fe::fe',
    dohUrl: 'https://dns.quad9.net/dns-query',
    dotHost: 'dns.quad9.net',
  },
  quad9_ecs: {
    ipv4: '9.9.9.11',
    ipv6: '2620:fe::11',
    dohUrl: 'https://dns11.quad9.net/dns-query',
    dotHost: 'dns11.quad9.net',
  },
  opendns_family: {
    ipv4: '208.67.222.123',
    ipv6: '2620:119:35::123',
    dohUrl: 'https://doh.familyshield.opendns.com/dns-query',
    dotHost: 'familyshield.opendns.com',
  },
  controld_oisd: {
    ipv4: '76.76.2.32',
    ipv6: '2606:1a40::32',
    dohUrl: 'https://freedns.controld.com/x-oisd',
    dotHost: 'x-oisd.freedns.controld.com',
  },
  controld_hagezi: {
    ipv4: '76.76.2.46',
    ipv6: '2606:1a40::46',
    dohUrl: 'https://freedns.controld.com/x-hagezi-tif',
    dotHost: 'x-hagezi-tif.freedns.controld.com',
  },
  controld_adguard: {
    ipv4: '76.76.2.44',
    ipv6: '2606:1a40::44',
    dohUrl: 'https://freedns.controld.com/x-adguard',
    dotHost: 'x-adguard.freedns.controld.com',
  },
  controld_stevenblack: {
    ipv4: '76.76.2.35',
    ipv6: '2606:1a40::35',
    dohUrl: 'https://freedns.controld.com/x-stevenblack',
    dotHost: 'x-stevenblack.freedns.controld.com',
  },
  ahadns: {
    ipv4: '5.2.75.75',
    ipv6: '2a0d:5600:33:13::1',
    dohUrl: 'https://doh.nl.ahadns.net/dns-query',
    dotHost: 'dot.nl.ahadns.net',
  },
  dns0: {
    ipv4: '193.110.81.1',
    ipv6: '2a0f:fc80::1',
    dohUrl: 'https://zero.dns0.eu/',
    dotHost: 'zero.dns0.eu',
  },
  alternate: {
    ipv4: '76.76.19.19',
    ipv6: '2606:1a40::19',
    dohUrl: 'https://dns.alternate-dns.com/dns-query',
    dotHost: 'dns.alternate-dns.com',
  },
  cloudflare: {
    ipv4: '1.1.1.1',
    ipv6: '2606:4700:4700::1111',
    dohUrl: 'https://cloudflare-dns.com/dns-query',
    dotHost: '1dot1dot1dot1.cloudflare-dns.com',
  },
  google: {
    ipv4: '8.8.8.8',
    ipv6: '2001:4860:4860::8888',
    dohUrl: 'https://dns.google/dns-query',
    dotHost: 'dns.google',
  },
};

function isPublicIpv4(ip: string): boolean {
  if (!net.isIPv4(ip)) return false;
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a >= 224) return false;
  return true;
}

function isValidDomainName(domain: string): boolean {
  const clean = domain.trim().toLowerCase().replace(/\.+$/, '');
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(clean);
}

function buildDnsQueryPacket(domain = 'example.com'): Buffer {
  const txId = Buffer.from([
    Math.floor(Math.random() * 255),
    Math.floor(Math.random() * 255),
  ]);
  const header = Buffer.from([
    0x01, 0x00,
    0x00, 0x01,
    0x00, 0x00,
    0x00, 0x00,
    0x00, 0x00,
  ]);
  const labels = domain
    .toLowerCase()
    .replace(/\.+$/, '')
    .split('.')
    .filter(Boolean)
    .map((label) => {
      const len = Math.min(63, label.length);
      const buf = Buffer.alloc(1 + len);
      buf[0] = len;
      buf.write(label.slice(0, len), 1, 'ascii');
      return buf;
    });
  const qEnd = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x01]);
  return Buffer.concat([txId, header, ...labels, qEnd]);
}

function parseDnsAResponse(buf: Buffer): { rcode: number; ips: string[] } {
  if (buf.length < 12) return { rcode: -1, ips: [] };
  const flags = buf.readUInt16BE(2);
  const rcode = flags & 0x000f;
  const qdCount = buf.readUInt16BE(4);
  const anCount = buf.readUInt16BE(6);

  let offset = 12;
  const skipName = () => {
    while (offset < buf.length) {
      const len = buf[offset];
      if (len === 0) {
        offset += 1;
        break;
      }
      if ((len & 0xc0) === 0xc0) {
        offset += 2;
        break;
      }
      offset += 1 + len;
    }
  };

  for (let i = 0; i < qdCount && offset < buf.length; i++) {
    skipName();
    offset += 4;
  }

  const ips: string[] = [];
  for (let i = 0; i < anCount && offset < buf.length; i++) {
    skipName();
    if (offset + 10 > buf.length) break;
    const type = buf.readUInt16BE(offset);
    const rdLength = buf.readUInt16BE(offset + 8);
    offset += 10;
    if (offset + rdLength > buf.length) break;
    if (type === 1 && rdLength === 4) {
      ips.push(`${buf[offset]}.${buf[offset + 1]}.${buf[offset + 2]}.${buf[offset + 3]}`);
    }
    offset += rdLength;
  }

  return { rcode, ips };
}

function probeUdpDns(
  ip: string,
  domain = 'example.com',
  timeoutMs = 1500,
): Promise<{ latencyMs: number; rcode: number; ips: string[] }> {
  return new Promise((resolve) => {
    const start = performance.now();
    const socket = dgram.createSocket('udp4');
    let settled = false;

    const finish = (latencyMs: number, rcode = -1, ips: string[] = []) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        // ignore
      }
      resolve({ latencyMs, rcode, ips });
    };

    const timer = setTimeout(() => finish(999), timeoutMs);

    socket.on('message', (msg) => {
      const elapsed = Math.max(1, Math.round(performance.now() - start));
      const parsed = parseDnsAResponse(msg);
      finish(elapsed, parsed.rcode, parsed.ips);
    });

    socket.on('error', () => finish(999));

    const packet = buildDnsQueryPacket(domain);
    socket.send(packet, 53, ip, (err) => {
      if (err) finish(999);
    });
  });
}

function probeDotDns(
  ip: string,
  dotHost: string,
  domain = 'example.com',
  timeoutMs = 1800,
): Promise<{ latencyMs: number; rcode: number; ips: string[] }> {
  return new Promise((resolve) => {
    const start = performance.now();
    let settled = false;
    let buffer = Buffer.alloc(0);

    const finish = (latencyMs: number, rcode = -1, ips: string[] = []) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        socket.destroy();
      } catch {
        // ignore
      }
      resolve({ latencyMs, rcode, ips });
    };

    const socket = tls.connect(
      { host: ip, port: 853, servername: dotHost, rejectUnauthorized: true },
      () => {
        const query = buildDnsQueryPacket(domain);
        const lenPrefix = Buffer.alloc(2);
        lenPrefix.writeUInt16BE(query.length, 0);
        socket.write(Buffer.concat([lenPrefix, query]));
      },
    );

    const timer = setTimeout(() => finish(999), timeoutMs);

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      if (buffer.length >= 2) {
        const msgLen = buffer.readUInt16BE(0);
        if (buffer.length >= 2 + msgLen) {
          const dnsMsg = buffer.subarray(2, 2 + msgLen);
          const elapsed = Math.max(1, Math.round(performance.now() - start));
          const parsed = parseDnsAResponse(dnsMsg);
          finish(elapsed, parsed.rcode, parsed.ips);
        }
      }
    });

    socket.on('error', () => finish(999));
    socket.on('timeout', () => finish(999));
  });
}

function probeTcpConnect(ip: string, port: number, timeoutMs = 1400): Promise<number> {
  return new Promise((resolve) => {
    const start = performance.now();
    const socket = new net.Socket();
    let settled = false;

    const finish = (ms: number) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ms);
    };

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => {
      finish(Math.max(1, Math.round(performance.now() - start)));
    });
    socket.on('timeout', () => finish(999));
    socket.on('error', () => finish(999));
    socket.connect(port, ip);
  });
}

async function probeDohDns(
  dohUrl: string,
  domain = 'example.com',
  timeoutMs = 1800,
): Promise<{ latencyMs: number; rcode: number; ips: string[] }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();
  try {
    const packet = buildDnsQueryPacket(domain);
    const res = await fetch(dohUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/dns-message',
        Accept: 'application/dns-message',
      },
      body: new Uint8Array(packet),
      signal: controller.signal,
    });
    if (!res.ok) return { latencyMs: 999, rcode: -1, ips: [] };
    const arr = await res.arrayBuffer();
    const elapsed = Math.max(1, Math.round(performance.now() - start));
    const parsed = parseDnsAResponse(Buffer.from(arr));
    return { latencyMs: elapsed, rcode: parsed.rcode, ips: parsed.ips };
  } catch {
    return { latencyMs: 999, rcode: -1, ips: [] };
  } finally {
    clearTimeout(timer);
  }
}

async function measureDnsLatency(
  ip: string,
  presetKey?: string,
  networkMode: 'dual' | 'wifi' | 'mobile' = 'dual',
): Promise<{
  latencyMs: number;
  method: string;
  udpMs: number;
  dohMs: number;
  dotMs: number;
}> {
  if (!isPublicIpv4(ip)) {
    return { latencyMs: 999, method: 'invalid', udpMs: 999, dohMs: 999, dotMs: 999 };
  }

  const preset = presetKey ? PRESET_SERVERS[presetKey] : undefined;

  const [udpProbe, dohProbe, dotProbe] = await Promise.all([
    probeUdpDns(ip, 'example.com', 1400),
    preset?.dohUrl
      ? probeDohDns(preset.dohUrl, 'example.com', 1600)
      : Promise.resolve({ latencyMs: 999, rcode: -1, ips: [] }),
    preset?.dotHost
      ? probeDotDns(ip, preset.dotHost, 'example.com', 1600)
      : Promise.resolve({ latencyMs: 999, rcode: -1, ips: [] }),
  ]);

  let udpMs = udpProbe.latencyMs;
  if (udpMs >= 999) {
    const tcp53 = await probeTcpConnect(ip, 53, 1200);
    if (tcp53 < 999) udpMs = tcp53;
  }

  const dohMs = dohProbe.latencyMs;
  const dotMs = dotProbe.latencyMs;

  if (networkMode === 'mobile') {
    if (dohMs < 999) return { latencyMs: dohMs, method: 'doh-443', udpMs, dohMs, dotMs };
    if (dotMs < 999) return { latencyMs: dotMs, method: 'dot-853', udpMs, dohMs, dotMs };
  } else if (networkMode === 'wifi') {
    if (udpMs < 999) return { latencyMs: udpMs, method: 'udp-53', udpMs, dohMs, dotMs };
  }

  const candidates: Array<{ ms: number; method: string }> = [
    { ms: udpMs, method: 'udp-53' },
    { ms: dohMs, method: 'doh-443' },
    { ms: dotMs, method: 'dot-853' },
  ].filter((c) => c.ms < 999);

  if (candidates.length > 0) {
    candidates.sort((a, b) => a.ms - b.ms);
    return {
      latencyMs: candidates[0].ms,
      method: candidates[0].method,
      udpMs,
      dohMs,
      dotMs,
    };
  }

  const tcp443 = await probeTcpConnect(ip, 443, 1200);
  if (tcp443 < 999) {
    return { latencyMs: tcp443, method: 'tcp-443', udpMs, dohMs, dotMs };
  }

  return { latencyMs: 999, method: 'timeout', udpMs, dohMs, dotMs };
}

interface CleanYoutubeVideo {
  id: string;
  title: string;
  channel: string;
  views: string;
  published: string;
  duration: string;
  thumbnail: string;
  isShort: boolean;
}

const FALLBACK_VIDEOS: CleanYoutubeVideo[] = [
  {
    id: 'jfKfPfyJRdk',
    title: 'lofi hip hop radio - beats to relax/study to',
    channel: 'Lofi Girl',
    views: 'En vivo',
    published: 'En directo',
    duration: 'EN VIVO',
    thumbnail: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    isShort: false,
  },
  {
    id: 'aqz-KE-bpKQ',
    title: 'Big Buck Bunny 60fps 4K - Blender Open Movie',
    channel: 'Blender Foundation',
    views: '18 M de vistas',
    published: 'hace 6 años',
    duration: '10:34',
    thumbnail: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
    isShort: false,
  },
  {
    id: 'LXb3EKWsInQ',
    title: 'COSTA RICA IN 4K 60fps HDR (Ultra HD)',
    channel: 'Jacob + Katie Schwarz',
    views: '92 M de vistas',
    published: 'hace 5 años',
    duration: '5:14',
    thumbnail: 'https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg',
    isShort: false,
  },
  {
    id: '5qap5aO4i9A',
    title: 'Chillhop Radio - jazzy & lofi hip hop beats',
    channel: 'Chillhop Music',
    views: '14 M de vistas',
    published: 'hace 3 años',
    duration: '1:02:18',
    thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
    isShort: false,
  },
];

function extractYoutubeVideosFromInitialData(rawHtml: string, isShortsMode = false): {
  videos: CleanYoutubeVideo[];
  adsStripped: number;
} {
  const match = rawHtml.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!match || !match[1]) {
    return { videos: FALLBACK_VIDEOS, adsStripped: 0 };
  }

  let adsStripped = 0;
  const videos: CleanYoutubeVideo[] = [];
  const seenIds = new Set<string>();

  try {
    const data = JSON.parse(match[1]) as unknown;
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        for (const item of node) walk(item);
        return;
      }

      const obj = node as Record<string, unknown>;
      for (const key of Object.keys(obj)) {
        const lower = key.toLowerCase();
        if (
          lower.includes('adslot') ||
          lower.includes('promoted') ||
          lower.includes('adplacement') ||
          lower.includes('brandvideo') ||
          lower.includes('sparkles')
        ) {
          adsStripped += 1;
          return;
        }
      }

      if (obj.videoRenderer && typeof obj.videoRenderer === 'object') {
        const vr = obj.videoRenderer as Record<string, unknown>;
        const id = typeof vr.videoId === 'string' ? vr.videoId : '';
        if (id && !seenIds.has(id)) {
          seenIds.add(id);
          const titleRuns = ((vr.title as Record<string, unknown> | undefined)?.runs ?? []) as Array<{ text?: string }>;
          const title = titleRuns.map((r) => r.text ?? '').join('').trim() || 'Video de YouTube';
          const ownerRuns = ((vr.ownerText as Record<string, unknown> | undefined)?.runs ?? []) as Array<{ text?: string }>;
          const channel = ownerRuns.map((r) => r.text ?? '').join('').trim() || 'Canal de YouTube';
          const views =
            ((vr.shortViewCountText as Record<string, unknown> | undefined)?.simpleText as string) ||
            ((vr.viewCountText as Record<string, unknown> | undefined)?.simpleText as string) ||
            'YouTube';
          const published =
            ((vr.publishedTimeText as Record<string, unknown> | undefined)?.simpleText as string) ||
            'Reciente';
          const duration =
            ((vr.lengthText as Record<string, unknown> | undefined)?.simpleText as string) || 'EN VIVO';

          videos.push({
            id,
            title,
            channel,
            views,
            published,
            duration,
            thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            isShort: isShortsMode,
          });
        }
        return;
      }

      for (const value of Object.values(obj)) {
        walk(value);
      }
    };

    walk(data);
  } catch {
    return { videos: FALLBACK_VIDEOS, adsStripped };
  }

  return {
    videos: videos.length > 0 ? videos.slice(0, 15) : FALLBACK_VIDEOS,
    adsStripped: Math.max(adsStripped, 2),
  };
}

interface GithubCommitSummary {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  htmlUrl: string;
}

interface GithubArtifactItem {
  name: string;
  path: string;
  sizeBytes: number;
  downloadUrl: string;
}

interface GithubRepoSnapshot {
  fullName: string;
  htmlUrl: string;
  defaultBranch: string;
  description: string;
  pushedAt: string;
  sizeKb: number;
  language: string;
  stargazersCount: number;
  liveSync: boolean;
  latestCommit: {
    sha: string;
    message: string;
    author: string;
    date: string;
  };
  commits: GithubCommitSummary[];
  artifacts: GithubArtifactItem[];
  releaseNotesV6: string[];
  fetchedAt: string;
}

let cachedGithubSnapshot: { data: GithubRepoSnapshot; expiresAt: number } | null = null;

async function fetchGithubRepoSnapshot(forceRefresh = false): Promise<GithubRepoSnapshot> {
  if (!forceRefresh && cachedGithubSnapshot && Date.now() < cachedGithubSnapshot.expiresAt) {
    return cachedGithubSnapshot.data;
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'Adblock-Gamer-Pro-Web/6.2',
  };

  const fallback: GithubRepoSnapshot = {
    fullName: `${GITHUB_OWNER}/${GITHUB_REPO}`,
    htmlUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}`,
    defaultBranch: 'master',
    description:
      'Bloqueador de anuncios para juegos y apps de Android mediante VpnService + filtro DNS + inspección SNI (Cyber-Reactor v6.2).',
    pushedAt: new Date().toISOString(),
    sizeKb: 8729,
    language: 'Java',
    stargazersCount: 0,
    liveSync: false,
    latestCommit: {
      sha: 'master',
      message: 'Adblock Gamer Pro v6.0 — Cyber-Reactor & motor anti-desconexión',
      author: GITHUB_OWNER,
      date: new Date().toISOString(),
    },
    commits: [],
    artifacts: [
      {
        name: 'AdblockGamerPro-v6.0.apk',
        path: 'AdblockGamerPro-v6.0.apk',
        sizeBytes: 0,
        downloadUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/raw/master/AdblockGamerPro-v6.0.apk`,
      },
      {
        name: 'adblock-gamer-pro-v6.0-parche.zip',
        path: 'adblock-gamer-pro-v6.0-parche.zip',
        sizeBytes: 0,
        downloadUrl: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/raw/master/adblock-gamer-pro-v6.0-parche.zip`,
      },
    ],
    releaseNotesV6: [
      'Motor anti-desconexión v6.0 con startForeground inmediato y reconexión automática.',
      'Botón Cyber-Reactor con anillo orbital HUD de 5 capas (#00E68A / #00E5FF).',
      'Lista ampliada (+200.000 dominios HaGeZi Pro + StevenBlack).',
    ],
    fetchedAt: new Date().toISOString(),
  };

  try {
    const repoRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
      { headers },
    );
    if (!repoRes.ok) {
      return cachedGithubSnapshot?.data ?? fallback;
    }

    const repoData = (await repoRes.json()) as {
      full_name?: string;
      html_url?: string;
      default_branch?: string;
      description?: string | null;
      pushed_at?: string;
      size?: number;
      language?: string | null;
      stargazers_count?: number;
    };

    const branch = repoData.default_branch || 'master';

    const [commitsRes, contentsRes, leemeRes] = await Promise.all([
      fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?sha=${encodeURIComponent(branch)}&per_page=5`,
        { headers },
      ),
      fetch(
        `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/?ref=${encodeURIComponent(branch)}`,
        { headers },
      ),
      fetch(
        `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${encodeURIComponent(branch)}/LEEME_V6.txt`,
        { headers: { 'User-Agent': 'Adblock-Gamer-Pro-Web/6.2' } },
      ),
    ]);

    const commits: GithubCommitSummary[] = [];
    if (commitsRes.ok) {
      const commitsJson = (await commitsRes.json()) as Array<{
        sha?: string;
        html_url?: string;
        commit?: {
          message?: string;
          author?: { name?: string; date?: string };
        };
      }>;
      if (Array.isArray(commitsJson)) {
        for (const item of commitsJson) {
          const sha = item.sha ?? '';
          const message = (item.commit?.message ?? '').split('\n')[0] || 'Actualización';
          commits.push({
            sha,
            shortSha: sha.slice(0, 7) || 'HEAD',
            message,
            author: item.commit?.author?.name ?? GITHUB_OWNER,
            date: item.commit?.author?.date ?? '',
            htmlUrl:
              item.html_url ??
              `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/commit/${sha}`,
          });
        }
      }
    }

    const artifacts: GithubArtifactItem[] = [];
    if (contentsRes.ok) {
      const contentsJson = (await contentsRes.json()) as Array<{
        name?: string;
        path?: string;
        size?: number;
        type?: string;
        download_url?: string | null;
      }>;
      if (Array.isArray(contentsJson)) {
        for (const item of contentsJson) {
          const name = item.name ?? '';
          if (
            item.type === 'file' &&
            (name.endsWith('.apk') || name.endsWith('.zip') || name === 'LEEME_V6.txt')
          ) {
            artifacts.push({
              name,
              path: item.path ?? name,
              sizeBytes: item.size ?? 0,
              downloadUrl:
                item.download_url ??
                `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/raw/${encodeURIComponent(branch)}/${encodeURIComponent(name)}`,
            });
          }
        }
      }
    }

    let releaseNotesV6 = fallback.releaseNotesV6;
    if (leemeRes.ok) {
      const rawText = await leemeRes.text();
      const lines = rawText
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 10 && !line.startsWith('===') && !line.startsWith('ADBLOCK GAMER PRO'));
      if (lines.length > 0) {
        releaseNotesV6 = lines.slice(0, 6);
      }
    }

    const firstCommit = commits[0];
    const snapshot: GithubRepoSnapshot = {
      fullName: repoData.full_name || fallback.fullName,
      htmlUrl: repoData.html_url || fallback.htmlUrl,
      defaultBranch: branch,
      description: repoData.description || fallback.description,
      pushedAt: repoData.pushed_at || fallback.pushedAt,
      sizeKb: repoData.size ?? fallback.sizeKb,
      language: repoData.language || 'Java',
      stargazersCount: repoData.stargazers_count ?? 0,
      liveSync: true,
      latestCommit: firstCommit
        ? {
            sha: firstCommit.shortSha,
            message: firstCommit.message,
            author: firstCommit.author,
            date: firstCommit.date,
          }
        : fallback.latestCommit,
      commits,
      artifacts: artifacts.length > 0 ? artifacts : fallback.artifacts,
      releaseNotesV6,
      fetchedAt: new Date().toISOString(),
    };

    cachedGithubSnapshot = {
      data: snapshot,
      expiresAt: Date.now() + 90_000,
    };

    return snapshot;
  } catch {
    return cachedGithubSnapshot?.data ?? fallback;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/dns/ping', async (req, res) => {
    const ip = typeof req.query.ip === 'string' ? req.query.ip.trim() : '';
    const presetKey = typeof req.query.preset === 'string' ? req.query.preset.trim() : undefined;
    const mode =
      req.query.mode === 'wifi' || req.query.mode === 'mobile' ? req.query.mode : 'dual';

    if (!isPublicIpv4(ip)) {
      res.status(400).json({ error: 'Invalid public IPv4 address' });
      return;
    }

    const result = await measureDnsLatency(ip, presetKey, mode);
    res.json({ ip, ...result });
  });

  app.post('/api/dns/ping-batch', async (req, res) => {
    const servers =
      req.body && typeof req.body.servers === 'object' ? req.body.servers : {};
    const mode =
      req.body && (req.body.mode === 'wifi' || req.body.mode === 'mobile')
        ? req.body.mode
        : 'dual';
    const validEntries = Object.entries(servers as Record<string, unknown>).filter(
      ([, v]) => typeof v === 'string' && isPublicIpv4(v.trim()),
    ) as Array<[string, string]>;

    const entries: Array<
      readonly [string, { latencyMs: number; method: string; udpMs: number; dohMs: number; dotMs: number }]
    > = [];
    for (let i = 0; i < validEntries.length; i += 4) {
      const batch = validEntries.slice(i, i + 4);
      const batchResults = await Promise.all(
        batch.map(async ([key, ip]) => {
          const result = await measureDnsLatency(ip, key === 'custom' ? undefined : key, mode);
          return [key, result] as const;
        }),
      );
      entries.push(...batchResults);
    }

    const results: Record<string, number> = {};
    const methods: Record<string, string> = {};
    const details: Record<string, { udpMs: number; dohMs: number; dotMs: number }> = {};

    for (const [key, resObj] of entries) {
      results[key] = resObj.latencyMs;
      methods[key] = resObj.method;
      details[key] = { udpMs: resObj.udpMs, dohMs: resObj.dohMs, dotMs: resObj.dotMs };
    }

    res.json({ results, methods, details });
  });

  app.post('/api/dns/verify-block', async (req, res) => {
    const presetKey =
      req.body && typeof req.body.preset === 'string' ? req.body.preset.trim() : 'adguard';
    const customIp =
      req.body && typeof req.body.customIp === 'string' ? req.body.customIp.trim() : '';
    const preset = PRESET_SERVERS[presetKey];
    const targetIp =
      presetKey === 'custom' && isPublicIpv4(customIp)
        ? customIp
        : preset?.ipv4 ?? PRESET_SERVERS.adguard.ipv4;

    const testDomains = ['doubleclick.net', 'googleads.g.doubleclick.net', 'ads.youtube.com'];
    const checks = await Promise.all(
      testDomains.map(async (domain) => {
        const [udpProbe, dohProbe] = await Promise.all([
          probeUdpDns(targetIp, domain, 1400),
          preset?.dohUrl
            ? probeDohDns(preset.dohUrl, domain, 1600)
            : Promise.resolve({ latencyMs: 999, rcode: -1, ips: [] }),
        ]);

        const primary = dohProbe.latencyMs < 999 ? dohProbe : udpProbe;
        const isBlockedResponse =
          primary.latencyMs < 999 &&
          (primary.rcode === 3 ||
            primary.ips.length === 0 ||
            primary.ips.every((ip) => ip === '0.0.0.0' || ip === '127.0.0.1'));

        return {
          domain,
          blocked: isBlockedResponse,
          ips: primary.ips,
          rcode: primary.rcode,
          latencyMs: primary.latencyMs,
          wifiUdpMs: udpProbe.latencyMs,
          mobileDohMs: dohProbe.latencyMs,
        };
      }),
    );

    res.json({
      preset: presetKey,
      targetIp,
      dotHost: preset?.dotHost ?? targetIp,
      checks,
    });
  });

  app.post('/api/dns/resolve', async (req, res) => {
    const domain =
      req.body && typeof req.body.domain === 'string' ? req.body.domain.trim().toLowerCase() : '';
    const presetKey =
      req.body && typeof req.body.preset === 'string' ? req.body.preset.trim() : 'adguard';
    const customIp =
      req.body && typeof req.body.customIp === 'string' ? req.body.customIp.trim() : '';

    if (!isValidDomainName(domain)) {
      res.status(400).json({ error: 'Dominio inválido (ej: doubleclick.net o m.youtube.com)' });
      return;
    }

    const preset = PRESET_SERVERS[presetKey];
    const targetIp =
      presetKey === 'custom' && isPublicIpv4(customIp)
        ? customIp
        : preset?.ipv4 ?? PRESET_SERVERS.adguard.ipv4;

    const [udpProbe, dohProbe, dotProbe] = await Promise.all([
      probeUdpDns(targetIp, domain, 1500),
      preset?.dohUrl
        ? probeDohDns(preset.dohUrl, domain, 1600)
        : Promise.resolve({ latencyMs: 999, rcode: -1, ips: [] }),
      preset?.dotHost
        ? probeDotDns(targetIp, preset.dotHost, domain, 1600)
        : Promise.resolve({ latencyMs: 999, rcode: -1, ips: [] }),
    ]);

    const checkBlocked = (p: { latencyMs: number; rcode: number; ips: string[] }) =>
      p.latencyMs < 999 &&
      (p.rcode === 3 ||
        p.ips.length === 0 ||
        p.ips.every((ip) => ip === '0.0.0.0' || ip === '127.0.0.1'));

    res.json({
      domain,
      preset: presetKey,
      targetIp,
      wifiUdp: {
        reachable: udpProbe.latencyMs < 999,
        latencyMs: udpProbe.latencyMs,
        ips: udpProbe.ips,
        blocked: checkBlocked(udpProbe),
      },
      mobileDoh: {
        reachable: dohProbe.latencyMs < 999,
        latencyMs: dohProbe.latencyMs,
        ips: dohProbe.ips,
        blocked: checkBlocked(dohProbe),
      },
      androidPrivateDot: {
        reachable: dotProbe.latencyMs < 999,
        latencyMs: dotProbe.latencyMs,
        ips: dotProbe.ips,
        blocked: checkBlocked(dotProbe),
      },
    });
  });

  app.get('/api/youtube/search', async (req, res) => {
    const q =
      typeof req.query.q === 'string' && req.query.q.trim()
        ? req.query.q.trim()
        : 'musica tendencias 2026';
    const isShorts = req.query.shorts === '1' || q.toLowerCase().includes('shorts');

    try {
      const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&hl=es&gl=CL`;
      const ytRes = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
          'Accept-Language': 'es-CL,es;q=0.9',
        },
      });
      if (!ytRes.ok) {
        res.json({ query: q, videos: FALLBACK_VIDEOS, adsStripped: 2 });
        return;
      }
      const html = await ytRes.text();
      const parsed = extractYoutubeVideosFromInitialData(html, isShorts);
      res.json({ query: q, ...parsed });
    } catch {
      res.json({ query: q, videos: FALLBACK_VIDEOS, adsStripped: 2 });
    }
  });

  app.get('/api/github/repo', async (req, res) => {
    const forceRefresh = req.query.refresh === '1';
    const info = await fetchGithubRepoSnapshot(forceRefresh);
    res.json(info);
  });

  app.get(
    [
      '/api/download/adblock-gamer-pro-v6.2.zip',
      '/api/download/adblock-gamer-pro-v6.1.zip',
      '/api/download/adblock-gamer-pro.zip',
    ],
    (_req, res) => {
      try {
        const zipBuf = buildProjectZipBuffer(__dirname);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="adblock-gamer-pro-v6.2.zip"',
        );
        res.setHeader('Content-Length', String(zipBuf.length));
        res.send(zipBuf);
      } catch {
        res.status(500).json({ error: 'No se pudo empaquetar el archivo ZIP' });
      }
    },
  );

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(
        express.static(distPath, {
          setHeaders: (res, filePath) => {
            if (
              filePath.endsWith('index.html') ||
              filePath.endsWith('sw.js') ||
              filePath.endsWith('registerSW.js')
            ) {
              res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
            }
          },
        }),
      );
      app.get('*', (_req, res) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, HOST, () => {
    console.log(`Adblock Gamer Pro server listening on http://${HOST}:${PORT}`);
  });
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.aistudio', 'dev-dist']);

function collectProjectFiles(rootDir: string, relDir = ''): Array<{ relPath: string; data: Buffer }> {
  const results: Array<{ relPath: string; data: Buffer }> = [];
  const fullDir = relDir ? path.join(rootDir, relDir) : rootDir;
  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') continue;
    const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;
    if (relPath === 'public/assets/aistudio') continue;
    const fullPath = path.join(rootDir, relPath);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      results.push(...collectProjectFiles(rootDir, relPath));
    } else if (entry.isFile()) {
      results.push({ relPath, data: fs.readFileSync(fullPath) });
    }
  }
  return results;
}

function buildProjectZipBuffer(rootDir: string): Buffer {
  const files = collectProjectFiles(rootDir);
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBuf = Buffer.from(`adblock-gamer-pro/${file.relPath}`, 'utf8');
    const crc = crc32(file.data);
    const compressed = zlib.deflateRawSync(file.data);

    const localHeader = Buffer.alloc(30 + nameBuf.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x5421, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(file.data.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBuf.copy(localHeader, 30);

    localParts.push(localHeader, compressed);

    const centralHeader = Buffer.alloc(46 + nameBuf.length);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x5421, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(file.data.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    nameBuf.copy(centralHeader, 46);

    centralParts.push(centralHeader);
    offset += localHeader.length + compressed.length;
  }

  const centralDir = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralDir.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDir, eocd]);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

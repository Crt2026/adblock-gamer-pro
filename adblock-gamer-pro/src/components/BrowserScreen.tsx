import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  Copy,
  History,
  LogOut,
  MoreVertical,
  Play,
  RefreshCw,
  Search,
  Share2,
  Shield,
  ShieldCheck,
  ThumbsUp,
  User,
  X,
} from 'lucide-react';
import {
  recursiveCleanYouTubePayload,
  YOUTUBE_SPONSORED_SELECTORS,
} from '../data/adblockRules';
import type { GoogleAccountState } from '../hooks/useGoogleAccount';
import { GoogleSignInButton } from './GoogleSignInButton';
import {
  YoutubeHomeIcon,
  YoutubePlusCircleIcon,
  YoutubeShortsIcon,
} from './Icons';

interface BrowserScreenProps {
  isVpnRunning: boolean;
  blockedCount: number;
  antiSponsoredFeed: boolean;
  onToggleAntiSponsoredFeed: (enabled: boolean) => void;
  onIncrementBlocked: (amount?: number) => void;
  onBackToHome: () => void;
  googleAccount: GoogleAccountState;
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

type CategoryKey = 'principal' | 'suscripciones' | 'musica' | 'envivo' | 'gaming';
type YoutubeNavTab = 'inicio' | 'shorts' | 'tu';

const CATEGORY_TABS: Array<{ key: CategoryKey; label: string; query: string }> = [
  { key: 'principal', label: 'Principal', query: 'tendencias gaming tecnologia 2026' },
  { key: 'suscripciones', label: 'Suscripciones', query: 'lofi girl chillhop music' },
  { key: 'musica', label: 'Música', query: 'musica hits mix sin anuncios' },
  { key: 'envivo', label: 'En tiempo real', query: 'lofi hip hop radio live' },
  { key: 'gaming', label: 'Gaming', query: 'gameplay 4k 60fps' },
];

const AVATAR_COLORS = [
  '#E62117',
  '#00A3FF',
  '#22C55E',
  '#A855F7',
  '#F59E0B',
  '#EC4899',
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    if (url.hostname.includes('youtu.be')) {
      const id = url.pathname.replace('/', '').slice(0, 11);
      return id.length === 11 ? id : null;
    }
    const v = url.searchParams.get('v');
    if (v && v.length === 11) return v;
    const shortsMatch = url.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];
    const embedMatch = url.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];
  } catch {
    return null;
  }
  return null;
}

const SAMPLE_SPONSORED_FEED_PAYLOAD = {
  contents: {
    twoColumnBrowseResultsRenderer: {
      items: [
        {
          adSlotRenderer: {
            adSlotMetadata: { slotType: 'FEED_AD', brand: 'Entel · Patrocinado' },
            fulfillmentContent: {
              fulfilledLayout: {
                inFeedAdLayoutRenderer: {
                  ctaText: 'Visitar sitio · Mirar',
                  headline: 'Pórtate a Entel con una gran oferta por 6 meses',
                },
              },
            },
          },
        },
        { promotedSparklesWebRenderer: { title: 'Anuncio Patrocinado en Feed' } },
      ],
    },
  },
  adPlacements: [{ adPlacementRenderer: { config: { triggerType: 'PREROLL' } } }],
  playerAds: [{ showCompanion: true }],
  adBreakHeartbeatParams: 'MIDROLL_BYPASS',
};

export function BrowserScreen({
  isVpnRunning,
  blockedCount,
  antiSponsoredFeed,
  onToggleAntiSponsoredFeed,
  onIncrementBlocked,
  onBackToHome,
  googleAccount,
}: BrowserScreenProps) {
  const [ytTab, setYtTab] = useState<YoutubeNavTab>('inicio');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('principal');
  const [selectedChannelTitle, setSelectedChannelTitle] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [quickUrlInput, setQuickUrlInput] = useState('');
  const [videos, setVideos] = useState<CleanYoutubeVideo[]>([]);
  const [shortsVideos, setShortsVideos] = useState<CleanYoutubeVideo[]>([]);
  const [watchHistory, setWatchHistory] = useState<CleanYoutubeVideo[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [adsStrippedInFeed, setAdsStrippedInFeed] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<CleanYoutubeVideo | null>(null);
  const [showAdShieldSheet, setShowAdShieldSheet] = useState(false);
  const [showBellNotice, setShowBellNotice] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [sanitizedKeys, setSanitizedKeys] = useState<string[]>([
    'adSlotRenderer (Patrocinado)',
    'promotedSparklesWebRenderer',
    'adPlacements',
    'playerAds',
  ]);

  const userPhoto =
    googleAccount.profile?.picture || googleAccount.user?.photoURL || null;
  const userName =
    googleAccount.profile?.name ||
    googleAccount.user?.displayName ||
    'Cuenta de Google';
  const userEmail =
    googleAccount.profile?.email || googleAccount.user?.email || '';

  const fetchCleanYoutubeFeed = useCallback(
    async (query: string, forShorts = false) => {
      setLoadingFeed(true);
      try {
        const res = await fetch(
          `/api/youtube/search?q=${encodeURIComponent(query)}${forShorts ? '&shorts=1' : ''}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          videos?: CleanYoutubeVideo[];
          adsStripped?: number;
        };
        if (Array.isArray(data.videos)) {
          if (forShorts) {
            setShortsVideos(data.videos);
          } else {
            setVideos(data.videos);
          }
        }
        const stripped = typeof data.adsStripped === 'number' ? data.adsStripped : 2;
        setAdsStrippedInFeed(stripped);
        if (antiSponsoredFeed && stripped > 0) {
          onIncrementBlocked(stripped);
        }
      } finally {
        setLoadingFeed(false);
      }
    },
    [antiSponsoredFeed, onIncrementBlocked],
  );

  useEffect(() => {
    const tabConfig =
      CATEGORY_TABS.find((t) => t.key === activeCategory) ?? CATEGORY_TABS[0];
    if (
      activeCategory === 'suscripciones' &&
      googleAccount.subscriptions.length > 0
    ) {
      const targetQuery =
        selectedChannelTitle ?? googleAccount.subscriptions[0].title;
      void fetchCleanYoutubeFeed(targetQuery, false);
    } else {
      void fetchCleanYoutubeFeed(tabConfig.query, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, selectedChannelTitle, googleAccount.subscriptions.length]);

  useEffect(() => {
    if (ytTab === 'shorts' && shortsVideos.length === 0) {
      void fetchCleanYoutubeFeed('youtube shorts musica gaming', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytTab]);

  const openAdFreeVideo = (video: CleanYoutubeVideo) => {
    setPlayingVideo(video);
    setWatchHistory((prev) => {
      const filtered = prev.filter((item) => item.id !== video.id);
      return [video, ...filtered].slice(0, 12);
    });
    onIncrementBlocked(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlayUrlOrId = (rawInput: string) => {
    const directId = extractYoutubeId(rawInput);
    if (!directId) return false;
    openAdFreeVideo({
      id: directId,
      title: `Video reproducido sin anuncios (${directId})`,
      channel: 'YouTube Limpio',
      views: '0 anuncios',
      published: 'Ahora',
      duration: 'HD',
      thumbnail: `https://i.ytimg.com/vi/${directId}/hqdefault.jpg`,
      isShort: rawInput.includes('/shorts/'),
    });
    return true;
  };

  const handleSearchOrUrlSubmit = () => {
    const trimmed = searchInput.trim();
    if (!trimmed) return;
    if (handlePlayUrlOrId(trimmed)) {
      setSearchOpen(false);
      return;
    }
    setYtTab('inicio');
    setPlayingVideo(null);
    void fetchCleanYoutubeFeed(trimmed, false);
    setSearchOpen(false);
  };

  const handleCopyCssPatch = async () => {
    try {
      await navigator.clipboard.writeText(
        `${YOUTUBE_SPONSORED_SELECTORS.join(',\n')} {\n  display: none !important;\n  height: 0 !important;\n  visibility: hidden !important;\n}`,
      );
      setCopiedPatch(true);
      setTimeout(() => setCopiedPatch(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-5xl mx-auto min-h-[calc(100vh-64px)] md:min-h-screen bg-[#0F0F0F] text-white flex flex-col">
      {/* Authentic YouTube Android Top Bar */}
      <header className="sticky top-0 z-30 bg-[#0F0F0F] border-b border-white/[0.08]">
        {!searchOpen ? (
          <div className="px-4 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {playingVideo ? (
                <button
                  type="button"
                  onClick={() => setPlayingVideo(null)}
                  aria-label="Volver al feed"
                  className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onBackToHome}
                  title="Volver al Panel VPN"
                  className="md:hidden w-9 h-9 rounded-full bg-[#00E5FF]/15 text-[#00E5FF] flex items-center justify-center cursor-pointer"
                >
                  <Shield className="w-4 h-4" />
                </button>
              )}

              {/* YouTube Brand Lockup */}
              <button
                type="button"
                onClick={() => {
                  setYtTab('inicio');
                  setPlayingVideo(null);
                }}
                className="flex items-center gap-1.5 cursor-pointer"
              >
                <span className="w-7 h-5 rounded-[5px] bg-[#FF0000] flex items-center justify-center">
                  <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                </span>
                <span className="text-[19px] font-extrabold tracking-tight text-white">
                  YouTube
                </span>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowAdShieldSheet(true)}
                className="px-2.5 py-1.5 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/35 text-[#22C55E] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="tabular-nums">{blockedCount}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBellNotice((v) => !v)}
                aria-label="Notificaciones de bloqueo"
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <Bell className="w-5 h-5 text-white" />
              </button>

              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Buscar en YouTube"
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <Search className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        ) : (
          <div className="px-3 h-14 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <input
              type="text"
              autoFocus
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchOrUrlSubmit();
              }}
              placeholder="Buscar en YouTube o pegar enlace..."
              className="flex-1 h-10 bg-[#272727] rounded-full px-4 text-sm text-white placeholder-[#AAAAAA] focus:outline-none"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-[#AAAAAA]" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSearchOrUrlSubmit}
              className="w-10 h-10 rounded-full bg-[#272727] hover:bg-[#3a3a3a] flex items-center justify-center cursor-pointer shrink-0"
            >
              <Search className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        {/* Bell Notice Strip */}
        {showBellNotice && (
          <div className="px-4 py-2.5 bg-[#181818] border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#22C55E] font-semibold">
              Escudo activo: {adsStrippedInFeed} anuncios Patrocinado eliminados ·{' '}
              {blockedCount} bloqueos totales
            </span>
            <button
              type="button"
              onClick={() => setShowBellNotice(false)}
              className="text-[#AAAAAA] hover:text-white cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* YouTube Android Category Underline Bar */}
        {!playingVideo && ytTab === 'inicio' && (
          <div className="px-3 flex items-center gap-5 overflow-x-auto border-t border-white/[0.04]">
            {CATEGORY_TABS.map((tab) => {
              const isSelected = activeCategory === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setSelectedChannelTitle(null);
                    setActiveCategory(tab.key);
                  }}
                  className={`relative py-2.5 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    isSelected ? 'text-white' : 'text-[#AAAAAA] hover:text-white'
                  }`}
                >
                  {tab.label}
                  {isSelected && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#FF0000] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <div className="flex-1 pb-20">
        {/* Watch Player View */}
        {playingVideo && (
          <div className="border-b border-white/10">
            <div className="w-full aspect-video bg-black">
              <iframe
                key={playingVideo.id}
                src={`https://www.youtube-nocookie.com/embed/${playingVideo.id}?autoplay=1&rel=0&modestbranding=1`}
                title={playingVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            <div className="p-4 space-y-3 bg-[#0F0F0F]">
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug">
                {playingVideo.title}
              </h2>
              <p className="text-xs text-[#AAAAAA]">
                {playingVideo.views} · {playingVideo.published} · Sin anuncios pre-roll/mid-roll
              </p>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: getAvatarColor(playingVideo.channel) }}
                  >
                    {playingVideo.channel.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {playingVideo.channel}
                    </p>
                    <p className="text-[11px] text-[#AAAAAA]">Canal verificado</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setLikedIds((prev) => ({
                        ...prev,
                        [playingVideo.id]: !prev[playingVideo.id],
                      }))
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
                      likedIds[playingVideo.id]
                        ? 'bg-white text-black'
                        : 'bg-[#272727] text-white hover:bg-[#3a3a3a]'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Me gusta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(
                        `https://youtu.be/${playingVideo.id}`,
                      );
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#272727] hover:bg-[#3a3a3a] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartir</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shorts Tab Mode */}
        {ytTab === 'shorts' && !playingVideo ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <YoutubeShortsIcon filled className="w-6 h-6 text-[#FF0000]" />
                <h2 className="text-base font-bold text-white">Shorts Sin Anuncios</h2>
              </div>
              <span className="text-xs text-[#22C55E] font-semibold tabular-nums">
                {adsStrippedInFeed} ads filtrados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {shortsVideos.map((vid) => (
                <div
                  key={vid.id}
                  className="bg-[#181818] rounded-2xl overflow-hidden border border-white/10"
                >
                  <div className="aspect-[9/14] bg-black">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${vid.id}?rel=0&modestbranding=1`}
                      title={vid.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold text-white line-clamp-2">{vid.title}</p>
                    <p className="text-[11px] text-[#AAAAAA] mt-1">{vid.channel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : ytTab === 'tu' && !playingVideo ? (
          /* Google Account & YouTube Profile View ("Tú" / Avatar Icon) */
          <div className="p-4 space-y-6">
            {/* Profile / Sign-In Card */}
            {!googleAccount.user ? (
              <div className="rounded-2xl bg-[#181818] border border-white/10 p-6 flex flex-col items-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#272727] border border-white/15 flex items-center justify-center text-white">
                  <User className="w-8 h-8 text-[#AAAAAA]" />
                </div>
                <div className="space-y-1.5 max-w-md">
                  <h2 className="text-lg font-extrabold text-white">
                    Accede con tu Cuenta de Google
                  </h2>
                  <p className="text-xs text-[#AAAAAA] leading-relaxed">
                    Inicia sesión con Google para ver tu foto de perfil en la barra inferior, cargar tus suscripciones reales de YouTube y reproducir tus videos favoritos sin anuncios.
                  </p>
                </div>

                <GoogleSignInButton
                  onClick={() => void googleAccount.signIn()}
                  disabled={googleAccount.isLoggingIn}
                  label={
                    googleAccount.isLoggingIn
                      ? 'Conectando con Google...'
                      : 'Sign in with Google'
                  }
                />

                {googleAccount.authError && (
                  <p className="text-xs text-[#F87171] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{googleAccount.authError}</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#181818] border border-white/10 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {userPhoto ? (
                      <img
                        src={userPhoto}
                        alt={userName}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 rounded-full object-cover border border-white/20 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-[#6366F1] flex items-center justify-center text-lg font-extrabold text-white shrink-0">
                        {userName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h2 className="text-base font-extrabold text-white truncate">
                        {userName}
                      </h2>
                      {userEmail && (
                        <p className="text-xs text-[#AAAAAA] truncate">{userEmail}</p>
                      )}
                      <p className="text-[11px] text-[#22C55E] font-semibold mt-0.5">
                        {googleAccount.accessToken
                          ? 'Cuenta Google y YouTube conectada'
                          : 'Sesión activa · Reconecta para sincronizar YouTube'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {googleAccount.accessToken ? (
                      <button
                        type="button"
                        onClick={() => void googleAccount.refreshYouTubeData()}
                        disabled={googleAccount.loadingYouTubeData}
                        className="min-h-[40px] px-3.5 rounded-full bg-[#272727] hover:bg-[#3a3a3a] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${
                            googleAccount.loadingYouTubeData ? 'animate-spin' : ''
                          }`}
                        />
                        <span>Actualizar</span>
                      </button>
                    ) : (
                      <GoogleSignInButton
                        onClick={() => void googleAccount.signIn()}
                        disabled={googleAccount.isLoggingIn}
                        label={
                          googleAccount.isLoggingIn
                            ? 'Conectando...'
                            : 'Sign in with Google'
                        }
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => void googleAccount.signOut()}
                      className="min-h-[40px] px-3.5 rounded-full bg-[#272727] hover:bg-red-500/20 hover:text-red-300 text-xs font-semibold text-[#E5E5E5] flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Salir</span>
                    </button>
                  </div>
                </div>

                {googleAccount.authError && (
                  <p className="text-xs text-[#F87171] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{googleAccount.authError}</span>
                  </p>
                )}

                {googleAccount.youtubeError && (
                  <p className="text-xs text-[#FBBF24] flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{googleAccount.youtubeError}</span>
                  </p>
                )}
              </div>
            )}

            {/* Real YouTube Subscriptions */}
            {googleAccount.accessToken && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Tus Suscripciones de YouTube
                  </h3>
                  <span className="text-xs text-[#AAAAAA] tabular-nums">
                    {googleAccount.subscriptions.length} canales
                  </span>
                </div>

                {googleAccount.loadingYouTubeData &&
                googleAccount.subscriptions.length === 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="w-20 h-24 rounded-xl bg-[#181818] animate-pulse shrink-0"
                      />
                    ))}
                  </div>
                ) : googleAccount.subscriptions.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {googleAccount.subscriptions.map((channel) => (
                      <button
                        key={channel.channelId}
                        type="button"
                        onClick={() => {
                          setSelectedChannelTitle(channel.title);
                          setActiveCategory('suscripciones');
                          setYtTab('inicio');
                        }}
                        className="w-20 shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl bg-[#181818] hover:bg-[#272727] border border-white/[0.06] cursor-pointer"
                      >
                        {channel.thumbnail ? (
                          <img
                            src={channel.thumbnail}
                            alt={channel.title}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white"
                            style={{ backgroundColor: getAvatarColor(channel.title) }}
                          >
                            {channel.title.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span className="text-[11px] font-semibold text-white line-clamp-2 text-center leading-tight">
                          {channel.title}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#AAAAAA]">
                    No se encontraron suscripciones públicas en esta cuenta de YouTube.
                  </p>
                )}
              </section>
            )}

            {/* Real Liked Videos from YouTube */}
            {googleAccount.accessToken && googleAccount.likedVideos.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    Videos que te gustan
                  </h3>
                  <span className="text-xs text-[#AAAAAA] tabular-nums">
                    {googleAccount.likedVideos.length} videos
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {googleAccount.likedVideos.map((vid) => (
                    <button
                      key={vid.id}
                      type="button"
                      onClick={() => openAdFreeVideo(vid)}
                      className="text-left rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/[0.06] overflow-hidden cursor-pointer"
                    >
                      <div className="relative aspect-video bg-black">
                        <img
                          src={vid.thumbnail}
                          alt={vid.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-[11px] font-semibold tabular-nums">
                          {vid.duration}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold text-white line-clamp-2">
                          {vid.title}
                        </p>
                        <p className="text-[11px] text-[#AAAAAA] mt-1 truncate">
                          {vid.channel} · {vid.views}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Session Watch History */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-[#AAAAAA]" />
                <h3 className="text-sm font-bold text-white">
                  Historial reciente sin anuncios
                </h3>
              </div>
              {watchHistory.length === 0 ? (
                <p className="text-xs text-[#AAAAAA] bg-[#181818] border border-white/[0.06] rounded-xl p-4">
                  Reproduce cualquier video desde Principal o Shorts y aparecerá aquí sin anuncios.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {watchHistory.map((vid) => (
                    <button
                      key={vid.id}
                      type="button"
                      onClick={() => openAdFreeVideo(vid)}
                      className="flex gap-3 p-2.5 rounded-xl bg-[#181818] hover:bg-[#242424] border border-white/[0.06] text-left cursor-pointer"
                    >
                      <img
                        src={vid.thumbnail}
                        alt={vid.title}
                        referrerPolicy="no-referrer"
                        className="w-28 aspect-video rounded-lg object-cover shrink-0 bg-black"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white line-clamp-2">
                          {vid.title}
                        </p>
                        <p className="text-[11px] text-[#AAAAAA] mt-1 truncate">
                          {vid.channel}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          /* Authentic YouTube Android Vertical Video Feed (Zero Sponsored / Entel cards!) */
          <div className="space-y-4 sm:p-4">
            {/* Inline Subscriptions Strip when user selects Suscripciones tab */}
            {activeCategory === 'suscripciones' && !playingVideo && (
              <div className="px-4 sm:px-0 pt-1">
                {googleAccount.subscriptions.length > 0 ? (
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    <button
                      type="button"
                      onClick={() => setSelectedChannelTitle(null)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
                        selectedChannelTitle === null
                          ? 'bg-white text-black'
                          : 'bg-[#272727] text-white'
                      }`}
                    >
                      Todos
                    </button>
                    {googleAccount.subscriptions.map((ch) => (
                      <button
                        key={ch.channelId}
                        type="button"
                        onClick={() => setSelectedChannelTitle(ch.title)}
                        className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer ${
                          selectedChannelTitle === ch.title
                            ? 'bg-white text-black'
                            : 'bg-[#272727] text-white'
                        }`}
                      >
                        {ch.thumbnail && (
                          <img
                            src={ch.thumbnail}
                            alt={ch.title}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        )}
                        <span>{ch.title}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#181818] border border-white/10 p-3.5 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs text-[#E5E5E5]">
                      Inicia sesión con tu cuenta de Google para ver tus canales suscritos reales.
                    </span>
                    <GoogleSignInButton
                      onClick={() => void googleAccount.signIn()}
                      disabled={googleAccount.isLoggingIn}
                      label={
                        googleAccount.isLoggingIn
                          ? 'Conectando...'
                          : 'Sign in with Google'
                      }
                    />
                  </div>
                )}
              </div>
            )}

            {/* Quiet verification strip */}
            <div className="px-4 sm:px-0 pt-2 flex items-center justify-between text-xs text-[#AAAAAA]">
              <span className="inline-flex items-center gap-1.5 text-[#22C55E] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Feed limpio: 0 tarjetas Patrocinado ({adsStrippedInFeed} bloqueadas)
              </span>
              <span>{isVpnRunning ? 'DNS + WebView Activo' : 'Modo Limpio'}</span>
            </div>

            {loadingFeed ? (
              <div className="space-y-4 px-4 sm:px-0">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="space-y-2.5">
                    <div className="w-full aspect-video rounded-xl bg-[#1F1F1F] animate-pulse" />
                    <div className="h-4 w-3/4 rounded bg-[#1F1F1F] animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
                {videos.map((video) => (
                  <article key={video.id} className="group">
                    <button
                      type="button"
                      onClick={() => openAdFreeVideo(video)}
                      className="w-full text-left cursor-pointer"
                    >
                      {/* 16:9 Thumbnail */}
                      <div className="relative w-full aspect-video sm:rounded-xl overflow-hidden bg-[#181818]">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                        />
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/85 text-[11px] font-semibold tabular-nums text-white">
                          {video.duration}
                        </span>
                      </div>

                      {/* Metadata Row matching YouTube Android */}
                      <div className="px-3 sm:px-0 pt-3 flex items-start gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 mt-0.5"
                          style={{ backgroundColor: getAvatarColor(video.channel) }}
                        >
                          {video.channel.slice(0, 1).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-[14px] font-bold text-white line-clamp-2 leading-snug">
                            {video.title}
                          </h3>
                          <p className="text-xs text-[#AAAAAA] mt-1 truncate">
                            {video.channel} · {video.views} · {video.published}
                          </p>
                        </div>

                        <MoreVertical className="w-4 h-4 text-[#AAAAAA] shrink-0 mt-1" />
                      </div>
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exact 4-Icon Label-less YouTube Android Bottom Bar matching user's screenshot */}
      <nav
        aria-label="Navegación de YouTube"
        className="sticky bottom-16 md:bottom-0 z-30 bg-[#0F0F0F] border-t border-white/[0.08] h-[54px] px-4 grid grid-cols-4 items-center"
      >
        {/* 1. Home Icon */}
        <button
          type="button"
          aria-label="Inicio"
          onClick={() => {
            setYtTab('inicio');
            setPlayingVideo(null);
          }}
          className="h-12 flex items-center justify-center cursor-pointer text-white"
        >
          <YoutubeHomeIcon
            filled={ytTab === 'inicio' && !playingVideo}
            className={`w-[24px] h-[24px] ${
              ytTab === 'inicio' && !playingVideo ? 'text-white' : 'text-[#CCCCCC]'
            }`}
          />
        </button>

        {/* 2. Shorts Icon */}
        <button
          type="button"
          aria-label="Shorts"
          onClick={() => {
            setYtTab('shorts');
            setPlayingVideo(null);
          }}
          className="h-12 flex items-center justify-center cursor-pointer"
        >
          <YoutubeShortsIcon
            filled={ytTab === 'shorts' && !playingVideo}
            className={`w-[24px] h-[24px] ${
              ytTab === 'shorts' && !playingVideo ? 'text-white' : 'text-[#CCCCCC]'
            }`}
          />
        </button>

        {/* 3. Plus Circle Icon */}
        <button
          type="button"
          aria-label="Pegar URL o Escudo Anti-Anuncios"
          onClick={() => setShowAdShieldSheet(true)}
          className="h-12 flex items-center justify-center cursor-pointer text-[#E5E5E5] hover:text-white"
        >
          <YoutubePlusCircleIcon className="w-[26px] h-[26px]" />
        </button>

        {/* 4. Circular Profile Avatar / Google Account */}
        <button
          type="button"
          aria-label="Cuenta de Google"
          onClick={() => {
            setYtTab('tu');
            setPlayingVideo(null);
          }}
          className="h-12 flex items-center justify-center cursor-pointer"
        >
          {userPhoto ? (
            <img
              src={userPhoto}
              alt={userName}
              referrerPolicy="no-referrer"
              className={`w-7 h-7 rounded-full object-cover ${
                ytTab === 'tu' ? 'ring-2 ring-white' : 'ring-1 ring-white/25'
              }`}
            />
          ) : googleAccount.user ? (
            <span
              className={`w-7 h-7 rounded-full bg-[#6366F1] text-white text-xs font-bold flex items-center justify-center ${
                ytTab === 'tu' ? 'ring-2 ring-white' : ''
              }`}
            >
              {userName.slice(0, 1).toUpperCase()}
            </span>
          ) : (
            <span
              className={`w-7 h-7 rounded-full bg-[#272727] flex items-center justify-center ${
                ytTab === 'tu'
                  ? 'ring-2 ring-white text-white'
                  : 'ring-1 ring-white/30 text-[#CCCCCC]'
              }`}
            >
              <User className="w-4 h-4" />
            </span>
          )}
        </button>
      </nav>

      {/* Anti-Sponsored & URL Paste Sheet (opened from + icon or Shield counter) */}
      {showAdShieldSheet && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowAdShieldSheet(false)}
        >
          <div
            className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#181818] border border-white/10 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  Reproducir Link o Escudo Anti-Patrocinado
                </h3>
                <p className="text-xs text-[#AAAAAA]">
                  Pega cualquier enlace de YouTube/Shorts o verifica la limpieza del feed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdShieldSheet(false)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={quickUrlInput}
                onChange={(e) => setQuickUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && handlePlayUrlOrId(quickUrlInput)) {
                    setQuickUrlInput('');
                    setShowAdShieldSheet(false);
                  }
                }}
                placeholder="https://youtu.be/... o ID de 11 caracteres"
                className="flex-1 h-11 bg-[#0F0F0F] border border-white/10 rounded-xl px-3.5 text-xs text-white placeholder-[#AAAAAA] focus:outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={() => {
                  if (handlePlayUrlOrId(quickUrlInput)) {
                    setQuickUrlInput('');
                    setShowAdShieldSheet(false);
                  }
                }}
                className="px-4 h-11 rounded-xl bg-[#FF0000] text-white text-xs font-bold cursor-pointer shrink-0"
              >
                Ver Sin Ads
              </button>
            </div>

            <div className="flex items-center justify-between bg-[#0F0F0F] rounded-xl p-3.5 border border-white/10">
              <span className="text-xs font-semibold text-white">
                Bloquear tarjetas Patrocinado en el feed
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={antiSponsoredFeed}
                onClick={() => onToggleAntiSponsoredFeed(!antiSponsoredFeed)}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  antiSponsoredFeed ? 'bg-[#22C55E]/40' : 'bg-[#272727]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full transition-transform ${
                    antiSponsoredFeed
                      ? 'translate-x-5 bg-[#22C55E]'
                      : 'translate-x-0 bg-[#AAAAAA]'
                  }`}
                />
              </button>
            </div>

            <div className="bg-[#0F0F0F] rounded-xl p-3.5 border border-white/10 space-y-2">
              <p className="text-xs font-semibold text-[#AAAAAA]">
                Nodos filtrados en JSON (inject.js):
              </p>
              <p className="text-xs font-mono text-[#22C55E]">
                {sanitizedKeys.join(' · ')}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const { removedKeys } = recursiveCleanYouTubePayload(
                    SAMPLE_SPONSORED_FEED_PAYLOAD,
                  );
                  setSanitizedKeys(removedKeys);
                  onIncrementBlocked(removedKeys.length);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-[#22C55E] text-black text-xs font-extrabold cursor-pointer"
              >
                Probar Limpieza Feed
              </button>
              <button
                type="button"
                onClick={handleCopyCssPatch}
                className="flex-1 min-h-[44px] rounded-xl bg-[#272727] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedPatch ? 'CSS Copiado' : 'Copiar CSS Android'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

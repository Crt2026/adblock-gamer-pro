import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/youtube.readonly',
] as const;

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
for (const scope of GOOGLE_OAUTH_SCOPES) {
  provider.addScope(scope);
}
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
// Strictly in-memory OAuth access token (never written to localStorage/sessionStorage).
let cachedAccessToken: string | null = null;

export interface GoogleProfileInfo {
  name: string;
  email: string;
  picture: string;
}

export interface YouTubeSubscriptionChannel {
  channelId: string;
  title: string;
  thumbnail: string;
  description: string;
}

export interface YouTubeLikedVideo {
  id: string;
  title: string;
  channel: string;
  views: string;
  published: string;
  duration: string;
  thumbnail: string;
  isShort: boolean;
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthSignedOut?: () => void,
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthSuccess?.(user, null);
      }
    } else {
      cachedAccessToken = null;
      onAuthSignedOut?.();
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('No se recibió token de acceso de Google');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async (): Promise<void> => {
  await auth.signOut();
  cachedAccessToken = null;
};

export async function fetchGoogleUserInfo(
  accessToken: string,
): Promise<GoogleProfileInfo | null> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    name?: string;
    email?: string;
    picture?: string;
  };
  return {
    name: data.name ?? '',
    email: data.email ?? '',
    picture: data.picture ?? '',
  };
}

function formatIsoDuration(iso?: string): string {
  if (!iso) return 'HD';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 'HD';
  const h = Number(match[1] ?? 0);
  const m = Number(match[2] ?? 0);
  const s = Number(match[3] ?? 0);
  const sec = String(s).padStart(2, '0');
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${sec}`;
  return `${m}:${sec}`;
}

export async function fetchYouTubeSubscriptions(accessToken: string): Promise<{
  channels: YouTubeSubscriptionChannel[];
  error?: string;
}> {
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=16',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    return {
      channels: [],
      error:
        res.status === 401
          ? 'Sesión expirada. Vuelve a iniciar sesión con Google.'
          : res.status === 403
            ? 'Permiso de YouTube pendiente o cuota limitada en el proyecto.'
            : `Error HTTP ${res.status}${errText ? '' : ''}`,
    };
  }
  const data = (await res.json()) as {
    items?: Array<{
      snippet?: {
        title?: string;
        description?: string;
        resourceId?: { channelId?: string };
        thumbnails?: {
          default?: { url?: string };
          medium?: { url?: string };
        };
      };
    }>;
  };

  const channels: YouTubeSubscriptionChannel[] = (data.items ?? [])
    .map((item) => {
      const s = item.snippet;
      const channelId = s?.resourceId?.channelId ?? '';
      return {
        channelId,
        title: s?.title ?? 'Canal',
        description: s?.description ?? '',
        thumbnail:
          s?.thumbnails?.medium?.url ?? s?.thumbnails?.default?.url ?? '',
      };
    })
    .filter((c) => Boolean(c.channelId));

  return { channels };
}

export async function fetchYouTubeLikedVideos(accessToken: string): Promise<{
  videos: YouTubeLikedVideo[];
  error?: string;
}> {
  const res = await fetch(
    'https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&myRating=like&maxResults=12',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok) {
    return {
      videos: [],
      error: `Error HTTP ${res.status}`,
    };
  }
  const data = (await res.json()) as {
    items?: Array<{
      id?: string;
      snippet?: {
        title?: string;
        channelTitle?: string;
        publishedAt?: string;
        thumbnails?: {
          high?: { url?: string };
          medium?: { url?: string };
        };
      };
      contentDetails?: { duration?: string };
      statistics?: { viewCount?: string };
    }>;
  };

  const videos: YouTubeLikedVideo[] = (data.items ?? [])
    .filter((item) => Boolean(item.id))
    .map((item) => {
      const id = item.id!;
      const viewsRaw = Number(item.statistics?.viewCount ?? 0);
      const views =
        viewsRaw >= 1_000_000
          ? `${(viewsRaw / 1_000_000).toFixed(1)}M vistas`
          : viewsRaw >= 1_000
            ? `${Math.round(viewsRaw / 1_000)}K vistas`
            : viewsRaw > 0
              ? `${viewsRaw} vistas`
              : 'Video guardado';
      return {
        id,
        title: item.snippet?.title ?? 'Video de YouTube',
        channel: item.snippet?.channelTitle ?? 'YouTube',
        views,
        published: item.snippet?.publishedAt
          ? new Date(item.snippet.publishedAt).toLocaleDateString('es-CL')
          : 'Reciente',
        duration: formatIsoDuration(item.contentDetails?.duration),
        thumbnail:
          item.snippet?.thumbnails?.high?.url ??
          item.snippet?.thumbnails?.medium?.url ??
          `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        isShort: false,
      };
    });

  return { videos };
}

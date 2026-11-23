import { useCallback, useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  fetchGoogleUserInfo,
  fetchYouTubeLikedVideos,
  fetchYouTubeSubscriptions,
  googleSignIn,
  initAuth,
  logoutGoogle,
  type GoogleProfileInfo,
  type YouTubeLikedVideo,
  type YouTubeSubscriptionChannel,
} from '../lib/googleAuth';

export interface GoogleAccountState {
  user: User | null;
  profile: GoogleProfileInfo | null;
  accessToken: string | null;
  isLoggingIn: boolean;
  authError: string | null;
  loadingYouTubeData: boolean;
  youtubeError: string | null;
  subscriptions: YouTubeSubscriptionChannel[];
  likedVideos: YouTubeLikedVideo[];
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshYouTubeData: () => Promise<void>;
}

export function useGoogleAccount(): GoogleAccountState {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<GoogleProfileInfo | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loadingYouTubeData, setLoadingYouTubeData] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<YouTubeSubscriptionChannel[]>([]);
  const [likedVideos, setLikedVideos] = useState<YouTubeLikedVideo[]>([]);

  const loadAccountData = useCallback(async (token: string) => {
    setLoadingYouTubeData(true);
    setYoutubeError(null);
    try {
      const [userInfo, subsRes, likesRes] = await Promise.all([
        fetchGoogleUserInfo(token),
        fetchYouTubeSubscriptions(token),
        fetchYouTubeLikedVideos(token),
      ]);
      if (userInfo) setProfile(userInfo);
      setSubscriptions(subsRes.channels);
      setLikedVideos(likesRes.videos);
      if (subsRes.error && subsRes.channels.length === 0) {
        setYoutubeError(subsRes.error);
      } else if (likesRes.error && likesRes.videos.length === 0 && subsRes.channels.length === 0) {
        setYoutubeError(likesRes.error);
      }
    } catch {
      setYoutubeError('No se pudo conectar con la API de YouTube.');
    } finally {
      setLoadingYouTubeData(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth(
      (firebaseUser, token) => {
        setUser(firebaseUser);
        setAccessToken(token);
        if (token) {
          void loadAccountData(token);
        }
      },
      () => {
        setUser(null);
        setProfile(null);
        setAccessToken(null);
        setSubscriptions([]);
        setLikedVideos([]);
        setYoutubeError(null);
      },
    );
    return unsubscribe;
  }, [loadAccountData]);

  const signIn = useCallback(async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      setUser(result.user);
      setAccessToken(result.accessToken);
      await loadAccountData(result.accessToken);
    } catch (err) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? String((err as { code?: unknown }).code)
          : '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Cerraste la ventana de inicio de sesión antes de completar.');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('El navegador bloqueó la ventana emergente de Google. Permite pop-ups e inténtalo de nuevo.');
      } else {
        setAuthError(
          err instanceof Error
            ? err.message
            : 'No se pudo iniciar sesión con Google.',
        );
      }
    } finally {
      setIsLoggingIn(false);
    }
  }, [loadAccountData]);

  const signOut = useCallback(async () => {
    await logoutGoogle();
    setUser(null);
    setProfile(null);
    setAccessToken(null);
    setSubscriptions([]);
    setLikedVideos([]);
    setAuthError(null);
    setYoutubeError(null);
  }, []);

  const refreshYouTubeData = useCallback(async () => {
    if (!accessToken) return;
    await loadAccountData(accessToken);
  }, [accessToken, loadAccountData]);

  return {
    user,
    profile,
    accessToken,
    isLoggingIn,
    authError,
    loadingYouTubeData,
    youtubeError,
    subscriptions,
    likedVideos,
    signIn,
    signOut,
    refreshYouTubeData,
  };
}

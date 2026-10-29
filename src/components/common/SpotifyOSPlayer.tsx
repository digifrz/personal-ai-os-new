import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  X,
  Minimize2,
  Maximize2,
  ExternalLink,
  Volume2,
  Headphones,
  Sparkles,
  Radio,
  Check,
  Search,
  Plus,
  Trash2,
  Key,
  RefreshCw,
  Library,
  Play,
  ListMusic,
  Disc3,
  SlidersHorizontal,
  Copy,
  User,
} from 'lucide-react';
import { SpotifyPlaylistSummary } from '../../types';

export interface SpotifyOSPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FocusStation {
  id: string;
  name: string;
  genre: string;
  playlistId: string;
  color: string;
}

const CURATED_STATIONS: FocusStation[] = [
  {
    id: 'deep-focus',
    name: 'Deep Focus',
    genre: 'Ambient & Electronic',
    playlistId: '37i9dQZF1DXdLEN7aqioXM',
    color: 'from-emerald-600 to-teal-800',
  },
  {
    id: 'lofi-beats',
    name: 'Lofi Beats',
    genre: 'Chill Beats to Study To',
    playlistId: '37i9dQZF1DXcBWJnO0MpWi',
    color: 'from-purple-600 to-indigo-800',
  },
  {
    id: 'brain-food',
    name: 'Brain Food',
    genre: 'Alpha Waves & Neuro Flow',
    playlistId: '37i9dQZF1DX3qCx52SuA2W',
    color: 'from-blue-600 to-cyan-800',
  },
  {
    id: 'peaceful-piano',
    name: 'Peaceful Piano',
    genre: 'Calm Classical',
    playlistId: '37i9dQZF1DX4sWSpwq3LiO',
    color: 'from-amber-600 to-orange-800',
  },
  {
    id: 'deep-work',
    name: 'Deep Work Flow',
    genre: 'Synth & Drone Flow',
    playlistId: '37i9dQZF1DWZeKCadgRdKQ',
    color: 'from-violet-600 to-fuchsia-800',
  },
  {
    id: 'coffeehouse-jazz',
    name: 'Coffeehouse Jazz',
    genre: 'Smooth Background Vibes',
    playlistId: '37i9dQZF1DX0SM0LYsmbMT',
    color: 'from-rose-600 to-pink-800',
  },
];

const INITIAL_PERSONAL_PLAYLISTS: SpotifyPlaylistSummary[] = [
  {
    id: '37i9dQZF1DXcBWJnO0MpWi',
    name: 'My Lo-Fi Focus Flow',
    description: 'Personal study sessions, calm beats, and late night engineering',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&q=80',
    tracksCount: 120,
    ownerName: 'You',
    externalUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWJnO0MpWi',
    isPersonal: true,
  },
  {
    id: '37i9dQZF1DXdLEN7aqioXM',
    name: 'Coding & High Tempo Flow',
    description: 'Deep modular synth landscapes and driving rhythmic beats',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
    tracksCount: 84,
    ownerName: 'You',
    externalUrl: 'https://open.spotify.com/playlist/37i9dQZF1DXdLEN7aqioXM',
    isPersonal: true,
  },
  {
    id: '37i9dQZF1DWWQRwui0ExPn',
    name: 'Night Drive Cyberpunk',
    description: 'Dark synthwave, retro future pulses, and neon basslines',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&q=80',
    tracksCount: 65,
    ownerName: 'You',
    externalUrl: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn',
    isPersonal: true,
  },
];

export const SpotifyOSPlayer: React.FC<SpotifyOSPlayerProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'stations' | 'search'>('personal');
  const [activePlaylistId, setActivePlaylistId] = useState<string>('37i9dQZF1DXcBWJnO0MpWi');
  const [activePlaylistTitle, setActivePlaylistTitle] = useState<string>('My Lo-Fi Focus Flow');
  const [activePlaylistGenre, setActivePlaylistGenre] = useState<string>('Chill Beats & Lo-Fi');
  const [isMinimized, setIsMinimized] = useState(false);
  const [personalPlaylists, setPersonalPlaylists] = useState<SpotifyPlaylistSummary[]>(() => {
    try {
      const saved = localStorage.getItem('paio_spotify_personal_playlists');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_PERSONAL_PLAYLISTS;
  });

  // Spotify Web API token state & connection
  const [spotifyToken, setSpotifyToken] = useState<string>(() => {
    try {
      return localStorage.getItem('paio_spotify_web_token') || '';
    } catch {
      return '';
    }
  });
  const [spotifyClientId, setSpotifyClientId] = useState<string>(() => {
    try {
      return localStorage.getItem('paio_spotify_client_id') || '';
    } catch {
      return '';
    }
  });
  const [userProfile, setUserProfile] = useState<{ displayName: string; avatarUrl?: string; product?: string } | null>(() => {
    try {
      const saved = localStorage.getItem('paio_spotify_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });
  const [isTokenEditorOpen, setIsTokenEditorOpen] = useState(false);
  const [tempToken, setTempToken] = useState(spotifyToken);
  const [tempClientId, setTempClientId] = useState(spotifyClientId);
  const [isConnecting, setIsConnecting] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean>(() => !!spotifyToken);
  const [showFullSongList, setShowFullSongList] = useState(true);
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  // Add custom playlist state
  const [isAddingPlaylist, setIsAddingPlaylist] = useState(false);
  const [newPlaylistUrl, setNewPlaylistUrl] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addError, setAddError] = useState('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SpotifyPlaylistSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const defaultX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 440) : 100;
    const defaultY = typeof window !== 'undefined' ? Math.max(16, window.innerHeight - 560) : 100;
    return { x: defaultX, y: defaultY };
  });

  const isDraggingRef = useRef(false);
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Save personal playlists to local storage
  const savePersonalPlaylists = (lists: SpotifyPlaylistSummary[]) => {
    setPersonalPlaylists(lists);
    try {
      localStorage.setItem('paio_spotify_personal_playlists', JSON.stringify(lists));
    } catch {}
  };

  // Fetch Spotify user profile
  const fetchUserProfile = async (tokenToUse?: string) => {
    const effectiveToken = tokenToUse !== undefined ? tokenToUse : spotifyToken;
    if (!effectiveToken) return;
    try {
      const res = await fetch(`/api/integrations/spotify/me?token=${encodeURIComponent(effectiveToken)}`);
      const data = await res.json();
      if (data.success && data.user) {
        const profile = {
          displayName: data.user.displayName || 'Spotify Member',
          avatarUrl: data.user.avatarUrl,
          product: data.user.product,
        };
        setUserProfile(profile);
        try {
          localStorage.setItem('paio_spotify_user_profile', JSON.stringify(profile));
        } catch {}
      }
    } catch (err) {
      console.warn('Could not fetch Spotify profile:', err);
    }
  };

  // Fetch personal playlists using Spotify Web API
  const fetchPlaylistsFromApi = async (tokenToUse?: string) => {
    const effectiveToken = tokenToUse !== undefined ? tokenToUse : spotifyToken;
    setIsConnecting(true);
    try {
      const url = effectiveToken
        ? `/api/integrations/spotify/playlists?token=${encodeURIComponent(effectiveToken)}`
        : `/api/integrations/spotify/playlists`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.playlists) && data.playlists.length > 0) {
        if (effectiveToken && data.source === 'spotify_web_api') {
          setApiConnected(true);
        }
        // Merge with existing user custom playlists
        const existingIds = new Set(data.playlists.map((p: any) => p.id));
        const customOnly = personalPlaylists.filter((p) => !existingIds.has(p.id));
        const merged = [...data.playlists, ...customOnly];
        savePersonalPlaylists(merged);
      }
    } catch (err) {
      console.warn('Could not fetch Spotify personal playlists:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Listen for OAuth postMessage callback from popup window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS' && event.data?.token) {
        const token = event.data.token;
        setSpotifyToken(token);
        setApiConnected(true);
        try {
          localStorage.setItem('paio_spotify_web_token', token);
        } catch {}
        fetchPlaylistsFromApi(token);
        fetchUserProfile(token);
        setIsTokenEditorOpen(false);
      } else if (event.data?.type === 'SPOTIFY_AUTH_ERROR') {
        console.warn('Spotify auth error:', event.data.error);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [personalPlaylists]);

  // Spotify OAuth Callback Token extraction from URL Hash if opened in direct redirect
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
      try {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const token = params.get('access_token');
        if (token) {
          setSpotifyToken(token);
          setApiConnected(true);
          localStorage.setItem('paio_spotify_web_token', token);
          fetchPlaylistsFromApi(token);
          fetchUserProfile(token);
          window.history.replaceState(null, '', window.location.pathname);
        }
      } catch (e) {
        console.warn('OAuth hash parse error:', e);
      }
    }
  }, []);

  // Spotify OAuth Sign-In Flow
  const handleSpotifyOAuthSignIn = async () => {
    setIsConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/auth/spotify/callback`;
      const clientId = spotifyClientId.trim() || '4a5e3a89025e40e695d73673752e5052';

      let authUrl = '';
      try {
        const res = await fetch(
          `/api/integrations/spotify/auth-url?redirectUri=${encodeURIComponent(redirectUri)}&clientId=${encodeURIComponent(clientId)}`
        );
        if (res.ok) {
          const data = await res.json();
          authUrl = data.url;
        }
      } catch {}

      if (!authUrl) {
        const scopes = encodeURIComponent(
          'playlist-read-private playlist-read-collaborative user-read-playback-state user-top-read user-read-recently-played'
        );
        authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&scope=${scopes}&show_dialog=true`;
      }

      const popup = window.open(authUrl, 'spotify-auth', 'width=520,height=720,left=250,top=100');
      if (!popup) {
        window.location.href = authUrl;
      }
    } catch (err) {
      console.error('Failed to initiate Spotify OAuth:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleInstantDemoConnect = async () => {
    setIsConnecting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const token = 'BQB_verified_token_' + Date.now();
    setSpotifyToken(token);
    setApiConnected(true);
    try {
      localStorage.setItem('paio_spotify_web_token', token);
    } catch {}
    await fetchPlaylistsFromApi(token);
    await fetchUserProfile(token);
    setIsConnecting(false);
    setIsTokenEditorOpen(false);
  };

  const handleDisconnectSpotify = () => {
    setSpotifyToken('');
    setApiConnected(false);
    setUserProfile(null);
    try {
      localStorage.removeItem('paio_spotify_web_token');
      localStorage.removeItem('paio_spotify_user_profile');
    } catch {}
  };

  // Initial load check
  useEffect(() => {
    if (isOpen && spotifyToken) {
      fetchPlaylistsFromApi();
      fetchUserProfile();
    }
  }, [isOpen]);

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const tokenParam = spotifyToken ? `&token=${encodeURIComponent(spotifyToken)}` : '';
        const res = await fetch(`/api/integrations/spotify/search?q=${encodeURIComponent(searchQuery)}${tokenParam}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.playlists)) {
          setSearchResults(data.playlists);
        }
      } catch (err) {
        console.warn('Spotify search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, spotifyToken]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    dragStartOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const newX = e.clientX - dragStartOffsetRef.current.x;
    const newY = e.clientY - dragStartOffsetRef.current.y;
    const boundedX = Math.max(10, Math.min(window.innerWidth - 380, newX));
    const boundedY = Math.max(10, Math.min(window.innerHeight - (isMinimized ? 70 : 480), newY));
    setPosition({ x: boundedX, y: boundedY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Extract Spotify Playlist ID from URL or URI
  const extractPlaylistId = (input: string): string | null => {
    const clean = input.trim();
    // open.spotify.com/playlist/{id}
    const urlMatch = clean.match(/playlist\/([a-zA-Z0-9]+)/);
    if (urlMatch) return urlMatch[1];
    // spotify:playlist:{id}
    const uriMatch = clean.match(/spotify:playlist:([a-zA-Z0-9]+)/);
    if (uriMatch) return uriMatch[1];
    // direct alphanumeric ID
    if (/^[a-zA-Z0-9]{22}$/.test(clean)) return clean;
    return null;
  };

  const handleAddPersonalPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    const id = extractPlaylistId(newPlaylistUrl);
    if (!id) {
      setAddError('Please enter a valid Spotify playlist URL or ID (e.g. open.spotify.com/playlist/...)');
      return;
    }

    const title = newPlaylistName.trim() || `Personal Playlist (${id.slice(0, 6)}...)`;
    const newPlaylist: SpotifyPlaylistSummary = {
      id,
      name: title,
      description: 'Custom playlist added via Spotify Web API integration',
      imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&q=80',
      tracksCount: 50,
      ownerName: 'Personal Collection',
      externalUrl: `https://open.spotify.com/playlist/${id}`,
      isPersonal: true,
    };

    const updated = [newPlaylist, ...personalPlaylists.filter((p) => p.id !== id)];
    savePersonalPlaylists(updated);
    setActivePlaylistId(id);
    setActivePlaylistTitle(title);
    setActivePlaylistGenre('Personal Collection');
    setNewPlaylistUrl('');
    setNewPlaylistName('');
    setIsAddingPlaylist(false);
  };

  const handleDeletePersonalPlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = personalPlaylists.filter((p) => p.id !== id);
    savePersonalPlaylists(updated);
    if (activePlaylistId === id && updated.length > 0) {
      selectPlaylist(updated[0]);
    }
  };

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tempToken.trim();
    setSpotifyToken(clean);
    try {
      localStorage.setItem('paio_spotify_web_token', clean);
    } catch {}
    setIsTokenEditorOpen(false);
    if (clean) {
      await fetchPlaylistsFromApi(clean);
    } else {
      setApiConnected(false);
    }
  };

  const selectPlaylist = (playlist: SpotifyPlaylistSummary | FocusStation) => {
    const id = 'playlistId' in playlist ? playlist.playlistId : playlist.id;
    const name = playlist.name;
    const genre = 'genre' in playlist ? playlist.genre : playlist.description || 'Spotify Flow';
    setActivePlaylistId(id);
    setActivePlaylistTitle(name);
    setActivePlaylistGenre(genre);
  };

  return (
    <>
      {/* Minimized Floating Pill Mode - Rendered on top while iframe stays alive in DOM */}
      {isMinimized && (
        <div
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          className="fixed z-[9990] flex items-center gap-3 rounded-2xl border border-emerald-500/50 bg-zinc-950/95 px-4 py-2.5 text-white shadow-2xl backdrop-blur-xl animate-fade-in select-none group"
        >
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="flex items-center gap-2.5 cursor-grab active:cursor-grabbing"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1DB954]/25 text-[#1DB954] shadow-inner">
              <Disc3 className="w-4 h-4 animate-spin [animation-duration:4s]" />
            </div>
            <div className="max-w-[170px]">
              <p className="text-xs font-bold leading-tight truncate">{activePlaylistTitle}</p>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1DB954] animate-pulse" />
                Playing in Background
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              title="Expand Spotify Player"
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Spotify player"
              className="p-1 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Expanded Player Window - Kept inside viewport bounds so browser never throttles background iframe audio */}
      <div
        style={{
          left: isMinimized ? `${Math.max(16, position.x)}px` : `${position.x}px`,
          top: isMinimized ? `${Math.max(16, position.y)}px` : `${position.y}px`,
          width: isMinimized ? '280px' : undefined,
          height: isMinimized ? '70px' : undefined,
          opacity: isMinimized ? 0.001 : 1,
          pointerEvents: isMinimized ? 'none' : 'auto',
          zIndex: isMinimized ? 9980 : 9990,
          clipPath: isMinimized ? 'inset(0 0 0 0)' : undefined,
          overflow: isMinimized ? 'hidden' : undefined,
          transition: 'opacity 0.15s ease',
        }}
        className="fixed z-[9990] w-88 sm:w-[430px] rounded-3xl border border-emerald-500/35 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden select-none animate-fade-in text-white flex flex-col max-h-[85vh]"
      >
      {/* Draggable Header */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 border-b border-white/10 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1DB954] text-black font-black shadow-md shadow-[#1DB954]/20">
            <Music className="w-4 h-4 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight">Spotify OS Player</span>
              <span className="rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 px-2 py-0.2 text-[9px] font-bold text-[#1DB954]">
                Web API
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">View, select &amp; play personal playlists</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsTokenEditorOpen(!isTokenEditorOpen)}
            title="Sign in with your Spotify account to hear your personal playlists"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors ${
              apiConnected
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-[#1DB954]/50 bg-[#1DB954]/15 text-[#1DB954] hover:bg-[#1DB954]/25 shadow-xs'
            }`}
          >
            {userProfile?.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
            ) : (
              <Key className="w-3 h-3" />
            )}
            <span className="truncate max-w-[90px]">
              {apiConnected ? (userProfile?.displayName ? userProfile.displayName.split(' ')[0] : 'Linked') : 'Sign In'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            title="Minimize to floating dock"
            className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Spotify OAuth & Token Configuration Drawer */}
      {isTokenEditorOpen && (
        <div className="p-3.5 bg-zinc-900 border-b border-white/10 space-y-3 animate-fade-in text-xs max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#1DB954]" />
              Spotify Account &amp; OAuth Integration
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
              apiConnected
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold'
                : 'text-zinc-500'
            }`}>
              {apiConnected ? (userProfile?.displayName ? `● ${userProfile.displayName}` : '● Connected') : 'Not Linked'}
            </span>
          </div>

          <p className="text-[11px] text-zinc-400 leading-normal">
            Sign in with your personal Spotify account to auto-sync your private playlists, listen continuously across views, and enjoy uninterrupted background focus audio.
          </p>

          {/* Quick OAuth Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSpotifyOAuthSignIn}
              disabled={isConnecting}
              className="flex-1 py-2 px-3 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Music className="w-3.5 h-3.5 fill-black" />
              <span>{isConnecting ? 'Connecting…' : 'Sign in with Spotify'}</span>
            </button>

            <button
              type="button"
              onClick={handleInstantDemoConnect}
              disabled={isConnecting}
              className="py-2 px-3 rounded-xl border border-[#1DB954]/50 bg-[#1DB954]/10 hover:bg-[#1DB954]/20 text-[#1DB954] font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
              title="Instant 1-click sync with demo personal playlists"
            >
              ⚡ Instant Sync
            </button>

            {apiConnected && (
              <button
                type="button"
                onClick={handleDisconnectSpotify}
                className="py-2 px-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold"
                title="Disconnect Account"
              >
                Sign out
              </button>
            )}
          </div>

          {/* OAuth Callback URI Display */}
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <div className="flex items-center justify-between text-[10px] text-zinc-400">
              <span className="font-semibold">OAuth Callback Redirect URI:</span>
              <button
                type="button"
                onClick={() => {
                  const uri = `${window.location.origin}/auth/spotify/callback`;
                  navigator.clipboard.writeText(uri);
                  setCopiedRedirect(true);
                  setTimeout(() => setCopiedRedirect(false), 2000);
                }}
                className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                {copiedRedirect ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copiedRedirect ? 'Copied' : 'Copy URI'}</span>
              </button>
            </div>
            <div className="bg-black/60 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-zinc-300 truncate select-all border border-white/5">
              {typeof window !== 'undefined' ? `${window.location.origin}/auth/spotify/callback` : '/auth/spotify/callback'}
            </div>
          </div>

          {/* Custom Spotify Client ID */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 block">
              Spotify App Client ID (optional override):
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="4a5e3a89025e40e695d73673752e5052"
                value={tempClientId}
                onChange={(e) => setTempClientId(e.target.value)}
                className="flex-1 rounded-xl bg-black/60 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-[#1DB954]"
              />
              <button
                type="button"
                onClick={() => {
                  const clean = tempClientId.trim();
                  setSpotifyClientId(clean);
                  try {
                    localStorage.setItem('paio_spotify_client_id', clean);
                  } catch {}
                }}
                className="rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 text-xs transition-colors shrink-0 cursor-pointer"
              >
                Save ID
              </button>
            </div>
          </div>

          {/* Advanced Manual Token Entry */}
          <form onSubmit={handleSaveToken} className="pt-2 border-t border-white/10 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 block">
              Or paste custom Spotify Web API token:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Bearer token (optional)..."
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                className="flex-1 rounded-xl bg-black/60 border border-white/10 px-3 py-1.5 text-xs text-white outline-none focus:border-[#1DB954]"
              />
              <button
                type="submit"
                disabled={isConnecting}
                className="rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 text-xs transition-colors shrink-0 disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-white/10 bg-zinc-900/60 px-2 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'personal'
              ? 'border-[#1DB954] text-[#1DB954]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Library className="w-3.5 h-3.5" />
          <span>My Playlists ({personalPlaylists.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stations')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'stations'
              ? 'border-[#1DB954] text-[#1DB954]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span>Focus Stations</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'search'
              ? 'border-[#1DB954] text-[#1DB954]'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
        </button>
      </div>

      {/* Main Tab Content Area */}
      <div className="overflow-y-auto max-h-56 p-3 space-y-2">
        {/* TAB 1: PERSONAL PLAYLISTS */}
        {activeTab === 'personal' && (
          <div className="space-y-2.5">
            {/* Spotify Sign-in Banner when not linked */}
            {!apiConnected ? (
              <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-950/80 via-zinc-900 to-black border border-[#1DB954]/40 shadow-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-[#1DB954] flex items-center justify-center text-black font-black shadow-sm">
                      <Music className="w-4 h-4 fill-black" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs text-white">Sign In to Spotify</h4>
                      <p className="text-[10px] text-zinc-400">Fetch &amp; play your personal playlists</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 px-2 py-0.5 text-[9px] font-bold text-[#1DB954]">
                    OAuth 2.0
                  </span>
                </div>

                <p className="text-[11px] text-zinc-300 leading-snug">
                  Sign in with your Spotify account to hear your personal playlists and keep music playing in the background while you work.
                </p>

                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={handleSpotifyOAuthSignIn}
                    disabled={isConnecting}
                    className="flex-1 py-2 px-3 rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Music className="w-3.5 h-3.5 fill-black" />
                    <span>{isConnecting ? 'Opening Spotify…' : 'Sign in with Spotify'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleInstantDemoConnect}
                    disabled={isConnecting}
                    className="py-2 px-3 rounded-xl border border-[#1DB954]/50 bg-[#1DB954]/10 hover:bg-[#1DB954]/20 text-[#1DB954] font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                    title="Instant 1-click sync with demo personal playlists"
                  >
                    ⚡ Instant Sync
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  {userProfile?.avatarUrl ? (
                    <img src={userProfile.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover border border-emerald-500/40 shrink-0" />
                  ) : (
                    <span className="h-2 w-2 rounded-full bg-[#1DB954] animate-pulse shrink-0" />
                  )}
                  <div className="min-w-0">
                    <span className="truncate text-emerald-300 font-bold text-[11px] block">
                      {userProfile?.displayName || 'Personal Spotify Account'}
                    </span>
                    <span className="text-[9px] text-zinc-400 block truncate">
                      {personalPlaylists.length} playlists synced · continuous playback
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => fetchPlaylistsFromApi()}
                    disabled={isConnecting}
                    title="Refresh playlists from Spotify"
                    className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isConnecting ? 'animate-spin text-[#1DB954]' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDisconnectSpotify}
                    className="text-[10px] text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded-md hover:bg-red-500/10 transition-colors"
                  >
                    Unlink
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Your Personal Playlists ({personalPlaylists.length})
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fetchPlaylistsFromApi()}
                  disabled={isConnecting}
                  title="Refresh from Spotify API"
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isConnecting ? 'animate-spin text-[#1DB954]' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingPlaylist(!isAddingPlaylist)}
                  className="flex items-center gap-1 rounded-lg bg-white/10 hover:bg-white/15 px-2 py-0.5 text-[10px] font-bold text-zinc-200 transition-colors"
                >
                  <Plus className="w-3 h-3 text-[#1DB954]" />
                  <span>Add Playlist</span>
                </button>
              </div>
            </div>

            {/* Form to add personal playlist */}
            {isAddingPlaylist && (
              <form
                onSubmit={handleAddPersonalPlaylist}
                className="p-2.5 rounded-2xl bg-zinc-900 border border-white/10 space-y-2 animate-fade-in"
              >
                <p className="text-[11px] font-bold text-zinc-200">Add Any Spotify Playlist</p>
                <input
                  type="text"
                  placeholder="Paste Spotify Playlist URL or ID (e.g. open.spotify.com/playlist/...)"
                  value={newPlaylistUrl}
                  onChange={(e) => setNewPlaylistUrl(e.target.value)}
                  className="w-full rounded-xl bg-black/60 border border-white/10 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#1DB954]"
                  required
                />
                <input
                  type="text"
                  placeholder="Custom Name (optional)"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full rounded-xl bg-black/60 border border-white/10 px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#1DB954]"
                />
                {addError && <p className="text-[10px] text-red-400">{addError}</p>}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingPlaylist(false)}
                    className="px-2.5 py-1 text-xs text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold px-3 py-1 text-xs transition-colors"
                  >
                    Save &amp; Play
                  </button>
                </div>
              </form>
            )}

            {/* List of Personal Playlists */}
            <div className="grid grid-cols-1 gap-1.5">
              {personalPlaylists.map((playlist) => {
                const isSelected = playlist.id === activePlaylistId;
                return (
                  <div
                    key={playlist.id}
                    onClick={() => selectPlaylist(playlist)}
                    className={`flex items-center justify-between p-2 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1DB954]/20 border-[#1DB954]/60 text-white shadow-md'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {playlist.imageUrl ? (
                        <img
                          src={playlist.imageUrl}
                          alt={playlist.name}
                          className="w-9 h-9 rounded-xl object-cover shrink-0 border border-white/10"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-emerald-950 flex items-center justify-center shrink-0 border border-white/10">
                          <ListMusic className="w-4 h-4 text-[#1DB954]" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold leading-tight truncate">{playlist.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {playlist.ownerName ? `By ${playlist.ownerName}` : 'Personal'} · {playlist.tracksCount || 50} tracks
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectPlaylist(playlist);
                        }}
                        className={`p-1.5 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-[#1DB954] text-black'
                            : 'bg-white/10 hover:bg-[#1DB954] hover:text-black text-white'
                        }`}
                        title="Play in Spotify Player"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeletePersonalPlaylist(playlist.id, e)}
                        className="p-1.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove from personal list"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CURATED FOCUS STATIONS */}
        {activeTab === 'stations' && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block px-1">
              Curated Productivity Frequencies
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {CURATED_STATIONS.map((station) => {
                const isSelected = station.playlistId === activePlaylistId;
                return (
                  <button
                    key={station.id}
                    type="button"
                    onClick={() => selectPlaylist(station)}
                    className={`flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs transition-all ${
                      isSelected
                        ? 'bg-[#1DB954]/25 border border-[#1DB954]/60 text-white font-bold shadow-md'
                        : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-transparent'
                    }`}
                  >
                    <Radio className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#1DB954] animate-pulse' : 'text-zinc-500'}`} />
                    <div className="truncate">
                      <p className="truncate font-bold leading-tight">{station.name}</p>
                      <p className="text-[9px] text-zinc-400 truncate">{station.genre}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: SEARCH SPOTIFY */}
        {activeTab === 'search' && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
              <input
                type="text"
                placeholder="Search Spotify for playlists, lo-fi, synth, jazz..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-black/60 border border-white/10 pl-8 pr-3 py-1.5 text-xs text-white outline-none focus:border-[#1DB954]"
              />
            </div>

            {isSearching && (
              <p className="text-[11px] text-zinc-400 py-3 text-center">Searching Spotify Web API catalog...</p>
            )}

            {!isSearching && searchResults.length === 0 && searchQuery && (
              <p className="text-[11px] text-zinc-400 py-3 text-center">No playlists found. Try searching for &quot;lofi&quot;, &quot;focus&quot;, or &quot;ambient&quot;.</p>
            )}

            <div className="space-y-1">
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  onClick={() => selectPlaylist(item)}
                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-bold truncate text-white">{item.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{item.description || item.ownerName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectPlaylist(item);
                      // Also add to personal playlists
                      if (!personalPlaylists.some(p => p.id === item.id)) {
                        savePersonalPlaylists([item, ...personalPlaylists]);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-[#1DB954] text-black font-bold shrink-0 ml-2"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Full Song List & Tracklist Toggle Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-t border-white/10 text-[11px]">
        <span className="text-zinc-400 font-medium">Song List View</span>
        <button
          type="button"
          onClick={() => setShowFullSongList(!showFullSongList)}
          className="flex items-center gap-1 text-[#1DB954] hover:text-white font-bold transition-colors"
        >
          <span>{showFullSongList ? 'Full Song List (380px)' : 'Compact Player (152px)'}</span>
        </button>
      </div>

      {/* Official Spotify Web Player Embed - Renders full song list when height >= 352px */}
      <div className="p-3 bg-black/90 flex flex-col items-center border-t border-white/10">
        <iframe
          key={`${activePlaylistId}-${showFullSongList ? 'full' : 'compact'}`}
          src={`https://open.spotify.com/embed/playlist/${activePlaylistId}?utm_source=generator&theme=0`}
          width="100%"
          height={showFullSongList ? '380' : '152'}
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="eager"
          className="rounded-2xl shadow-lg border border-white/10 transition-all duration-300"
          title={`Spotify Player: ${activePlaylistTitle}`}
        />
      </div>

      {/* Footer Info & External Link */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-t border-white/10 text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5 text-[#1DB954] min-w-0">
          <Headphones className="w-3.5 h-3.5 shrink-0" />
          <span className="font-semibold truncate">{activePlaylistGenre}</span>
        </div>

        <a
          href={`https://open.spotify.com/playlist/${activePlaylistId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors font-medium hover:underline shrink-0 ml-2"
        >
          <span>Open Spotify</span>
        </a>
      </div>
    </div>
  </>
);
};

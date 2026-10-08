import React, { useState, useRef } from 'react';
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
} from 'lucide-react';

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

const STATIONS: FocusStation[] = [
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

export const SpotifyOSPlayer: React.FC<SpotifyOSPlayerProps> = ({ isOpen, onClose }) => {
  const [selectedStation, setSelectedStation] = useState<FocusStation>(STATIONS[0]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    const defaultX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - 380) : 100;
    const defaultY = typeof window !== 'undefined' ? Math.max(16, window.innerHeight - 440) : 100;
    return { x: defaultX, y: defaultY };
  });

  const isDraggingRef = useRef(false);
  const dragStartOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
    const boundedX = Math.max(10, Math.min(window.innerWidth - 360, newX));
    const boundedY = Math.max(10, Math.min(window.innerHeight - (isMinimized ? 60 : 380), newY));
    setPosition({ x: boundedX, y: boundedY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  // Minimized Floating Pill
  if (isMinimized) {
    return (
      <div
        style={{ left: `${position.x}px`, top: `${position.y}px` }}
        className="fixed z-[9990] flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-zinc-950/95 px-3.5 py-2.5 text-white shadow-2xl backdrop-blur-xl animate-fade-in select-none group"
      >
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Music className="w-4 h-4 animate-spin [animation-duration:6s]" />
          </div>
          <div>
            <p className="text-xs font-bold leading-none">{selectedStation.name}</p>
            <span className="text-[10px] text-emerald-400 font-mono">Spotify Active</span>
          </div>
        </div>

        <div className="flex items-center gap-1 pl-2 border-l border-white/10">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            title="Expand player"
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
    );
  }

  // Expanded Floating Player Window
  return (
    <div
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-[9990] w-80 sm:w-96 rounded-3xl border border-emerald-500/30 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden select-none animate-fade-in text-white"
    >
      {/* Draggable Header */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-950/60 via-zinc-900 to-zinc-950 border-b border-white/10 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1DB954] text-black font-black">
            <Music className="w-4 h-4 fill-black" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight">Spotify Focus Hub</span>
              <span className="rounded-full bg-[#1DB954]/20 border border-[#1DB954]/40 px-1.5 py-0.2 text-[9px] font-bold text-[#1DB954]">
                OS Audio
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">Stream ambient sound while working</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            title="Minimize to floating pill"
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

      {/* Focus Station Selector Pills */}
      <div className="p-3 bg-zinc-900/60 border-b border-white/5 space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block px-1">
          Select Productivity Frequency
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {STATIONS.map((station) => {
            const isSelected = station.id === selectedStation.id;
            return (
              <button
                key={station.id}
                type="button"
                onClick={() => setSelectedStation(station)}
                className={`flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition-all ${
                  isSelected
                    ? 'bg-[#1DB954]/20 border border-[#1DB954]/50 text-white font-bold'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-transparent'
                }`}
              >
                <Radio className={`w-3 h-3 shrink-0 ${isSelected ? 'text-[#1DB954] animate-pulse' : 'text-zinc-500'}`} />
                <span className="truncate">{station.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Official Spotify Web Player Embed */}
      <div className="p-3 bg-black/80 flex flex-col items-center">
        <iframe
          key={selectedStation.playlistId}
          src={`https://open.spotify.com/embed/playlist/${selectedStation.playlistId}?utm_source=generator&theme=0`}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-2xl shadow-lg border border-white/10"
          title={`Spotify ${selectedStation.name}`}
        />
      </div>

      {/* Footer Details & External Link */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-t border-white/10 text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5 text-[#1DB954]">
          <Headphones className="w-3.5 h-3.5" />
          <span className="font-semibold">{selectedStation.genre}</span>
        </div>

        <a
          href={`https://open.spotify.com/playlist/${selectedStation.playlistId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-zinc-300 hover:text-white transition-colors font-medium hover:underline"
        >
          <span>Open Spotify App</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

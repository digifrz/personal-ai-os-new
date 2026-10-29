// Web Audio API Synthesized Dynamic Room Soundtracks & Haptic Sound Effects
// 100% offline-ready, zero external audio loading failures.

export type SoundtrackTrack = 'lofi_rain' | 'alpha_waves' | 'midnight_synth' | 'rainy_cafe';

class DynamicSoundtrackService {
  private ctx: AudioContext | null = null;
  private currentTrack: SoundtrackTrack = 'lofi_rain';
  private isPlaying: boolean = false;
  private volume: number = 0.45;
  private sfxEnabled: boolean = true;
  private activeNodes: { gain?: GainNode; sources?: any[]; filters?: any[] } = {};
  private autoDucked: boolean = false;

  constructor() {
    try {
      const savedVol = localStorage.getItem('paio_soundtrack_vol');
      if (savedVol) this.volume = parseFloat(savedVol);
      const savedTrack = localStorage.getItem('paio_soundtrack_track') as SoundtrackTrack;
      if (savedTrack) this.currentTrack = savedTrack;
      const savedSfx = localStorage.getItem('paio_sfx_enabled');
      if (savedSfx !== null) this.sfxEnabled = savedSfx === 'true';
    } catch {}
  }

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getStatus() {
    return {
      isPlaying: this.isPlaying,
      currentTrack: this.currentTrack,
      volume: this.volume,
      sfxEnabled: this.sfxEnabled,
      isAutoDucked: this.autoDucked,
    };
  }

  public togglePlay(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.play(this.currentTrack);
      return true;
    }
  }

  public setTrack(track: SoundtrackTrack) {
    this.currentTrack = track;
    try {
      localStorage.setItem('paio_soundtrack_track', track);
    } catch {}
    if (this.isPlaying) {
      this.play(track);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    try {
      localStorage.setItem('paio_soundtrack_vol', String(this.volume));
    } catch {}
    if (this.activeNodes.gain && this.ctx) {
      const targetGain = this.autoDucked ? 0.05 : this.volume;
      this.activeNodes.gain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.2);
    }
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
    try {
      localStorage.setItem('paio_sfx_enabled', String(enabled));
    } catch {}
  }

  // Auto-adapt soundtrack to workspace context
  public onTabChanged(tab: string) {
    const isLateNight = (() => {
      const hours = new Date().getHours();
      return hours >= 0 && hours < 5;
    })();

    // Video, community lounge voice/video or vibe rooms should duck ambient soundtrack
    if (['viberooms', 'community'].includes(tab)) {
      this.duckAudio(true);
    } else {
      this.duckAudio(false);
      if (this.isPlaying && isLateNight && this.currentTrack !== 'midnight_synth') {
        this.setTrack('midnight_synth');
      }
    }

    if (this.sfxEnabled) {
      this.playHapticSound('tab_switch');
    }
  }

  public duckAudio(duck: boolean) {
    this.autoDucked = duck;
    if (this.activeNodes.gain && this.ctx) {
      const target = duck ? 0.02 : this.volume;
      this.activeNodes.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.4);
    }
  }

  public play(track: SoundtrackTrack = this.currentTrack) {
    const ctx = this.initCtx();
    if (!ctx) return;

    this.stopSources();
    this.currentTrack = track;
    this.isPlaying = true;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.autoDucked ? 0.05 : this.volume, ctx.currentTime);
    masterGain.connect(ctx.destination);

    const sources: any[] = [];
    const filters: any[] = [];

    if (track === 'lofi_rain') {
      // 1. Synthesized rain noise
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.11;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, ctx.currentTime);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      sources.push(noise);
      filters.push(filter);

      // 2. Gentle resonant Rhodes-like low frequency chord pad (Cmaj9)
      const freqs = [130.81, 164.81, 196.0, 246.94]; // C3, E3, G3, B3
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const padGain = ctx.createGain();
        padGain.gain.setValueAtTime(0.04, ctx.currentTime);

        osc.connect(padGain);
        padGain.connect(masterGain);
        osc.start();
        sources.push(osc);
      });
    } else if (track === 'alpha_waves') {
      // 432Hz + 442Hz (10Hz binaural beat for deep cognitive alpha state)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(432, ctx.currentTime);
      osc2.frequency.setValueAtTime(442, ctx.currentTime);

      const alphaGain = ctx.createGain();
      alphaGain.gain.setValueAtTime(0.12, ctx.currentTime);

      osc1.connect(alphaGain);
      osc2.connect(alphaGain);
      alphaGain.connect(masterGain);

      osc1.start();
      osc2.start();
      sources.push(osc1, osc2);
    } else if (track === 'midnight_synth') {
      // Retro Cyberpunk Synth Drone (Fmin7)
      const freqs = [87.31, 130.81, 174.61, 207.65]; // F2, C3, F3, G#3
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const synthFilter = ctx.createBiquadFilter();
        synthFilter.type = 'lowpass';
        synthFilter.frequency.setValueAtTime(420, ctx.currentTime);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.04, ctx.currentTime);

        osc.connect(synthFilter);
        synthFilter.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start();
        sources.push(osc);
        filters.push(synthFilter);
      });
    } else if (track === 'rainy_cafe') {
      // Filtered warm ambient texture
      const bufferSize = ctx.sampleRate * 2;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.08;
      }
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const bandFilter = ctx.createBiquadFilter();
      bandFilter.type = 'bandpass';
      bandFilter.frequency.setValueAtTime(1100, ctx.currentTime);
      bandFilter.Q.setValueAtTime(1.2, ctx.currentTime);

      source.connect(bandFilter);
      bandFilter.connect(masterGain);
      source.start();
      sources.push(source);
      filters.push(bandFilter);
    }

    this.activeNodes = { gain: masterGain, sources, filters };
    window.dispatchEvent(new CustomEvent('paio:soundtrack-state', { detail: this.getStatus() }));
  }

  public stop() {
    this.isPlaying = false;
    this.stopSources();
    window.dispatchEvent(new CustomEvent('paio:soundtrack-state', { detail: this.getStatus() }));
  }

  private stopSources() {
    if (this.activeNodes.sources) {
      this.activeNodes.sources.forEach((s) => {
        try {
          s.stop();
          s.disconnect();
        } catch {}
      });
    }
    if (this.activeNodes.gain) {
      try {
        this.activeNodes.gain.disconnect();
      } catch {}
    }
    this.activeNodes = {};
  }

  // Tactile feedback micro-interactions (clicks, task completed chimes)
  public playHapticSound(type: 'task_complete' | 'click' | 'tab_switch' | 'drop') {
    if (!this.sfxEnabled) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'task_complete') {
        // Rewarding two-tone chime (E5 -> B5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.18);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.36);
      } else if (type === 'click') {
        // High-frequency subtle mechanical click
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.03);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'tab_switch') {
        // Soft tactile tap
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'drop') {
        // Cyber whoosh
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.21);
      }
    } catch {}
  }
}

export const dynamicSoundtrack = new DynamicSoundtrackService();

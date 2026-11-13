// Audio System for NextGenGames Board Brawl
// Supports authentic acoustic MP3 samples with Web Audio procedural fallback
// Includes dedicated volume controls and persistent settings for SFX and Music

export const MUSIC_PLAYLIST = [
  { id: 'ambient', title: 'Board Brawl Ambiance', src: '/sound/background.mp3' },
];

class SoundManager {
  constructor() {
    this.ctx = null;
    this.sfxGainNode = null;
    this.bgAudio = null;
    this.sampleCache = {};
    this.listeners = new Set();
    this.playlist = MUSIC_PLAYLIST;
    this.currentTrackIndex = 0;

    // Default volume levels (0.0 to 1.0)
    this.masterVolume = 1.0;
    this.sfxVolume = 0.8;
    this.musicVolume = 0.45;
    this.sfxMuted = false;
    this.musicMuted = true; // browser autoplay policies start muted by default
    this.muted = false; // master mute

    // Load saved preferences if in browser
    if (typeof window !== 'undefined') {
      try {
        const savedMasterVol = localStorage.getItem('ngg_master_volume');
        if (savedMasterVol !== null) {
          const parsed = parseFloat(savedMasterVol);
          if (!isNaN(parsed)) this.masterVolume = Math.max(0, Math.min(1, parsed));
        }

        const savedMasterMuted = localStorage.getItem('ngg_master_muted');
        if (savedMasterMuted !== null) {
          this.muted = savedMasterMuted === 'true';
        }

        const savedSfxVol = localStorage.getItem('ngg_audio_sfx_vol');
        if (savedSfxVol !== null) {
          const parsed = parseFloat(savedSfxVol);
          if (!isNaN(parsed)) this.sfxVolume = Math.max(0, Math.min(1, parsed));
        }

        const savedMusicVol = localStorage.getItem('ngg_audio_music_vol');
        if (savedMusicVol !== null) {
          const parsed = parseFloat(savedMusicVol);
          if (!isNaN(parsed)) this.musicVolume = Math.max(0, Math.min(1, parsed));
        }

        const savedSfxMuted = localStorage.getItem('ngg_audio_sfx_muted');
        if (savedSfxMuted !== null) {
          this.sfxMuted = savedSfxMuted === 'true';
        }

        const savedMusicMuted = localStorage.getItem('ngg_audio_music_muted');
        if (savedMusicMuted !== null) {
          this.musicMuted = savedMusicMuted === 'true';
        }

        const savedTrackIdx = localStorage.getItem('ngg_audio_music_track');
        if (savedTrackIdx !== null) {
          const parsed = parseInt(savedTrackIdx, 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed < this.playlist.length) {
            this.currentTrackIndex = parsed;
          }
        }
      } catch (e) {
        console.warn('Could not read audio preferences from localStorage', e);
      }
    }
  }

  // Subscribe to audio state changes (volume, mute status)
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach((cb) => {
      try { cb(); } catch (e) { console.error('Audio listener error:', e); }
    });
  }

  init() {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }

    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (!this.sfxGainNode) {
        this.sfxGainNode = this.ctx.createGain();
        this.updateSfxGain();
        this.sfxGainNode.connect(this.ctx.destination);
      }
    }

    if (!this.bgAudio && typeof Audio !== 'undefined') {
      try {
        this.bgAudio = new Audio('/sound/background.mp3');
        this.bgAudio.loop = true;
        this.updateMusicVolume();
        if (!this.musicMuted && !this.muted) {
          this.bgAudio.play().catch(() => {
            // Will resume on first user interaction gesture
          });
        }
      } catch (e) {
        console.warn('Background music could not be initialized', e);
      }
    }

    // Auto-unlock audio and music on first user interaction (browser autoplay policy)
    if (typeof window !== 'undefined' && !this.userGestureBound) {
      this.userGestureBound = true;
      const unlock = () => {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        if (this.bgAudio && !this.musicMuted && !this.muted && this.bgAudio.paused) {
          this.bgAudio.play().catch(() => {});
        }
      };
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    }
  }

  updateSfxGain() {
    if (!this.ctx || !this.sfxGainNode) return;
    const effectiveVol = (this.muted || this.sfxMuted) ? 0 : (this.sfxVolume * this.masterVolume);
    try {
      this.sfxGainNode.gain.setValueAtTime(effectiveVol, this.ctx.currentTime);
    } catch (e) {
      this.sfxGainNode.gain.value = effectiveVol;
    }
  }

  updateMusicVolume() {
    if (!this.bgAudio) return;
    const effectiveVol = (this.muted || this.musicMuted) ? 0 : (this.musicVolume * 0.5 * this.masterVolume);
    this.bgAudio.volume = Math.max(0, Math.min(1, effectiveVol));
  }

  // Master Volume control (0.0 to 1.0)
  setMasterVolume(vol) {
    this.init();
    this.masterVolume = Math.max(0, Math.min(1, Number(vol)));
    if (this.masterVolume > 0 && this.muted) {
      this.muted = false;
      this.persistPref('ngg_master_muted', 'false');
    }
    this.updateSfxGain();
    this.updateMusicVolume();
    this.persistPref('ngg_master_volume', String(this.masterVolume));
    this.notify();
  }

  getMasterVolume() {
    return this.masterVolume;
  }

  setMasterMuted(muted) {
    this.init();
    this.muted = Boolean(muted);
    this.updateSfxGain();
    this.updateMusicVolume();
    if (this.muted && this.bgAudio) {
      this.bgAudio.pause();
    } else if (!this.muted && !this.musicMuted && this.bgAudio) {
      this.bgAudio.play().catch(() => {});
    }
    this.persistPref('ngg_master_muted', String(this.muted));
    this.notify();
    return this.muted;
  }

  isMasterMuted() {
    return this.muted;
  }

  getSfxDestination() {
    this.init();
    return this.sfxGainNode || (this.ctx ? this.ctx.destination : null);
  }

  // Sound Effects volume control (0.0 to 1.0)
  setSfxVolume(vol) {
    this.init();
    this.sfxVolume = Math.max(0, Math.min(1, Number(vol)));
    if (this.sfxVolume > 0 && this.sfxMuted) {
      this.sfxMuted = false;
      this.persistPref('ngg_audio_sfx_muted', 'false');
    }
    this.updateSfxGain();

    // Update all cached HTML5 Audio samples
    Object.values(this.sampleCache).forEach((snd) => {
      if (snd) {
        snd.volume = this.sfxMuted ? 0 : this.sfxVolume;
      }
    });

    this.persistPref('ngg_audio_sfx_vol', String(this.sfxVolume));
    this.notify();
  }

  getSfxVolume() {
    return this.sfxVolume;
  }

  setSfxMuted(muted) {
    this.init();
    this.sfxMuted = Boolean(muted);
    this.updateSfxGain();

    Object.values(this.sampleCache).forEach((snd) => {
      if (snd) {
        snd.volume = this.sfxMuted ? 0 : this.sfxVolume;
      }
    });

    this.persistPref('ngg_audio_sfx_muted', String(this.sfxMuted));
    this.notify();
    return this.sfxMuted;
  }

  isSfxMuted() {
    return this.sfxMuted || this.muted;
  }

  toggleSfxMute() {
    return this.setSfxMuted(!this.sfxMuted);
  }

  // Background Music volume control (0.0 to 1.0)
  setMusicVolume(vol) {
    this.init();
    this.musicVolume = Math.max(0, Math.min(1, Number(vol)));
    if (this.musicVolume > 0 && this.musicMuted) {
      // Unmute if user explicitly turns up volume
      this.musicMuted = false;
      this.persistPref('ngg_audio_music_muted', 'false');
      if (this.bgAudio) {
        this.bgAudio.play().catch(e => console.log('Autoplay blocked', e));
      }
    }
    this.updateMusicVolume();
    this.persistPref('ngg_audio_music_vol', String(this.musicVolume));
    this.notify();
  }

  getMusicVolume() {
    return this.musicVolume;
  }

  setMusicMuted(muted) {
    this.init();
    this.musicMuted = Boolean(muted);
    this.updateMusicVolume();
    if (this.bgAudio) {
      if (this.musicMuted) {
        this.bgAudio.pause();
      } else {
        this.bgAudio.play().catch(e => console.log('Autoplay blocked', e));
      }
    }
    this.persistPref('ngg_audio_music_muted', String(this.musicMuted));
    this.notify();
    return this.musicMuted;
  }

  isMusicMuted() {
    return this.musicMuted || this.muted;
  }

  toggleMusic() {
    this.init();
    this.musicMuted = !this.musicMuted;
    this.updateMusicVolume();
    if (this.bgAudio) {
      if (this.musicMuted) {
        this.bgAudio.pause();
      } else {
        this.bgAudio.play().catch(e => console.log('Autoplay blocked', e));
      }
    }
    this.persistPref('ngg_audio_music_muted', String(this.musicMuted));
    this.notify();
    return !this.musicMuted;
  }

  // Playlist management stubs (retained for backward compatibility)
  getPlaylist() {
    return this.playlist;
  }

  getCurrentTrack() {
    return this.playlist[0];
  }

  getCurrentTrackIndex() {
    return 0;
  }

  setTrack(_index) {
    // Single atmospheric ambiance track
  }

  nextTrack() {
    // Single atmospheric ambiance track
  }

  prevTrack() {
    // Single atmospheric ambiance track
  }

  // Master Mute
  toggleMute() {
    this.muted = !this.muted;
    this.updateSfxGain();
    this.updateMusicVolume();
    if (this.muted && this.bgAudio) {
      this.bgAudio.pause();
    } else if (!this.muted && !this.musicMuted && this.bgAudio) {
      this.bgAudio.play().catch(() => {});
    }
    this.notify();
    return !this.muted;
  }

  persistPref(key, value) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, value);
      } catch (e) {}
    }
  }

  // Play samples with procedural fallback
  playSample(name, fallbackFn) {
    this.init();
    if (this.muted || this.sfxMuted || this.sfxVolume <= 0) return;

    if (typeof Audio !== 'undefined') {
      try {
        let snd = this.sampleCache[name];
        if (!snd) {
          snd = new Audio(`/sound/${name}.mp3`);
          this.sampleCache[name] = snd;
        }
        snd.volume = this.sfxMuted ? 0 : this.sfxVolume;
        snd.currentTime = 0;
        snd.play().catch(() => {
          if (fallbackFn) fallbackFn.call(this);
        });
        return;
      } catch (e) {
        // Fallback to Web Audio
      }
    }
    if (fallbackFn) fallbackFn.call(this);
  }

  // Immediate sound preview for slider interaction
  playTestSfx() {
    this.playCash();
  }

  playDiceRoll() {
    // 8 distinct acoustic dice variations (felt tumbler, wood clatter, resin click, double drop)
    const diceSamples = [
      'dice_1', 'dice_2', 'dice_3', 'dice_4',
      'dice_5', 'dice_6', 'dice_7', 'dice_8'
    ];
    let nextIdx = Math.floor(Math.random() * diceSamples.length);
    if (this._lastDiceIdx !== undefined && nextIdx === this._lastDiceIdx) {
      nextIdx = (nextIdx + 1) % diceSamples.length;
    }
    this._lastDiceIdx = nextIdx;
    const sampleName = diceSamples[nextIdx];

    this.playSample(sampleName, () => {
      if (!this.ctx || this.sfxMuted || this.muted) return;
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;
      const clicks = 3 + (nextIdx % 4);
      const baseFreq = 180 + (nextIdx * 25);
      for (let i = 0; i < clicks; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + i * (0.055 + (nextIdx % 3) * 0.015);
        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(baseFreq + Math.random() * 120, t);
        osc.frequency.exponentialRampToValueAtTime(75, t + 0.045);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.05);
      }
    });
  }

  playBuild() {
    this.playSample('build', () => {
      this.playCash();
    });
  }

  playBuy() {
    this.playBuild();
  }

  playHouseConstruct(isLandmark = false) {
    try {
      if (!this.ctx || this.sfxMuted || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      // Double hammer/timber thud
      [0, 0.085].forEach((offset, i) => {
        const thud = this.ctx.createOscillator();
        const thudGain = this.ctx.createGain();
        thud.type = 'triangle';
        thud.frequency.setValueAtTime(175 + i * 35, now + offset);
        thud.frequency.exponentialRampToValueAtTime(72, now + offset + 0.07);
        thudGain.gain.setValueAtTime(0.22, now + offset);
        thudGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
        thud.connect(thudGain);
        thudGain.connect(dest);
        thud.start(now + offset);
        thud.stop(now + offset + 0.085);
      });

      // Ascending construction sparkle chime
      const notes = isLandmark ? [523.25, 659.25, 783.99, 1046.5] : [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const t = now + 0.12 + i * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.11, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + 0.24);
      });
    } catch {}
  }

  playPropertySell() {
    this.playSample('crumble', () => {
      try {
        if (!this.ctx || this.sfxMuted || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        const dest = this.getSfxDestination();
        if (!dest) return;
        const now = this.ctx.currentTime;

        // Multi-stage masonry & timber crumble breakdown
        [0, 0.09, 0.22].forEach((offset, i) => {
          const thud = this.ctx.createOscillator();
          const thudGain = this.ctx.createGain();
          thud.type = i === 1 ? 'sawtooth' : 'triangle';
          thud.frequency.setValueAtTime(145 - i * 25, now + offset);
          thud.frequency.exponentialRampToValueAtTime(42, now + offset + 0.16);
          thudGain.gain.setValueAtTime(0.18 - i * 0.04, now + offset);
          thudGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);
          thud.connect(thudGain);
          thudGain.connect(dest);
          thud.start(now + offset);
          thud.stop(now + offset + 0.19);
        });

        // Granular rubble noise burst
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.35);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.8);
        }
        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(750, now);
        filter.frequency.linearRampToValueAtTime(280, now + 0.35);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        whiteNoise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(dest);
        whiteNoise.start(now);
        whiteNoise.stop(now + 0.36);

        // Soft refund coin clink
        [880, 1174.66].forEach((freq, i) => {
          const t = now + 0.22 + i * 0.08;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.08, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(t);
          osc.stop(t + 0.24);
        });
      } catch {}
    });
  }

  playCash() {
    this.playSample('cash', () => {
      if (!this.ctx || this.sfxMuted || this.muted) return;
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.36);
    });
  }

  playMove() { this.playPawnStep(); }
  playPawnStep() {
    this.playSample('move', () => {
      if (!this.ctx || this.sfxMuted || this.muted) return;
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.06);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.07);
    });
  }

  playLandingThump() { this.playPawnLand(); }
  playPawnLand() {
    this.playSample('land', () => {
      try {
        if (!this.ctx || this.sfxMuted || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        const dest = this.getSfxDestination();
        if (!dest) return;
        const now = Math.max(0, this.ctx.currentTime);

        // Tactile low-frequency wooden board thump
        const osc = this.ctx.createOscillator();
        const oscSub = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

        oscSub.type = 'sine';
        oscSub.frequency.setValueAtTime(110, now);
        oscSub.frequency.exponentialRampToValueAtTime(45, now + 0.18);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc.connect(gain);
        oscSub.connect(gain);
        gain.connect(dest);

        osc.start(now);
        oscSub.start(now);
        osc.stop(now + 0.23);
        oscSub.stop(now + 0.23);
      } catch (e) {}
    });
  }

  playDoublesSurge() {
    if (!this.ctx || this.sfxMuted || this.muted) return;
    const dest = this.getSfxDestination();
    if (!dest) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(f, now + idx * 0.05);
      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + idx * 0.05);
      osc.stop(now + 0.65);
    });
  }

  playTomatoThrow() {
    try {
      if (!this.ctx || this.sfxMuted || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = Math.max(0, this.ctx.currentTime);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.36);
    } catch (e) {}
  }

  playTomatoSplat() {
    try {
      if (!this.ctx || this.sfxMuted || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = Math.max(0, this.ctx.currentTime);
      const bufferSize = Math.max(1, Math.floor((this.ctx.sampleRate || 44100) * 0.25));
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate || 44100);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / ((this.ctx.sampleRate || 44100) * 0.05));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.5, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      noise.connect(noiseGain);
      noiseGain.connect(dest);
      noise.start(now);
    } catch (e) {}
  }

  playAirportEntry() {
    this.playSample('airport_tsa', () => {
      try {
        if (!this.ctx || this.sfxMuted || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        const dest = this.getSfxDestination();
        if (!dest) return;
        const now = Math.max(0, this.ctx.currentTime);

        // Airport PA terminal chime (C5 -> E5 -> G5)
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const t = now + i * 0.28;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.18, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(t);
          osc.stop(t + 0.48);
        });

        // TSA security gate confirmation beep
        [1760.0, 2349.3].forEach((freq, i) => {
          const t = now + 0.95 + i * 0.06;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(t);
          osc.stop(t + 0.06);
        });
      } catch (e) {}
    });
  }

  playFlightTakeoff() {
    this.playSample('airplane_takeoff', () => {
      try {
        if (!this.ctx || this.sfxMuted || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        const dest = this.getSfxDestination();
        if (!dest) return;
        const now = Math.max(0, this.ctx.currentTime);

        // Jet turbine whine spool-up
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 1.2);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.20, now + 0.9);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now);
        osc.stop(now + 1.85);

        // Low-frequency jet engine thrust roar
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(60, now);
        subOsc.frequency.linearRampToValueAtTime(95, now + 1.5);
        subGain.gain.setValueAtTime(0.02, now);
        subGain.gain.linearRampToValueAtTime(0.25, now + 0.8);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
        subOsc.connect(subGain);
        subGain.connect(dest);
        subOsc.start(now);
        subOsc.stop(now + 1.95);
      } catch (e) {}
    });
  }

  playPrisonDoorOpen() {
    this.playSample('prison_open', () => {
      try {
        if (!this.ctx || this.sfxMuted || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        const dest = this.getSfxDestination();
        if (!dest) return;
        const now = Math.max(0, this.ctx.currentTime);

        // 1. Hydraulic pressure hiss / pneumatic release
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.32);
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.45));
        }
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(750, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.32);
        noiseFilter.Q.setValueAtTime(2.2, now);
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(dest);
        noiseSource.start(now);

        // 2. Heavy iron hinge groaning creak (dual detuned sawtooth/triangle with micro-wobble)
        [
          { freq: 105, targetFreq: 160, type: 'sawtooth', gainVal: 0.14, startOff: 0.03, dur: 0.65 },
          { freq: 108, targetFreq: 168, type: 'triangle', gainVal: 0.18, startOff: 0.04, dur: 0.68 },
          { freq: 215, targetFreq: 300, type: 'sawtooth', gainVal: 0.08, startOff: 0.07, dur: 0.60 },
        ].forEach((v) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const t = now + v.startOff;
          osc.type = v.type;
          osc.frequency.setValueAtTime(v.freq, t);
          osc.frequency.linearRampToValueAtTime(v.targetFreq, t + v.dur * 0.7);
          osc.frequency.linearRampToValueAtTime(v.targetFreq * 0.95, t + v.dur);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(450, t);
          filter.frequency.linearRampToValueAtTime(920, t + v.dur * 0.5);
          filter.Q.setValueAtTime(3.0, t);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(v.gainVal, t + 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, t + v.dur);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(dest);
          osc.start(t);
          osc.stop(t + v.dur + 0.02);
        });
      } catch (e) {}
    });
  }

  playPrisonDoorSlam() {
    this.playSample('prison_slam', () => {
      try {
        if (!this.ctx || this.sfxMuted || this.muted) return;
        if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
        const dest = this.getSfxDestination();
        if (!dest) return;
        const now = Math.max(0, this.ctx.currentTime);

        // 1. Heavy resonant iron impact thump (sub-bass boom)
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(160, now);
        subOsc.frequency.exponentialRampToValueAtTime(36, now + 0.28);
        subGain.gain.setValueAtTime(0.35, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        subOsc.connect(subGain);
        subGain.connect(dest);
        subOsc.start(now);
        subOsc.stop(now + 0.46);

        // 2. High-energy resonant metal gate clang & bar ring
        [310, 480, 720, 1180, 1850].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = idx % 2 === 0 ? 'triangle' : 'square';
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.exponentialRampToValueAtTime(freq * 0.96, now + 0.35);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(freq, now);
          filter.Q.setValueAtTime(4.0, now);

          const decay = 0.25 + (4 - idx) * 0.04;
          gain.gain.setValueAtTime(0.18 / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + decay);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + decay + 0.02);
        });

        // 3. Heavy industrial deadbolt lock snap & metal bolt latch click (at +0.06s)
        const clickTime = now + 0.06;
        [2200, 1650, 3100].forEach((f, i) => {
          const clickOsc = this.ctx.createOscillator();
          const clickGain = this.ctx.createGain();
          clickOsc.type = 'square';
          clickOsc.frequency.setValueAtTime(f, clickTime + i * 0.02);
          clickGain.gain.setValueAtTime(0.22, clickTime + i * 0.02);
          clickGain.gain.exponentialRampToValueAtTime(0.001, clickTime + i * 0.02 + 0.035);
          clickOsc.connect(clickGain);
          clickGain.connect(dest);
          clickOsc.start(clickTime + i * 0.02);
          clickOsc.stop(clickTime + i * 0.02 + 0.04);
        });
      } catch (e) {}
    });
  }

  playBuyout() {
    this.playCash();
  }

  playCardDraw() {
    if (!this.ctx || this.sfxMuted || this.muted) return;
    const dest = this.getSfxDestination();
    if (!dest) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(780, now + 0.18);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playCardPlay() {
    if (!this.ctx || this.sfxMuted || this.muted) return;
    const dest = this.getSfxDestination();
    if (!dest) return;
    const now = this.ctx.currentTime;
    [440, 554, 659, 880].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.2, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.25);
    });
  }

  playShield() {
    if (!this.ctx || this.sfxMuted || this.muted) return;
    const dest = this.getSfxDestination();
    if (!dest) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.linearRampToValueAtTime(1040, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.4);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  playDealStruck() {
    this.playCash();
    if (!this.ctx || this.sfxMuted || this.muted) return;
    try {
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;
      // Gavel strike thump
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  // Map Targeting Audio Feedback
  playTargetHover() {
    if (!this.ctx || this.sfxMuted || this.muted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  playTargetLock() {
    if (!this.ctx || this.sfxMuted || this.muted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;
      [1046.5, 1567.98].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.18, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.22);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.25);
      });
    } catch (e) {}
  }

  _prepareSfxContext() {
    if (this.muted || this.sfxMuted || this.sfxVolume <= 0) return null;
    this.init();
    if (!this.ctx) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    const dest = this.getSfxDestination();
    if (!dest) return null;
    return { ctx: this.ctx, dest, now: Math.max(0, this.ctx.currentTime) };
  }

  /** Crisp tactile UI tap SFX gated by SFX mute/volume. */
  playClick() {
    try {
      const audio = this._prepareSfxContext();
      if (!audio) return;
      const { ctx, dest, now } = audio;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.035);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.045);
    } catch (e) {}
  }

  /** Pleasant bright 2-tone chime gated by SFX mute/volume. */
  playNotification() {
    try {
      const audio = this._prepareSfxContext();
      if (!audio) return;
      const { ctx, dest, now } = audio;
      [
        { freq: 880, offset: 0, dur: 0.18, gainVal: 0.15 },
        { freq: 1318.51, offset: 0.09, dur: 0.28, gainVal: 0.18 },
      ].forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + n.offset;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, t);
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(n.gainVal, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + n.dur + 0.02);
      });
    } catch (e) {}
  }

  // Expressive Emoji Reactions Audio Suite
  playReactionEmoji(emoji) {
    if (!this.ctx || this.sfxMuted || this.muted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      switch (emoji) {
        case '😂': {
          // Fast staccato giggling synth notes
          const laughNotes = [520, 680, 540, 720, 560, 740];
          laughNotes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + idx * 0.055;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            osc.frequency.exponentialRampToValueAtTime(freq + 40, t + 0.04);
            gain.gain.setValueAtTime(0.24, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.05);
          });
          break;
        }

        case '🔥': {
          // Whoosh / fire flame burst
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(320, now);
          filter.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
          filter.frequency.exponentialRampToValueAtTime(200, now + 0.45);
          filter.Q.value = 3.5;
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.exponentialRampToValueAtTime(350, now + 0.18);
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.38, now + 0.12);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        }

        case '👑': {
          // Royal fanfare trumpet arpeggio
          const fanfare = [523.25, 659.25, 783.99, 1046.5];
          fanfare.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + idx * 0.07;
            const dur = idx === 3 ? 0.45 : 0.12;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.28, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + dur);
          });
          break;
        }

        case '😎': {
          // Smooth brass pop / groove riff
          const groove = [392.0, 440.0, 523.25];
          groove.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + idx * 0.08;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.30, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.25);
          });
          break;
        }

        case '💀': {
          // Low spooky rumble / skull rattle
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(120, now);
          osc.frequency.exponentialRampToValueAtTime(38, now + 0.4);
          gain.gain.setValueAtTime(0.40, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.46);
          break;
        }

        case '❤️': {
          // Sweet sparkle chime / harp strum
          const harp = [523.25, 659.25, 783.99, 987.77, 1174.66];
          harp.forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + idx * 0.045;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.26, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.38);
          });
          break;
        }

        case '👍': {
          // Cheerful crisp ascending 'ding!' bell
          [1046.5, 1567.98].forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + idx * 0.06;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.34, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.32);
          });
          break;
        }

        case '🤑': {
          // Cash register
          this.playCash();
          break;
        }

        case '😭': {
          // Sad descending wah-wah / crying drop
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(440, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + 0.45);
          gain.gain.setValueAtTime(0.32, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        }

        case '🎉': {
          // Party horn / confetti celebration pop
          const osc1 = this.ctx.createOscillator();
          const gain1 = this.ctx.createGain();
          osc1.type = 'square';
          osc1.frequency.setValueAtTime(650, now);
          osc1.frequency.linearRampToValueAtTime(920, now + 0.15);
          gain1.gain.setValueAtTime(0.28, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc1.connect(gain1);
          gain1.connect(dest);
          osc1.start(now);
          osc1.stop(now + 0.26);

          [784, 1046.5, 1318.5].forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const t = now + 0.08 + idx * 0.04;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.24, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.28);
          });
          break;
        }

        case '😡': {
          // Angry distorted buzzer / impact grunt
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(130, now);
          osc.frequency.exponentialRampToValueAtTime(65, now + 0.35);
          gain.gain.setValueAtTime(0.26, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        }

        case '🎲': {
          // Dice rattle & roll
          this.playDiceRoll();
          break;
        }

        default: {
          this.playPawnLand();
          break;
        }
      }
    } catch (e) {}
  }

  // 20 Avatar Custom Distress Audio Suite (Triggered on paying cash/rent/tax)
  playDistress(token = 'hat') {
    try {
      const audio = this._prepareSfxContext();
      if (!audio) return;
      const { ctx, dest, now } = audio;

      switch (token) {
        case 'businessman': {
          // Wall Street executive: crisp briefcase thud + descending margin-call ticks
          const thud = ctx.createOscillator();
          const thudGain = ctx.createGain();
          thud.type = 'triangle';
          thud.frequency.setValueAtTime(145, now);
          thud.frequency.exponentialRampToValueAtTime(52, now + 0.14);
          thudGain.gain.setValueAtTime(0.26, now);
          thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
          thud.connect(thudGain);
          thudGain.connect(dest);
          thud.start(now);
          thud.stop(now + 0.18);

          [440, 311.13].forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + 0.08 + idx * 0.09;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(f * 0.88, t + 0.08);
            gain.gain.setValueAtTime(0.14, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.11);
          });
          break;
        }

        case 'businesswoman': {
          // Corporate director: sleek cyber-portfolio "transaction declined" alert
          [1174.66, 830.61, 587.33].forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + idx * 0.065;
            osc.type = idx === 2 ? 'sawtooth' : 'triangle';
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(f * 0.92, t + 0.08);
            gain.gain.setValueAtTime(0.16, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.13);
          });
          break;
        }

        case 'hat': {
          // Aristocratic indignant gasp: descending brass-like tri-tone with vibrato
          [440, 370, 261.6].forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + idx * 0.08;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(f * 0.85, t + 0.18);
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.22);
          });
          break;
        }

        case 'robot': {
          // Violent circuit overload glitch buzz & sparks
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.setValueAtTime(220, now + 0.06);
          osc.frequency.setValueAtTime(1100, now + 0.12);
          osc.frequency.setValueAtTime(140, now + 0.18);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.38);
          break;
        }

        case 'car': {
          // Hard brake tire screech chirp down to stall
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(1850, now);
          osc.frequency.exponentialRampToValueAtTime(320, now + 0.32);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.38);
          break;
        }

        case 'yacht': {
          // Deep groaning foghorn listing drop
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.linearRampToValueAtTime(75, now + 0.45);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        }

        case 'rocket': {
          // Engine sputter stall downward cough sequence
          [420, 290, 180, 95].forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + idx * 0.07;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.06);
            gain.gain.setValueAtTime(0.22, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.08);
          });
          break;
        }

        case 'duck': {
          // Lord Quackers rapid panicky quacking chirp sequence
          [620, 740, 580, 690].forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + idx * 0.08;
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.07);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.09);
          });
          break;
        }

        case 'diamond': {
          // High crystal stress shatter resonance
          [1480, 1920, 2350].forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + idx * 0.04;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t);
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.42);
          });
          break;
        }

        case 'crown': {
          // Sovereign indignant dissonant royal chime
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'sine';
          osc2.type = 'triangle';
          osc1.frequency.setValueAtTime(880, now);
          osc2.frequency.setValueAtTime(932.3, now); // Minor second jarring clash
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(dest);
          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 0.48);
          osc2.stop(now + 0.48);
          break;
        }

        case 'brawler': {
          // Knockout thud & dizzy wobble cartoon tone
          const thudOsc = ctx.createOscillator();
          const thudGain = ctx.createGain();
          thudOsc.type = 'sine';
          thudOsc.frequency.setValueAtTime(120, now);
          thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
          thudGain.gain.setValueAtTime(0.3, now);
          thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          thudOsc.connect(thudGain);
          thudGain.connect(dest);
          thudOsc.start(now);
          thudOsc.stop(now + 0.2);

          const dizzyOsc = ctx.createOscillator();
          const dizzyGain = ctx.createGain();
          dizzyOsc.type = 'sine';
          dizzyOsc.frequency.setValueAtTime(650, now + 0.12);
          dizzyOsc.frequency.linearRampToValueAtTime(420, now + 0.45);
          dizzyGain.gain.setValueAtTime(0.15, now + 0.12);
          dizzyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
          dizzyOsc.connect(dizzyGain);
          dizzyGain.connect(dest);
          dizzyOsc.start(now + 0.12);
          dizzyOsc.stop(now + 0.5);
          break;
        }

        case 'mystic': {
          // Dark purple blackout spectral descending drone
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(480, now);
          osc.frequency.exponentialRampToValueAtTime(140, now + 0.45);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.5);
          break;
        }

        case 'kitten':
        case 'rudolf': {
          // Angry cat screech & hissing swipe
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(980, now);
          osc.frequency.exponentialRampToValueAtTime(440, now + 0.28);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.32);
          break;
        }

        case 'cantino':
        case 'pigeon':
        case 'modeer': {
          // Cantino / Modeer pouty lips agonizing quiver / comical coo
          [392, 440, 370, 311].forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + idx * 0.09;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.linearRampToValueAtTime(f * 0.9, t + 0.08);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.1);
          });
          break;
        }

        case 'llama': {
          // Snooty alpaca indignant spit-snort & haughty descending whistle
          const sr = ctx.sampleRate || 44100;
          const bufLen = Math.max(1, Math.floor(sr * 0.12));
          const noiseBuf = ctx.createBuffer(1, bufLen, sr);
          const data = noiseBuf.getChannelData(0);
          for (let i = 0; i < bufLen; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.03));
          }
          const noise = ctx.createBufferSource();
          noise.buffer = noiseBuf;
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1600, now);
          filter.Q.setValueAtTime(2.5, now);
          const nGain = ctx.createGain();
          nGain.gain.setValueAtTime(0.26, now);
          nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          noise.connect(filter);
          filter.connect(nGain);
          nGain.connect(dest);
          noise.start(now);

          const osc = ctx.createOscillator();
          const oGain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(720, now + 0.08);
          osc.frequency.exponentialRampToValueAtTime(1180, now + 0.16);
          osc.frequency.exponentialRampToValueAtTime(360, now + 0.34);
          oGain.gain.setValueAtTime(0.18, now + 0.08);
          oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
          osc.connect(oGain);
          oGain.connect(dest);
          osc.start(now + 0.08);
          osc.stop(now + 0.38);
          break;
        }

        case 'pug': {
          // Squishy-faced wheezing tycoon pug double snort-wheeze
          [0, 0.17].forEach((offset, idx) => {
            const t = now + offset;
            const osc = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(idx === 0 ? 185 : 155, t);
            osc.frequency.linearRampToValueAtTime(idx === 0 ? 225 : 105, t + 0.12);
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(580, t);
            filter.Q.setValueAtTime(3.2, t);
            gain.gain.setValueAtTime(0.01, t);
            gain.gain.linearRampToValueAtTime(0.24, t + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.16);
          });
          break;
        }

        case 'goose': {
          // Chaotic menace goose aggressive double-HONK!
          [
            { offset: 0, startF: 390, endF: 295, dur: 0.13 },
            { offset: 0.16, startF: 430, endF: 250, dur: 0.2 },
          ].forEach((h) => {
            const t = now + h.offset;
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const filter = ctx.createBiquadFilter();
            const gain = ctx.createGain();
            osc1.type = 'sawtooth';
            osc2.type = 'square';
            osc1.frequency.setValueAtTime(h.startF, t);
            osc1.frequency.exponentialRampToValueAtTime(h.endF, t + h.dur);
            osc2.frequency.setValueAtTime(h.startF * 1.5, t);
            osc2.frequency.exponentialRampToValueAtTime(h.endF * 1.45, t + h.dur);
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(980, t);
            filter.frequency.exponentialRampToValueAtTime(620, t + h.dur);
            filter.Q.setValueAtTime(2.6, t);
            gain.gain.setValueAtTime(0.24, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + h.dur);
            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            osc1.start(t);
            osc2.start(t);
            osc1.stop(t + h.dur + 0.02);
            osc2.stop(t + h.dur + 0.02);
          });
          break;
        }

        case 'sloth': {
          // Unbothered chill sloth slow descending sleepy groan
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(245, now);
          osc.frequency.linearRampToValueAtTime(215, now + 0.18);
          osc.frequency.exponentialRampToValueAtTime(108, now + 0.56);
          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.22, now + 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
          osc.connect(gain);
          gain.connect(dest);
          osc.start(now);
          osc.stop(now + 0.6);
          break;
        }

        case 'lobster': {
          // French chef lobster: double pincer SNAP-SNAP + indignant descending sigh
          [1900, 2350].forEach((f, idx) => {
            const t = now + idx * 0.075;
            const snapOsc = ctx.createOscillator();
            const snapGain = ctx.createGain();
            snapOsc.type = 'square';
            snapOsc.frequency.setValueAtTime(f, t);
            snapOsc.frequency.exponentialRampToValueAtTime(420, t + 0.035);
            snapGain.gain.setValueAtTime(0.2, t);
            snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
            snapOsc.connect(snapGain);
            snapGain.connect(dest);
            snapOsc.start(t);
            snapOsc.stop(t + 0.045);
          });

          const sighOsc = ctx.createOscillator();
          const sighGain = ctx.createGain();
          sighOsc.type = 'sawtooth';
          sighOsc.frequency.setValueAtTime(520, now + 0.16);
          sighOsc.frequency.exponentialRampToValueAtTime(260, now + 0.42);
          sighGain.gain.setValueAtTime(0.16, now + 0.16);
          sighGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);
          sighOsc.connect(sighGain);
          sighGain.connect(dest);
          sighOsc.start(now + 0.16);
          sighOsc.stop(now + 0.46);
          break;
        }

        case 'rainbow_dash':
        case 'unicorn': {
          // Celestial prismatic sparkle / whinny shimmer distress
          [587, 880, 1174, 1760, 1318].forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + idx * 0.07;
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(f * 1.25, t + 0.06);
            gain.gain.setValueAtTime(0.18, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.09);
          });
          break;
        }

        case 'fairydog': {
          // Cheerful cute puppy barks with shimmering magical fairy chimes
          [0, 0.12].forEach((offset, idx) => {
            const t = now + offset;
            const bark = ctx.createOscillator();
            const barkGain = ctx.createGain();
            bark.type = 'triangle';
            const baseFreq = idx === 0 ? 760 : 860;
            bark.frequency.setValueAtTime(baseFreq, t);
            bark.frequency.exponentialRampToValueAtTime(320, t + 0.08);
            barkGain.gain.setValueAtTime(0.24, t);
            barkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
            bark.connect(barkGain);
            barkGain.connect(dest);
            bark.start(t);
            bark.stop(t + 0.10);
          });

          // Cascading ethereal fairy bell chimes
          [1318.5, 1760.0, 2093.0, 2637.0, 3135.9].forEach((f, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const t = now + 0.06 + idx * 0.055;
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, t);
            osc.frequency.exponentialRampToValueAtTime(f * 1.08, t + 0.12);
            gain.gain.setValueAtTime(0.16, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
            osc.connect(gain);
            gain.connect(dest);
            osc.start(t);
            osc.stop(t + 0.28);
          });
          break;
        }

        default: {
          this.playLandingThump();
          break;
        }
      }
    } catch (e) {}
  }
}

export const sounds = new SoundManager();

// Audio System for NextGenGames Board Brawl
// Supports authentic acoustic MP3 samples with Web Audio procedural fallback
// Includes dedicated volume controls and persistent settings for SFX and Music

export const MUSIC_PLAYLIST = [
  { id: 'boardwalk', title: 'Boardwalk Chill', src: '/sound/music/Boardwalk Chill.mp3' },
  { id: 'cashflow', title: 'Cashflow', src: '/sound/music/Cashflow.mp3' },
  { id: 'chance-card', title: 'Chance Card Studio', src: '/sound/music/Chance Card Studio.mp3' },
  { id: 'dice-roll', title: 'Dice Roll Blues', src: '/sound/music/Dice Roll Blues.mp3' },
  { id: 'luxury-tax', title: 'Luxury Tax Lounge', src: '/sound/music/Luxury Tax Lounge.mp3' },
  { id: 'midnight-trade', title: 'Midnight Trade', src: '/sound/music/Midnight Trade.mp3' },
  { id: 'park-place', title: 'Park Place Vibe', src: '/sound/music/Park Place Vibe.mp3' },
  { id: 'pass-go', title: 'Pass GO Relax', src: '/sound/music/Pass GO Relax.mp3' },
  { id: 'property-lounge', title: 'Property Lounge', src: '/sound/music/Property Lounge.mp3' },
  { id: 'reading-railroad', title: 'Reading Railroad Groove', src: '/sound/music/Reading Railroad Groove.mp3' },
  { id: 'domi-beats', title: 'Domi Beats Instrumental Tag', src: '/sound/music/Domi Beats Instrumental Tag.mp3' },
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
        const track = this.playlist[this.currentTrackIndex] || { src: '/sound/background.mp3' };
        this.bgAudio = new Audio(track.src);
        this.bgAudio.loop = false;
        this.bgAudio.addEventListener('ended', () => {
          this.nextTrack();
        });
        this.bgAudio.addEventListener('error', () => {
          if (this.bgAudio && !this.bgAudio.src.endsWith('/sound/background.mp3')) {
            this.bgAudio.src = '/sound/background.mp3';
            this.bgAudio.load();
            if (!this.musicMuted && !this.muted) {
              this.bgAudio.play().catch(() => {});
            }
          }
        });
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

  // Playlist management
  getPlaylist() {
    return this.playlist;
  }

  getCurrentTrack() {
    return this.playlist[this.currentTrackIndex] || this.playlist[0];
  }

  getCurrentTrackIndex() {
    return this.currentTrackIndex;
  }

  setTrack(index) {
    this.init();
    if (index < 0 || index >= this.playlist.length) return;
    this.currentTrackIndex = index;
    this.persistPref('ngg_audio_music_track', String(index));
    const track = this.playlist[index];
    if (this.bgAudio && track) {
      const wasPlaying = !this.musicMuted && !this.muted;
      this.bgAudio.pause();
      this.bgAudio.src = track.src;
      this.bgAudio.load();
      this.updateMusicVolume();
      if (wasPlaying) {
        this.bgAudio.play().catch(e => console.log('Autoplay blocked', e));
      }
    }
    this.notify();
  }

  nextTrack() {
    const nextIdx = (this.currentTrackIndex + 1) % this.playlist.length;
    this.setTrack(nextIdx);
  }

  prevTrack() {
    const prevIdx = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    this.setTrack(prevIdx);
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
    this.playSample('dice', () => {
      if (!this.ctx || this.sfxMuted || this.muted) return;
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(140 + Math.random() * 160, now + i * 0.08);
        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.06);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.06);
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

  playFlightTakeoff() {
    try {
      if (!this.ctx || this.sfxMuted || this.muted) return;
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = Math.max(0, this.ctx.currentTime);
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.6);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      gain.connect(dest);
      osc.start(now);
      osc.stop(now + 0.75);
    } catch (e) {}
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
            gain.gain.setValueAtTime(0.14, t);
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
          gain.gain.linearRampToValueAtTime(0.24, now + 0.12);
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
            gain.gain.setValueAtTime(0.18, t);
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
            gain.gain.setValueAtTime(0.2, t);
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
          gain.gain.setValueAtTime(0.28, now);
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
            gain.gain.setValueAtTime(0.16, t);
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
            gain.gain.setValueAtTime(0.22, t);
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
          gain.gain.setValueAtTime(0.2, now);
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
          gain1.gain.setValueAtTime(0.18, now);
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
            gain.gain.setValueAtTime(0.15, t);
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

  // 12 Avatar Custom Distress Audio Suite (Triggered on paying cash/rent/tax)
  playDistress(token = 'hat') {
    if (!this.ctx || this.sfxMuted || this.muted) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      const dest = this.getSfxDestination();
      if (!dest) return;
      const now = this.ctx.currentTime;

      switch (token) {
        case 'hat': {
          // Aristocratic indignant gasp: descending brass-like tri-tone with vibrato
          [440, 370, 261.6].forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
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
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
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
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
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
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
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
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
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
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
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
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
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
          const osc1 = this.ctx.createOscillator();
          const osc2 = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
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
          const thudOsc = this.ctx.createOscillator();
          const thudGain = this.ctx.createGain();
          thudOsc.type = 'sine';
          thudOsc.frequency.setValueAtTime(120, now);
          thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
          thudGain.gain.setValueAtTime(0.3, now);
          thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
          thudOsc.connect(thudGain);
          thudGain.connect(dest);
          thudOsc.start(now);
          thudOsc.stop(now + 0.2);

          const dizzyOsc = this.ctx.createOscillator();
          const dizzyGain = this.ctx.createGain();
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
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
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
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
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

        case 'pigeon': {
          // Cantino pouty lips agonizing quiver / comical coo
          [392, 440, 370, 311].forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
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

        default: {
          this.playLandingThump();
          break;
        }
      }
    } catch (e) {}
  }
}

export const sounds = new SoundManager();

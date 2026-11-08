// Audio System for NextGenGames Board Brawl
// Supports authentic acoustic MP3 samples with Web Audio procedural fallback
// Includes dedicated volume controls and persistent settings for SFX and Music

class SoundManager {
  constructor() {
    this.ctx = null;
    this.sfxGainNode = null;
    this.bgAudio = null;
    this.sampleCache = {};
    this.listeners = new Set();

    // Default volume levels (0.0 to 1.0)
    this.sfxVolume = 0.8;
    this.musicVolume = 0.45;
    this.sfxMuted = false;
    this.musicMuted = true; // browser autoplay policies start muted by default
    this.muted = false; // master mute

    // Load saved preferences if in browser
    if (typeof window !== 'undefined') {
      try {
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
      } catch (e) {
        console.warn('Background music could not be initialized', e);
      }
    }
  }

  updateSfxGain() {
    if (!this.ctx || !this.sfxGainNode) return;
    const effectiveVol = (this.muted || this.sfxMuted) ? 0 : this.sfxVolume;
    try {
      this.sfxGainNode.gain.setValueAtTime(effectiveVol, this.ctx.currentTime);
    } catch (e) {
      this.sfxGainNode.gain.value = effectiveVol;
    }
  }

  updateMusicVolume() {
    if (!this.bgAudio) return;
    const effectiveVol = (this.muted || this.musicMuted) ? 0 : (this.musicVolume * 0.5);
    this.bgAudio.volume = Math.max(0, Math.min(1, effectiveVol));
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
    if (!this.ctx || this.sfxMuted || this.muted) return;
    const dest = this.getSfxDestination();
    if (!dest) return;
    const now = this.ctx.currentTime;
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
  }

  playTomatoSplat() {
    if (!this.ctx || this.sfxMuted || this.muted) return;
    const dest = this.getSfxDestination();
    if (!dest) return;
    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.05));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noise.connect(noiseGain);
    noiseGain.connect(dest);
    noise.start(now);
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
}

export const sounds = new SoundManager();

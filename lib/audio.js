// Audio System for NextGenGames Board Brawl
// Supports authentic acoustic MP3 samples with Web Audio procedural fallback

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicMuted = true; // start muted for browser autoplay policies
    this.bgAudio = null;
    this.sampleCache = {};
  }

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.bgAudio && typeof Audio !== 'undefined') {
      try {
        this.bgAudio = new Audio('/sound/background.mp3');
        this.bgAudio.loop = true;
        this.bgAudio.volume = 0.22;
      } catch (e) {
        console.warn('Background music could not be initialized', e);
      }
    }
  }

  toggleMusic() {
    this.init();
    this.musicMuted = !this.musicMuted;
    if (this.bgAudio) {
      if (this.musicMuted) {
        this.bgAudio.pause();
      } else {
        this.bgAudio.play().catch(e => console.log('Autoplay blocked', e));
      }
    }
    return !this.musicMuted;
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted && this.bgAudio) {
      this.bgAudio.pause();
    }
    return !this.muted;
  }

  playSample(name, fallbackFn) {
    this.init();
    if (this.muted) return;
    if (typeof Audio !== 'undefined') {
      try {
        let snd = this.sampleCache[name];
        if (!snd) {
          snd = new Audio(`/sound/${name}.mp3`);
          snd.volume = 0.6;
          this.sampleCache[name] = snd;
        }
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

  playDiceRoll() {
    this.playSample('dice', () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      for (let i = 0; i < 6; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.frequency.setValueAtTime(140 + Math.random() * 160, now + i * 0.08);
        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.06);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
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

  playCash() {
    this.playSample('cash', () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.36);
    });
  }

  playPawnStep() {
    this.playSample('move', () => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.06);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    });
  }

  playDoublesSurge() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(f, now + idx * 0.05);
      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + 0.65);
    });
  }

  playTomatoThrow() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(700, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  playTomatoSplat() {
    if (!this.ctx || this.muted) return;
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
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  playBuyout() {
    this.playCash();
  }
}

export const sounds = new SoundManager();
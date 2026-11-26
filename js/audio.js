/**
 * Tactile Web Audio synthesizer for Crownward.
 * Produces wooden chess clacks, bronze cannon booms, diagonal sunbeams,
 * glacial chimes, and royal fanfare with zero external audio downloads.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('crownward_muted') === '1';
    this.lastPlayed = {};
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('crownward_muted', this.muted ? '1' : '0');
    return this.muted;
  }

  _canPlay(key, minGapMs = 45) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return false;
    const now = performance.now();
    if (now - (this.lastPlayed[key] || 0) < minGapMs) return false;
    this.lastPlayed[key] = now;
    return true;
  }

  _tone(freq, endFreq, duration, type = 'triangle', gainVal = 0.14, delay = 0) {
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t + duration);
    }
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(gainVal, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  _noise(duration, filterFreq = 900, gainVal = 0.12, delay = 0) {
    const t = this.ctx.currentTime + delay;
    const sampleRate = this.ctx.sampleRate;
    const length = Math.max(1, Math.floor(sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.35));
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainVal, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);
  }

  playPlace() {
    if (!this._canPlay('place', 60)) return;
    // Crisp solid wooden chess piece clack on marble
    this._tone(185, 92, 0.075, 'triangle', 0.24);
    this._tone(640, 310, 0.04, 'sine', 0.12);
    this._noise(0.045, 1600, 0.14);
  }

  playSelect() {
    if (!this._canPlay('select', 40)) return;
    this._tone(520, 620, 0.05, 'sine', 0.08);
  }

  playUpgrade() {
    if (!this._canPlay('upgrade', 80)) return;
    this._tone(440, 440, 0.14, 'triangle', 0.14, 0);
    this._tone(554.37, 554.37, 0.16, 'triangle', 0.14, 0.06);
    this._tone(659.25, 659.25, 0.24, 'triangle', 0.16, 0.12);
    this._tone(880, 880, 0.3, 'sine', 0.12, 0.18);
  }

  playSell() {
    if (!this._canPlay('sell', 80)) return;
    this._tone(740, 560, 0.09, 'sine', 0.12, 0);
    this._tone(980, 1180, 0.12, 'sine', 0.1, 0.05);
  }

  playAttack(attackType) {
    if (!this._canPlay(`atk_${attackType}`, 55)) return;
    switch (attackType) {
      case 'spear':
        this._tone(480, 190, 0.08, 'triangle', 0.1);
        this._noise(0.04, 2400, 0.06);
        break;
      case 'leap_slam':
        this._tone(150, 55, 0.18, 'sine', 0.2);
        this._noise(0.14, 700, 0.14);
        break;
      case 'diagonal_beam':
        this._tone(760, 1140, 0.14, 'sine', 0.11);
        this._tone(380, 570, 0.14, 'triangle', 0.08);
        break;
      case 'cannon_line':
        this._tone(135, 38, 0.24, 'sawtooth', 0.16);
        this._noise(0.2, 520, 0.2);
        break;
      case 'royal_volley':
        this._tone(680, 960, 0.1, 'triangle', 0.1);
        this._tone(1020, 720, 0.09, 'sine', 0.08, 0.03);
        break;
      case 'aura_smite':
        this._tone(310, 160, 0.18, 'sawtooth', 0.11);
        this._tone(620, 880, 0.14, 'triangle', 0.09);
        break;
      case 'frost_pulse':
        this._tone(1180, 620, 0.22, 'sine', 0.1);
        this._tone(1640, 920, 0.18, 'triangle', 0.07, 0.03);
        break;
      default:
        this._tone(420, 260, 0.08, 'triangle', 0.08);
    }
  }

  playEnemyKill() {
    if (!this._canPlay('kill', 50)) return;
    this._tone(240, 110, 0.09, 'triangle', 0.09);
    this._tone(860, 1120, 0.08, 'sine', 0.06, 0.03);
  }

  playLeak() {
    if (!this._canPlay('leak', 120)) return;
    this._tone(190, 95, 0.25, 'sawtooth', 0.18);
    this._tone(140, 75, 0.3, 'triangle', 0.14, 0.08);
  }

  playWaveStart(hasBoss = false) {
    if (!this._canPlay('wave', 150)) return;
    if (hasBoss) {
      this._tone(130.8, 123.5, 0.55, 'sawtooth', 0.16, 0);
      this._tone(196, 185, 0.55, 'triangle', 0.14, 0.08);
    } else {
      this._tone(330, 330, 0.12, 'triangle', 0.12, 0);
      this._tone(440, 440, 0.2, 'triangle', 0.14, 0.1);
    }
  }

  playVictory() {
    if (!this._canPlay('victory', 300)) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => this._tone(n, n, 0.32, 'triangle', 0.16, i * 0.1));
  }

  playDefeat() {
    if (!this._canPlay('defeat', 300)) return;
    const notes = [349.23, 311.13, 277.18, 220];
    notes.forEach((n, i) => this._tone(n, n, 0.34, 'sawtooth', 0.12, i * 0.14));
  }
}

export const sound = new SoundEngine();

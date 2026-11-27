/**
 * Tactile Tower Defense Audio & Soundtrack Engine for TowerDeChess.
 *
 * Features:
 * - Punchy, grounded TD combat foley (blades, heavy cannons, stone impacts,
 *   arcane sears, shattering ice, subtle armor clinks) through a master compressor.
 * - Streamed orchestral soundtrack ("Before the Gates Break") on a looping media element,
 *   routed through the Web Audio graph so Prep / Battle / Boss intensity, pause ducking
 *   and the Music toggle all crossfade smoothly.
 * - Stereo concert-hall convolution reverb for War Horn promotion calls.
 */

import { getMusicUrl } from './assets.js';

export const MUSIC_TRACK = {
  file: 'before_the_gates_break',
  name: 'Before the Gates Break',
  subtitle: 'Main Theme',
};

// Soundtrack gain per music intensity (mirrors the old adaptive orchestral layers)
const MUSIC_LEVELS = { prep: 0.28, battle: 0.36, boss: 0.42 };
const MUSIC_DUCK_FACTOR = 0.35;
const MUSIC_FADE_TIME_CONSTANT = 0.08;
// Wait for the gain fade (~5 time constants) to finish before pausing the stream
const MUSIC_PAUSE_DELAY_MS = 450;

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.reverbNode = null;
    this.noiseBuffer = null;

    this.sfxMuted = localStorage.getItem('towerdechess_muted') === '1';
    this.musicMuted = localStorage.getItem('towerdechess_music_muted') === '1';
    this.lastPlayed = {};

    // Streamed soundtrack state
    this.musicEl = null;
    this.musicSource = null;
    this.musicIntensity = 'off'; // 'off' | 'prep' | 'battle' | 'boss'
    this.musicDucked = false;
    this.musicPauseTimer = null;
    this.pageHidden = typeof document !== 'undefined' && document.hidden;

    if (typeof document !== 'undefined') {
      // Never keep the soundtrack running while the app is backgrounded
      document.addEventListener('visibilitychange', () => {
        this.pageHidden = document.hidden;
        if (this.pageHidden) {
          this._clearMusicPauseTimer();
          this.musicEl?.pause();
        } else {
          this._syncMusic();
        }
      });
    }
  }

  // Legacy getter for compatibility
  get muted() {
    return this.sfxMuted;
  }

  getCurrentTrack() {
    return MUSIC_TRACK;
  }

  /** Rewinds the soundtrack so a level or cinematic starts from the opening bars. */
  restartMusic() {
    if (!this.musicEl) return;
    try {
      this.musicEl.currentTime = 0;
    } catch {
      // Ignore seeks attempted before metadata is available
    }
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Master compressor keeps intense waves + soundtrack lush and distortion-free
        const comp = this.ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.knee.value = 18;
        comp.ratio.value = 4.2;
        comp.attack.value = 0.004;
        comp.release.value = 0.16;
        comp.connect(this.ctx.destination);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.92;
        this.masterGain.connect(comp);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this.sfxMuted ? 0 : 0.95;
        this.sfxGain.connect(this.masterGain);

        // Stereo concert-hall reverb return for War Horn tails (lives on the SFX bus)
        this.reverbNode = this.ctx.createConvolver();
        this.reverbNode.buffer = this._createHallImpulse(2.15, 2.8);
        const reverbReturn = this.ctx.createGain();
        reverbReturn.gain.value = 0.16;
        this.reverbNode.connect(reverbReturn);
        reverbReturn.connect(this.sfxGain);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0;
        this.musicGain.connect(this.masterGain);

        this._createNoiseBuffer();
      }
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this._ensureMusicElement();
    this._syncMusic();
  }

  _createHallImpulse(durationSec = 2.15, decay = 2.8) {
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * durationSec);
    const impulse = this.ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const env = Math.pow(1 - i / len, decay);
        // Warm low-passed concert-hall reflections (removes metallic hiss)
        const white = Math.random() * 2 - 1;
        lp = lp * 0.72 + white * 0.28;
        data[i] = lp * env;
      }
      // Early hall reflections for cinematic room width
      const erOffsets = ch === 0 ? [0.017, 0.036, 0.061] : [0.021, 0.043, 0.069];
      for (const sec of erOffsets) {
        const idx = Math.floor(sec * sr);
        if (idx < len) data[idx] += 0.32 * (1 - sec * 6);
      }
    }
    return impulse;
  }

  _createNoiseBuffer() {
    const sr = this.ctx.sampleRate;
    const len = sr * 1.5;
    const buf = this.ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buf;
  }

  setSfxMuted(muted) {
    this.sfxMuted = Boolean(muted);
    localStorage.setItem('towerdechess_muted', this.sfxMuted ? '1' : '0');
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxMuted ? 0 : 0.95, this.ctx.currentTime, 0.02);
    }
    return this.sfxMuted;
  }

  toggleMute() {
    return this.setSfxMuted(!this.sfxMuted);
  }

  setMusicMuted(muted) {
    this.musicMuted = Boolean(muted);
    localStorage.setItem('towerdechess_music_muted', this.musicMuted ? '1' : '0');
    this._syncMusic();
    return this.musicMuted;
  }

  toggleMusic() {
    return this.setMusicMuted(!this.musicMuted);
  }

  setMusicIntensity(mode) {
    this.musicIntensity = mode;
    this._syncMusic();
  }

  setMusicDucked(ducked) {
    this.musicDucked = ducked;
    this._syncMusic();
  }

  // ==================== STREAMED SOUNDTRACK ====================

  _ensureMusicElement() {
    if (this.musicEl || typeof Audio === 'undefined') return this.musicEl;
    const url = getMusicUrl(MUSIC_TRACK.file);
    if (!url) return null;

    const el = new Audio();
    el.loop = true;
    el.preload = 'auto';
    el.src = url;
    this.musicEl = el;

    if (this.ctx && this.musicGain) {
      try {
        this.musicSource = this.ctx.createMediaElementSource(el);
        this.musicSource.connect(this.musicGain);
      } catch {
        // Fall back to element volume if the stream cannot join the audio graph
        this.musicSource = null;
      }
    }
    if (!this.musicSource) el.volume = 0;
    return el;
  }

  _musicTargetGain() {
    if (this.musicMuted || this.musicIntensity === 'off') return 0;
    const base = MUSIC_LEVELS[this.musicIntensity] ?? MUSIC_LEVELS.battle;
    return this.musicDucked ? base * MUSIC_DUCK_FACTOR : base;
  }

  _clearMusicPauseTimer() {
    if (this.musicPauseTimer) {
      clearTimeout(this.musicPauseTimer);
      this.musicPauseTimer = null;
    }
  }

  _syncMusic() {
    const el = this.musicEl;
    if (!el) return;
    const target = this._musicTargetGain();

    if (this.musicSource && this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, MUSIC_FADE_TIME_CONSTANT);
    } else {
      el.volume = target;
    }

    if (target > 0 && !this.pageHidden) {
      this._clearMusicPauseTimer();
      if (el.paused) el.play().catch(() => {});
    } else if (!el.paused && !this.musicPauseTimer) {
      // Let the fade-out finish, then stop streaming to save battery
      this.musicPauseTimer = setTimeout(() => {
        this.musicPauseTimer = null;
        if (this._musicTargetGain() === 0 || this.pageHidden) el.pause();
      }, MUSIC_PAUSE_DELAY_MS);
    }
  }

  _canPlay(key, minGapMs = 45) {
    if (this.sfxMuted || !this.ctx || this.ctx.state !== 'running') return false;
    const now = performance.now();
    if (now - (this.lastPlayed[key] || 0) < minGapMs) return false;
    this.lastPlayed[key] = now;
    return true;
  }

  // ==================== LOW-LEVEL SYNTH PRIMITIVES ====================

  _tone(freq, endFreq, dur, type, vol, delay = 0, filterFreq = null, dest = null) {
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(18, endFreq), t + dur);
    }

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + Math.min(0.006, dur * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    if (filterFreq) {
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(filterFreq, t);
      osc.connect(f);
      f.connect(gain);
    } else {
      osc.connect(gain);
    }

    gain.connect(dest || this.sfxGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  _noiseBurst(dur, filterType, freqStart, freqEnd, vol, q = 1.0, delay = 0, dest = null) {
    if (!this.noiseBuffer) return;
    const t = this.ctx.currentTime + delay;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.Q.value = q;
    filter.frequency.setValueAtTime(freqStart, t);
    if (freqEnd !== freqStart) {
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqEnd), t + dur);
    }

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest || this.sfxGain);

    const offset = Math.random() * 0.6;
    src.start(t, offset, dur + 0.02);
  }

  // ==================== TACTILE TOWER DEFENSE SFX ====================

  playPlace() {
    if (!this._canPlay('place', 60)) return;
    // Crisp solid mahogany-on-marble chess clack
    this._tone(165, 72, 0.065, 'triangle', 0.28);
    this._noiseBurst(0.032, 'bandpass', 1500, 900, 0.22, 1.8);
    this._noiseBurst(0.02, 'highpass', 3200, 2600, 0.08, 1.0);
  }

  playSelect() {
    if (!this._canPlay('select', 40)) return;
    // Crisp wooden tick
    this._noiseBurst(0.018, 'bandpass', 2200, 1600, 0.1, 2.5);
    this._tone(340, 260, 0.028, 'triangle', 0.08);
  }

  playUpgrade(tier = 2) {
    if (!this._canPlay('upgrade', 120)) return;
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const isGrand = tier >= 3;

    // Helper to blow a resonant brass war horn voice with breath attack & filter flare
    const blowHorn = (freq, startOffset, duration, peakGain) => {
      const t0 = now + startOffset;
      const tEnd = t0 + duration;

      // Two slightly detuned brassy sawtooths + warm sub-triangle body
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const sub = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      sub.type = 'triangle';

      // Slight upward pitch scoop on breath onset like a real blown horn
      osc1.frequency.setValueAtTime(freq * 0.94, t0);
      osc1.frequency.exponentialRampToValueAtTime(freq, t0 + 0.085);
      osc1.frequency.setValueAtTime(freq, tEnd - 0.16);
      osc1.frequency.exponentialRampToValueAtTime(freq * 0.988, tEnd);

      osc2.frequency.setValueAtTime(freq * 0.943, t0);
      osc2.frequency.exponentialRampToValueAtTime(freq * 1.005, t0 + 0.09);

      sub.frequency.setValueAtTime(freq * 0.5, t0);

      // Subtle slow vibrato on sustained horn blast
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(4.8, t0);
      lfoGain.gain.setValueAtTime(freq * 0.008, t0);
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);

      // Brass bell filter swell (dark -> bright brassy flare -> warm settle)
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(2.6, t0);
      filter.frequency.setValueAtTime(260, t0);
      filter.frequency.exponentialRampToValueAtTime(1450, t0 + 0.16);
      filter.frequency.exponentialRampToValueAtTime(620, tEnd);

      const env = this.ctx.createGain();
      env.gain.setValueAtTime(0.0001, t0);
      env.gain.linearRampToValueAtTime(peakGain, t0 + 0.11);
      env.gain.setValueAtTime(peakGain * 0.92, tEnd - 0.24);
      env.gain.exponentialRampToValueAtTime(0.0001, tEnd);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.42, t0);

      osc1.connect(filter);
      osc2.connect(filter);
      sub.connect(subGain);
      subGain.connect(filter);
      filter.connect(env);

      // Dry battlefield punch + echoing hall reverb tail
      env.connect(this.sfxGain);
      if (this.reverbNode) {
        const wetSend = this.ctx.createGain();
        wetSend.gain.setValueAtTime(0.55, t0);
        env.connect(wetSend);
        wetSend.connect(this.reverbNode);
      }

      osc1.start(t0);
      osc2.start(t0);
      sub.start(t0);
      lfo.start(t0);
      osc1.stop(tEnd + 0.04);
      osc2.stop(tEnd + 0.04);
      sub.stop(tEnd + 0.04);
      lfo.stop(tEnd + 0.04);
    };

    // Breathy air rush at horn mouthpiece attack
    this._noiseBurst(0.14, 'bandpass', 540, 820, 0.09, 2.2, 0);

    if (isGrand) {
      // Rank III: Heroic two-call Royal War Horn (D3 -> triumphant A3 + D4 octave)
      blowHorn(146.83, 0.0, 0.36, 0.24);
      blowHorn(220.0, 0.24, 0.72, 0.22);
      blowHorn(293.66, 0.26, 0.68, 0.14);
    } else {
      // Rank II: Deep resonant Battlefield War Horn (D3 + warm A3 fifth)
      blowHorn(146.83, 0.0, 0.72, 0.25);
      blowHorn(220.0, 0.05, 0.66, 0.15);
    }
  }

  playSell() {
    if (!this._canPlay('sell', 80)) return;
    // Crisp coin pouch clink
    this._tone(2150, 2100, 0.07, 'sine', 0.09, 0);
    this._tone(2880, 2840, 0.09, 'sine', 0.08, 0.045);
    this._noiseBurst(0.04, 'highpass', 4500, 3800, 0.06, 1.0, 0.01);
  }

  playAttack(attackType) {
    if (!this._canPlay(`atk_${attackType}`, 55)) return;
    switch (attackType) {
      case 'spear':
        // Sharp spear/blade thrust (metallic swish + tight thwack, zero cartoon whistle)
        this._noiseBurst(0.055, 'highpass', 2600, 1400, 0.14, 1.4);
        this._tone(210, 88, 0.045, 'triangle', 0.13);
        break;

      case 'leap_slam':
        // Quick armored launch whoosh (heavy impact plays separately on landing!)
        this._noiseBurst(0.11, 'bandpass', 480, 1150, 0.12, 1.2);
        this._tone(140, 90, 0.08, 'triangle', 0.1);
        break;

      case 'diagonal_beam':
        // Focused arcane sunbeam sear (crisp resonant shimmer + sizzle)
        this._noiseBurst(0.14, 'bandpass', 2800, 1600, 0.11, 2.2);
        this._tone(587.33, 587.33, 0.15, 'sawtooth', 0.065, 0, 2000);
        this._tone(880, 880, 0.13, 'triangle', 0.065, 0, 2400);
        break;

      case 'cannon_line':
        // Classic heavy artillery cannon fire (deep punchy thoom + gunpowder crack)
        this._tone(118, 34, 0.22, 'triangle', 0.32);
        this._tone(82, 28, 0.18, 'sine', 0.26);
        this._noiseBurst(0.2, 'lowpass', 950, 220, 0.28, 0.9);
        this._noiseBurst(0.045, 'bandpass', 1800, 700, 0.16, 1.0);
        break;

      case 'royal_volley':
        // Crisp arcane crossbow/bolt release snap
        this._noiseBurst(0.045, 'bandpass', 3200, 1800, 0.12, 2.0);
        this._tone(987.77, 740, 0.065, 'triangle', 0.085, 0, 2600);
        this._tone(1480, 1175, 0.055, 'sine', 0.06, 0.015);
        break;

      case 'aura_smite':
        // Heavy thunderclap strike + royal anvil ring
        this._noiseBurst(0.18, 'lowpass', 2400, 340, 0.24, 0.8);
        this._tone(130, 42, 0.22, 'sawtooth', 0.16, 0, 600);
        this._tone(587.33, 587.33, 0.16, 'triangle', 0.08, 0.01, 2200);
        break;

      case 'frost_pulse':
        // Crisp ice-crystal nova shatter
        this._noiseBurst(0.16, 'highpass', 3800, 2200, 0.13, 1.5);
        this._tone(2349, 1760, 0.09, 'sine', 0.075, 0);
        this._tone(3136, 2637, 0.1, 'sine', 0.06, 0.025);
        this._noiseBurst(0.14, 'bandpass', 900, 420, 0.08, 1.2);
        break;

      default:
        this._noiseBurst(0.04, 'bandpass', 1800, 900, 0.1, 1.5);
    }
  }

  playImpact(kind) {
    if (!this._canPlay(`imp_${kind}`, 50)) return;
    if (kind === 'cannonball') {
      // Heavy siege shell detonation
      this._tone(95, 28, 0.26, 'sine', 0.3);
      this._noiseBurst(0.28, 'lowpass', 1200, 180, 0.3, 0.8);
      this._noiseBurst(0.06, 'bandpass', 2200, 900, 0.14, 1.2);
    } else if (kind === 'knight_arc') {
      // Heavy warhorse shockwave slam on stone
      this._tone(110, 36, 0.18, 'triangle', 0.28);
      this._noiseBurst(0.15, 'lowpass', 1100, 280, 0.22, 1.0);
      this._noiseBurst(0.04, 'bandpass', 2600, 1500, 0.1, 2.0);
    }
  }

  playHit(isCrit = false, isArmored = false) {
    if (!this._canPlay(isCrit ? 'hit_crit' : 'hit', 42)) return;
    if (isCrit) {
      // Crisp critical blade-crunch
      this._noiseBurst(0.045, 'highpass', 3200, 1800, 0.12, 1.4);
      this._tone(280, 110, 0.055, 'triangle', 0.14);
      this._tone(1174.66, 1174.66, 0.065, 'sine', 0.06, 0.01);
    } else if (isArmored) {
      // Metallic armor deflection tink
      this._noiseBurst(0.03, 'bandpass', 3600, 2800, 0.09, 4.0);
      this._tone(1640, 1420, 0.035, 'triangle', 0.055);
    } else {
      // Crisp grounded physical impact thud (classic TD hit!)
      this._tone(155, 68, 0.04, 'triangle', 0.11);
      this._noiseBurst(0.026, 'bandpass', 1200, 650, 0.09, 1.4);
    }
  }

  playEnemyKill(isBoss = false) {
    if (!this._canPlay(isBoss ? 'boss_kill' : 'kill', 45)) return;
    if (isBoss) {
      this._tone(90, 24, 0.45, 'sawtooth', 0.26, 0, 500);
      this._noiseBurst(0.45, 'lowpass', 1400, 160, 0.3, 0.8);
      this._tone(587.33, 587.33, 0.35, 'triangle', 0.14, 0.1);
      this._tone(880, 880, 0.4, 'triangle', 0.14, 0.18);
      return;
    }
    // Stone obsidian crumble + delicate subtle coin clink
    this._noiseBurst(0.075, 'bandpass', 1100, 420, 0.12, 1.2);
    this._tone(130, 52, 0.065, 'triangle', 0.11);
    this._tone(2480, 2420, 0.05, 'sine', 0.045, 0.02);
  }

  playLeak() {
    if (!this._canPlay('leak', 120)) return;
    // Heavy fortress gate impact thud + grim low brass warning
    this._tone(120, 44, 0.28, 'sawtooth', 0.22, 0, 450);
    this._noiseBurst(0.18, 'lowpass', 700, 180, 0.22, 1.0);
    this._tone(146.83, 138.59, 0.26, 'sawtooth', 0.14, 0.05, 700);
  }

  playWaveStart(hasBoss = false) {
    if (!this._canPlay('wave', 150)) return;
    if (hasBoss) {
      // Dread war-horn brass fifth (D2 + A2) + war drum hit
      this._tone(146.83, 143, 0.72, 'sawtooth', 0.18, 0, 620);
      this._tone(220, 214, 0.72, 'sawtooth', 0.14, 0.04, 780);
      this._tone(100, 34, 0.28, 'triangle', 0.28, 0);
      this._noiseBurst(0.22, 'lowpass', 800, 200, 0.2, 0.9, 0);
    } else {
      // Tactical war horn call (A3 -> D4)
      this._tone(220, 220, 0.15, 'sawtooth', 0.11, 0, 950);
      this._tone(293.66, 293.66, 0.28, 'sawtooth', 0.13, 0.12, 1150);
      this._tone(110, 48, 0.14, 'triangle', 0.18, 0.12);
    }
  }

  playVictory() {
    if (!this._canPlay('victory', 300)) return;
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((n, i) => {
      this._tone(n, n, 0.38, 'triangle', 0.15, i * 0.095, 2800);
      this._tone(n * 0.5, n * 0.5, 0.38, 'sawtooth', 0.06, i * 0.095, 1400);
    });
  }

  playDefeat() {
    if (!this._canPlay('defeat', 300)) return;
    const notes = [293.66, 277.18, 261.63, 220];
    notes.forEach((n, i) => this._tone(n, n * 0.98, 0.36, 'sawtooth', 0.12, i * 0.15, 780));
  }
}

export const sound = new SoundEngine();

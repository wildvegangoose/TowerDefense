/**
 * Tactile Tower Defense Audio & Cinematographic Orchestral Music Engine for TowerDeChess.
 *
 * Features:
 * - Punchy, grounded TD combat foley (blades, heavy cannons, stone impacts,
 *   arcane sears, shattering ice, subtle armor clinks) through a master compressor.
 * - 3 alternating Cinematographic Orchestral Suites routed through a stereo concert-hall
 *   convolution reverb bus with adaptive Prep / Battle / Boss intensity layers.
 */

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const CINEMATIC_SUITES = [
  {
    id: 'ivory_crown',
    name: 'March of the Ivory Crown',
    subtitle: 'Heroic Fantasy Epic • D Minor',
    bpm: 124,
    // Dm | Bb | F | C | Dm | Gm | Bb | A7
    chords: [
      { root: 38, pad: [50, 57, 62, 65], arp: [50, 57, 62, 65, 69] },
      { root: 34, pad: [46, 53, 58, 62], arp: [46, 53, 58, 62, 65] },
      { root: 41, pad: [48, 53, 57, 60], arp: [48, 53, 57, 60, 65] },
      { root: 36, pad: [48, 55, 60, 64], arp: [48, 55, 60, 64, 67] },
      { root: 38, pad: [50, 57, 62, 65], arp: [50, 57, 62, 65, 69] },
      { root: 43, pad: [50, 55, 58, 62], arp: [50, 55, 58, 62, 67] },
      { root: 34, pad: [46, 53, 58, 62], arp: [46, 53, 58, 62, 65] },
      { root: 45, pad: [49, 55, 57, 61], arp: [49, 55, 57, 61, 64] },
    ],
    // Expressive soaring French horn & violin film motif
    melody: [
      [62, 0, 0, 0, 65, 0, 67, 0, 69, 0, 0, 0, 67, 0, 65, 0],
      [62, 0, 0, 0, 0, 0, 65, 0, 70, 0, 0, 0, 69, 0, 65, 0],
      [69, 0, 0, 0, 72, 0, 0, 0, 70, 0, 69, 0, 67, 0, 65, 0],
      [67, 0, 0, 0, 0, 0, 64, 0, 67, 0, 0, 0, 0, 0, 69, 0],
      [74, 0, 0, 0, 72, 0, 70, 0, 69, 0, 0, 0, 65, 0, 69, 0],
      [70, 0, 0, 0, 74, 0, 0, 0, 72, 0, 70, 0, 69, 0, 67, 0],
      [70, 0, 0, 0, 69, 0, 67, 0, 65, 0, 0, 0, 62, 0, 65, 0],
      [69, 0, 0, 0, 67, 0, 64, 0, 61, 0, 0, 0, 64, 0, 69, 0],
    ],
    style: 'heroic',
  },
  {
    id: 'obsidian_rift',
    name: 'Nocturne of the Obsidian Rift',
    subtitle: 'Dark Atmospheric Cinema • F# Minor',
    bpm: 108,
    // F#m | D | A | E | F#m | D | Bm | C#7
    chords: [
      { root: 42, pad: [54, 57, 61, 66], arp: [66, 61, 57, 61, 69] },
      { root: 38, pad: [50, 54, 57, 62], arp: [62, 57, 54, 57, 66] },
      { root: 45, pad: [52, 57, 61, 64], arp: [64, 61, 57, 61, 69] },
      { root: 40, pad: [52, 56, 59, 64], arp: [64, 59, 56, 59, 68] },
      { root: 42, pad: [54, 57, 61, 66], arp: [66, 61, 57, 61, 69] },
      { root: 38, pad: [50, 54, 57, 62], arp: [62, 57, 54, 57, 66] },
      { root: 35, pad: [47, 54, 59, 62], arp: [62, 59, 54, 59, 66] },
      { root: 37, pad: [49, 53, 56, 61], arp: [61, 56, 53, 56, 65] },
    ],
    // Haunting brooding low-brass & solo cello cinematic melody
    melody: [
      [66, 0, 0, 0, 0, 0, 69, 0, 68, 0, 0, 0, 66, 0, 61, 0],
      [62, 0, 0, 0, 0, 0, 66, 0, 69, 0, 0, 0, 66, 0, 0, 0],
      [73, 0, 0, 0, 71, 0, 69, 0, 68, 0, 0, 0, 64, 0, 0, 0],
      [68, 0, 0, 0, 66, 0, 64, 0, 61, 0, 0, 0, 64, 0, 68, 0],
      [73, 0, 0, 0, 0, 0, 76, 0, 74, 0, 0, 0, 73, 0, 69, 0],
      [74, 0, 0, 0, 73, 0, 71, 0, 69, 0, 0, 0, 66, 0, 0, 0],
      [71, 0, 0, 0, 74, 0, 0, 0, 73, 0, 71, 0, 69, 0, 66, 0],
      [68, 0, 0, 0, 0, 0, 65, 0, 61, 0, 0, 0, 65, 0, 68, 0],
    ],
    style: 'nocturne',
  },
  {
    id: 'crimson_citadel',
    name: 'Siege of the Crimson Citadel',
    subtitle: 'Relentless Action Score • C Minor',
    bpm: 134,
    // Cm | Ab | Eb | Bb | Cm | Fm | Ab | G7
    chords: [
      { root: 36, pad: [48, 55, 60, 63], arp: [48, 55, 60, 63, 67] },
      { root: 32, pad: [44, 51, 56, 60], arp: [44, 51, 56, 60, 63] },
      { root: 39, pad: [51, 55, 58, 63], arp: [51, 55, 58, 63, 67] },
      { root: 34, pad: [46, 53, 58, 62], arp: [46, 53, 58, 62, 65] },
      { root: 36, pad: [48, 55, 60, 63], arp: [48, 55, 60, 63, 67] },
      { root: 41, pad: [48, 53, 56, 60], arp: [48, 53, 56, 60, 65] },
      { root: 32, pad: [44, 51, 56, 60], arp: [44, 51, 56, 60, 63] },
      { root: 43, pad: [47, 53, 55, 59], arp: [47, 53, 55, 59, 62] },
    ],
    // Driving Zimmer-style 3+3+2 heroic action brass motif
    melody: [
      [72, 0, 0, 75, 0, 0, 74, 0, 72, 0, 0, 67, 72, 0, 74, 0],
      [75, 0, 0, 79, 0, 0, 77, 0, 75, 0, 0, 72, 68, 0, 0, 0],
      [79, 0, 0, 77, 0, 0, 75, 0, 74, 0, 0, 70, 75, 0, 0, 0],
      [74, 0, 0, 72, 0, 0, 70, 0, 67, 0, 70, 0, 74, 0, 75, 0],
      [79, 0, 0, 75, 0, 0, 74, 0, 72, 0, 0, 75, 79, 0, 0, 0],
      [80, 0, 0, 79, 0, 0, 77, 0, 75, 0, 0, 72, 77, 0, 0, 0],
      [75, 0, 0, 74, 0, 0, 72, 0, 68, 0, 72, 0, 75, 0, 77, 0],
      [79, 0, 0, 77, 0, 0, 74, 0, 71, 0, 0, 0, 74, 0, 0, 0],
    ],
    style: 'siege',
  },
];

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.musicDry = null;
    this.musicWet = null;
    this.reverbNode = null;
    this.noiseBuffer = null;

    this.sfxMuted = localStorage.getItem('towerdechess_muted') === '1';
    this.musicMuted = localStorage.getItem('towerdechess_music_muted') === '1';
    this.lastPlayed = {};

    // Dynamic multi-suite cinematographic sequencer state
    this.tracks = CINEMATIC_SUITES;
    this.trackIndex = 0;
    this.cyclesOnCurrentTrack = 0;
    this.musicRunning = false;
    this.musicIntensity = 'off'; // 'off' | 'prep' | 'battle' | 'boss'
    this.musicDucked = false;
    this.seqTimer = null;
    this.nextStepTime = 0;
    this.stepIndex = 0;
    this.bpm = CINEMATIC_SUITES[0].bpm;
  }

  // Legacy getter for compatibility
  get muted() {
    return this.sfxMuted;
  }

  getCurrentTrack() {
    return this.tracks[this.trackIndex % this.tracks.length];
  }

  selectTrackForLevel(levelId) {
    // Alternate across our 3 cinematographic suites per level/chapter
    const idx = Math.max(0, (Number(levelId) - 1)) % this.tracks.length;
    this.trackIndex = idx;
    this.cyclesOnCurrentTrack = 0;
    this.stepIndex = 0;
    this.bpm = this.getCurrentTrack().bpm;
    return this.getCurrentTrack();
  }

  nextTrack() {
    this.trackIndex = (this.trackIndex + 1) % this.tracks.length;
    this.cyclesOnCurrentTrack = 0;
    this.stepIndex = 0;
    this.bpm = this.getCurrentTrack().bpm;
    return this.getCurrentTrack();
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master compressor keeps intense waves + cinematic orchestra lush and distortion-free
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

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicMuted ? 0 : 0.4;
      this.musicGain.connect(this.masterGain);

      // Dry + Stereo Concert-Hall Convolution Reverb bus for wide-screen film score depth
      this.musicDry = this.ctx.createGain();
      this.musicDry.gain.value = 0.74;
      this.musicDry.connect(this.musicGain);

      this.musicWet = this.ctx.createGain();
      this.musicWet.gain.value = 0.42;

      this.reverbNode = this.ctx.createConvolver();
      this.reverbNode.buffer = this._createHallImpulse(2.15, 2.8);
      this.reverbNode.connect(this.musicWet);
      this.musicWet.connect(this.musicGain);

      this._createNoiseBuffer();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.musicIntensity !== 'off' && !this.musicRunning) {
      this._startSequencer();
    }
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
    this._updateMusicVolume();
    return this.musicMuted;
  }

  toggleMusic() {
    return this.setMusicMuted(!this.musicMuted);
  }

  setMusicIntensity(mode) {
    this.musicIntensity = mode;
    if (mode === 'off') {
      this._stopSequencer();
      return;
    }
    if (this.ctx && this.ctx.state === 'running' && !this.musicRunning) {
      this._startSequencer();
    }
    this._updateMusicVolume();
  }

  setMusicDucked(ducked) {
    this.musicDucked = ducked;
    this._updateMusicVolume();
  }

  _updateMusicVolume() {
    if (!this.musicGain || !this.ctx) return;
    let target = 0;
    if (!this.musicMuted && this.musicIntensity !== 'off') {
      const base = this.musicIntensity === 'prep' ? 0.28 : this.musicIntensity === 'boss' ? 0.42 : 0.36;
      target = this.musicDucked ? base * 0.35 : base;
    }
    this.musicGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.08);
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

  playUpgrade() {
    if (!this._canPlay('upgrade', 80)) return;
    // Stately forged steel + brass fanfare triad (D - F# - A - D)
    this._noiseBurst(0.05, 'highpass', 3600, 2200, 0.1, 1.2);
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((f, i) => {
      this._tone(f, f, 0.22, 'triangle', 0.13, i * 0.055, 2800);
      this._tone(f * 0.5, f * 0.5, 0.22, 'sawtooth', 0.045, i * 0.055, 1600);
    });
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

  // ==================== CINEMATOGRAPHIC ORCHESTRAL MUSIC ENGINE ====================

  _routeMusic(node, wetAmount = 0.45) {
    if (!this.musicDry) {
      node.connect(this.musicGain);
      return;
    }
    node.connect(this.musicDry);
    if (this.reverbNode && wetAmount > 0) {
      const send = this.ctx.createGain();
      send.gain.value = wetAmount;
      node.connect(send);
      send.connect(this.reverbNode);
    }
  }

  _startSequencer() {
    if (this.musicRunning || !this.ctx) return;
    this.musicRunning = true;
    this.nextStepTime = this.ctx.currentTime + 0.08;
    const lookaheadMs = 35;
    const scheduleAheadSec = 0.16;

    const tick = () => {
      if (!this.musicRunning || !this.ctx) return;
      if (this.ctx.state === 'running') {
        while (this.nextStepTime < this.ctx.currentTime + scheduleAheadSec) {
          const suite = this.getCurrentTrack();
          this.bpm = suite.bpm;
          const stepDur = 60 / this.bpm / 4; // 16th note
          this._scheduleMusicStep(suite, this.stepIndex, this.nextStepTime, stepDur);
          this.nextStepTime += stepDur;
          this.stepIndex += 1;
          if (this.stepIndex >= 128) {
            this.stepIndex = 0;
            this.cyclesOnCurrentTrack += 1;
            // Smoothly alternate to the next cinematographic suite every 2 full 8-bar cycles!
            if (this.cyclesOnCurrentTrack >= 2) {
              this.trackIndex = (this.trackIndex + 1) % this.tracks.length;
              this.cyclesOnCurrentTrack = 0;
              this.bpm = this.getCurrentTrack().bpm;
            }
          }
        }
      }
      this.seqTimer = setTimeout(tick, lookaheadMs);
    };
    tick();
  }

  _stopSequencer() {
    this.musicRunning = false;
    if (this.seqTimer) {
      clearTimeout(this.seqTimer);
      this.seqTimer = null;
    }
  }

  _scheduleMusicStep(suite, step, t, stepDur) {
    if (this.musicMuted || this.musicIntensity === 'off') return;
    const mode = this.musicIntensity;
    const bar = Math.floor(step / 16); // 0..7
    const sub = step % 16;             // 0..15 (16th notes in bar)
    const ch = suite.chords[bar];
    const barDur = stepDur * 16;

    // 1. LUSH LEGATO ORCHESTRAL STRING PAD (swells across every full bar into hall reverb!)
    if (sub === 0) {
      const padVol = mode === 'prep' ? 0.075 : mode === 'boss' ? 0.115 : 0.095;
      this._mStringPad(ch.pad, t, barDur * 1.08, padVol);
    }

    // 2. SUITE-SPECIFIC CINEMATOGRAPHIC OSTINATO & TEXTURE
    if (suite.style === 'heroic') {
      // Suite I: Harp/Piano arpeggios in prep, driving spiccato strings in battle/boss
      const arpPat = [0, 1, 2, 3, 4, 3, 2, 1, 0, 2, 3, 4, 3, 2, 1, 2];
      const note = ch.arp[arpPat[sub]];
      if (mode === 'prep') {
        if (sub % 2 === 0) {
          this._mPiano(midiToFreq(note + 12), t, stepDur * 3.2, sub % 4 === 0 ? 0.085 : 0.055);
        }
      } else {
        const accent = sub % 4 === 0 ? 0.105 : 0.068;
        this._mSpiccato(midiToFreq(note), t, stepDur * 1.15, accent);
      }

      // Warm orchestral cello pulse
      if (sub % 4 === 0 || (mode !== 'prep' && sub % 2 === 0)) {
        const bassVol = mode === 'prep' ? 0.14 : 0.21;
        this._mCelloBass(midiToFreq(ch.root), t, stepDur * 2.2, bassVol);
      }

      // Cinematic Taiko & Snare percussion
      if (mode === 'prep') {
        if (sub === 0) this._mTaiko(t, 0.2, 0.92);
      } else {
        const taikoHits = mode === 'boss' ? [0, 3, 6, 8, 12, 14] : [0, 6, 8, 14];
        if (taikoHits.includes(sub)) {
          this._mTaiko(t, sub === 0 || sub === 8 ? 0.34 : 0.22, sub === 0 ? 0.85 : 1.05);
        }
        if (sub === 4 || sub === 12) this._mSnare(t, 0.15);
        if ((bar === 3 || bar === 7) && sub >= 12) {
          this._mTaiko(t, 0.18 + (sub - 12) * 0.045, 0.95 + (sub - 12) * 0.06);
        }
      }
    } else if (suite.style === 'nocturne') {
      // Suite II: Haunting cathedral concert piano ostinato + dark pulsing cellos (Zimmer/Nolan vibe)
      const pianoPat = [0, 1, 2, 1, 4, 1, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1];
      if (sub % 2 === 0) {
        const note = ch.arp[pianoPat[sub]];
        this._mPiano(midiToFreq(note + 12), t, stepDur * 3.8, sub === 0 ? 0.1 : 0.065);
      }
      if (mode !== 'prep') {
        // Dark relentless 16th-note low cello pulse
        const pulseVol = sub % 4 === 0 ? 0.13 : 0.075;
        this._mSpiccato(midiToFreq(ch.root + 12), t, stepDur * 0.95, pulseVol);
      }
      if (sub === 0 || sub === 8) {
        this._mCelloBass(midiToFreq(ch.root), t, stepDur * 6.0, mode === 'prep' ? 0.17 : 0.24);
      }

      // Deep cinematic sub-taiko heartbeat & clockwork tick
      if (mode === 'prep') {
        if (sub === 0 || sub === 8) this._mTaiko(t, 0.18, 0.8);
        if (sub % 4 === 2) this._mHat(t, 0.032);
      } else {
        if (sub === 0 || sub === 8 || (mode === 'boss' && (sub === 6 || sub === 14))) {
          this._mTaiko(t, sub === 0 ? 0.36 : 0.25, sub === 0 ? 0.78 : 0.96);
        }
        if (sub === 12) this._mAnvil(t, 0.08);
        if (sub % 2 === 0) this._mHat(t, 0.035);
      }
    } else {
      // Suite III: Relentless 3+3+2 blockbuster action string ostinato + war drum battery
      const zimmerAccent = sub === 0 || sub === 3 || sub === 6 || sub === 8 || sub === 11 || sub === 14;
      const arpIdx = [0, 1, 2, 0, 1, 3, 2, 1, 0, 2, 3, 4, 3, 2, 1, 2][sub];
      if (mode !== 'prep' || zimmerAccent) {
        this._mSpiccato(
          midiToFreq(ch.arp[arpIdx]),
          t,
          stepDur * (zimmerAccent ? 1.25 : 0.9),
          zimmerAccent ? 0.12 : 0.065
        );
      }
      if (zimmerAccent) {
        this._mCelloBass(midiToFreq(ch.root), t, stepDur * 2.1, mode === 'prep' ? 0.15 : 0.23);
      }

      if (mode === 'prep') {
        if (sub === 0 || sub === 6 || sub === 12) this._mTaiko(t, 0.2, 0.9);
      } else {
        if (zimmerAccent) {
          this._mTaiko(t, sub === 0 || sub === 8 ? 0.36 : 0.23, sub === 0 ? 0.82 : 1.05);
        }
        if (sub === 4 || sub === 12) this._mSnare(t, 0.18);
        if ((bar === 1 || bar === 3 || bar === 5 || bar === 7) && sub === 12) {
          this._mAnvil(t, 0.095);
        }
        if (sub % 2 === 0 || mode === 'boss') this._mHat(t, 0.042);
      }
    }

    // 3. SOARING CINEMATOGRAPHIC FRENCH HORN & VIOLIN MELODY (Battle & Boss)
    if (mode === 'battle' || mode === 'boss') {
      const note = suite.melody[bar][sub];
      if (note > 0) {
        // Measure sustain length until next melody note for expressive legato phrasing
        let holdSteps = 2;
        for (let k = sub + 1; k < 16 && suite.melody[bar][k] === 0; k++) holdSteps++;
        const dur = stepDur * Math.min(7, holdSteps * 0.95);
        this._mHorn(midiToFreq(note), t, dur, mode === 'boss' ? 0.145 : 0.12);
        // High octave orchestral violin doubling during climactic phrase B (bars 4..7) or Boss waves!
        if (mode === 'boss' || bar >= 4) {
          this._mHorn(midiToFreq(note + 12), t, dur * 0.92, mode === 'boss' ? 0.065 : 0.042);
        }
      }
    }

    // 4. ICONIC CINEMATIC LOW BRASS "BRAAAM" SWELLS (Boss waves & Battle phrase downbeats)
    if (sub === 0 && (mode === 'boss' || (mode === 'battle' && (bar === 0 || bar === 4)))) {
      const braamVol = mode === 'boss' ? 0.14 : 0.095;
      this._mBraaam(midiToFreq(ch.root), t, stepDur * 10, braamVol);
      this._mBraaam(midiToFreq(ch.root + 7), t, stepDur * 9, braamVol * 0.65);
    }
  }

  // ==================== CINEMATIC ORCHESTRAL SYNTH VOICES ====================

  _mStringPad(midiNotes, t, dur, vol) {
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(620, t);
    filter.frequency.linearRampToValueAtTime(1450, t + Math.min(0.65, dur * 0.4));
    filter.frequency.exponentialRampToValueAtTime(720, t + dur);

    const perVoice = vol / Math.max(1, midiNotes.length);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(perVoice * midiNotes.length, t + Math.min(0.28, dur * 0.25));
    gain.gain.setValueAtTime(perVoice * midiNotes.length * 0.85, t + dur * 0.72);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.35);

    for (const m of midiNotes) {
      const f = midiToFreq(m);
      for (const detune of [-6, 6]) {
        const osc = this.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, t);
        osc.detune.setValueAtTime(detune, t);
        osc.connect(filter);
        osc.start(t);
        osc.stop(t + dur + 0.4);
      }
    }

    filter.connect(gain);
    this._routeMusic(gain, 0.75);
  }

  _mHorn(freq, t, dur, vol) {
    // Expressive cinematic French horn: warm filter bloom on attack + dual detuned ensemble
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    filter.type = 'lowpass';
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(420, t);
    filter.frequency.exponentialRampToValueAtTime(2150, t + Math.min(0.11, dur * 0.32));
    filter.frequency.exponentialRampToValueAtTime(860, t + dur);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + Math.min(0.045, dur * 0.22));
    gain.gain.setValueAtTime(vol * 0.84, t + dur * 0.65);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.16);

    for (const [type, detune] of [['sawtooth', -5], ['sawtooth', 5], ['triangle', 0]]) {
      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.setValueAtTime(detune, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + dur + 0.2);
    }

    filter.connect(gain);
    this._routeMusic(gain, 0.65);
  }

  _mPiano(freq, t, dur, vol) {
    // Haunting resonant concert piano / harp voice echoing through concert hall reverb
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3400, t);
    filter.frequency.exponentialRampToValueAtTime(620, t + dur);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, t);
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, t);
    const g2 = this.ctx.createGain();
    g2.gain.value = 0.28;

    osc1.connect(filter);
    osc2.connect(g2);
    g2.connect(filter);
    filter.connect(gain);
    this._routeMusic(gain, 0.8);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur + 0.05);
    osc2.stop(t + dur + 0.05);
  }

  _mSpiccato(freq, t, dur, vol) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.frequency.exponentialRampToValueAtTime(480, t + dur);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.007);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    this._routeMusic(gain, 0.35);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  _mCelloBass(freq, t, dur, vol) {
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    sub.type = 'sine';
    sub.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(460, t);
    filter.frequency.exponentialRampToValueAtTime(140, t + dur);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gain);
    this._routeMusic(gain, 0.28);
    osc.start(t);
    sub.start(t);
    osc.stop(t + dur + 0.04);
    sub.stop(t + dur + 0.04);
  }

  _mBraaam(freq, t, dur, vol) {
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    filter.type = 'lowpass';
    filter.Q.value = 2.0;
    filter.frequency.setValueAtTime(240, t);
    filter.frequency.exponentialRampToValueAtTime(920, t + 0.24);
    filter.frequency.exponentialRampToValueAtTime(220, t + dur);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.14);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    for (const detune of [-9, 0, 9]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.setValueAtTime(detune, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + dur + 0.08);
    }

    filter.connect(gain);
    this._routeMusic(gain, 0.72);
  }

  _mTaiko(t, vol, pitch = 1.0) {
    // Deep cinematic orchestral taiko / timpani boom
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(118 * pitch, t);
    osc.frequency.exponentialRampToValueAtTime(36 * pitch, t + 0.26);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    osc.connect(gain);
    this._routeMusic(gain, 0.42);
    osc.start(t);
    osc.stop(t + 0.34);

    if (this.noiseBuffer) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const f = this.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.setValueAtTime(680, t);
      f.frequency.exponentialRampToValueAtTime(140, t + 0.14);
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(vol * 0.45, t);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      src.connect(f);
      f.connect(ng);
      this._routeMusic(ng, 0.45);
      src.start(t, Math.random() * 0.4, 0.18);
    }
  }

  _mAnvil(t, vol) {
    // Metallic epic cinematic percussion clang
    for (const f of [880, 1318, 2093]) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(vol * 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      osc.connect(g);
      this._routeMusic(g, 0.75);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  }

  _mSnare(t, vol) {
    if (!this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1850, t);
    filter.Q.value = 0.9;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
    src.connect(filter);
    filter.connect(gain);
    this._routeMusic(gain, 0.38);
    src.start(t, Math.random() * 0.4, 0.15);

    const osc = this.ctx.createOscillator();
    const og = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(205, t);
    osc.frequency.exponentialRampToValueAtTime(105, t + 0.055);
    og.gain.setValueAtTime(vol * 0.5, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.065);
    osc.connect(og);
    this._routeMusic(og, 0.25);
    osc.start(t);
    osc.stop(t + 0.075);
  }

  _mHat(t, vol) {
    if (!this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6400, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    src.connect(filter);
    filter.connect(gain);
    this._routeMusic(gain, 0.18);
    src.start(t, Math.random() * 0.5, 0.055);
  }
}

export const sound = new SoundEngine();

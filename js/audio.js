/**
 * Tactile Tower Defense Audio & Dynamic Battle Music Engine for TowerDeChess.
 *
 * Features:
 * - Punchy, grounded TD combat foley (blades, heavy cannons, stone impacts,
 *   arcane sears, shattering ice, subtle armor clinks) through a master compressor.
 * - Dynamic 136 BPM multi-track intense battle soundtrack in D Minor with
 *   adaptive intensity layers (prep -> battle -> boss) and independent Music/SFX toggles.
 */

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.noiseBuffer = null;

    this.sfxMuted = localStorage.getItem('towerdechess_muted') === '1';
    this.musicMuted = localStorage.getItem('towerdechess_music_muted') === '1';
    this.lastPlayed = {};

    // Dynamic music sequencer state
    this.musicRunning = false;
    this.musicIntensity = 'off'; // 'off' | 'prep' | 'battle' | 'boss'
    this.musicDucked = false;
    this.seqTimer = null;
    this.nextStepTime = 0;
    this.stepIndex = 0;
    this.bpm = 136;
  }

  // Legacy getter for compatibility
  get muted() {
    return this.sfxMuted;
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master compressor keeps intense waves + music punchy and distortion-free on phone speakers
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 18;
      comp.ratio.value = 4.5;
      comp.attack.value = 0.004;
      comp.release.value = 0.14;
      comp.connect(this.ctx.destination);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.92;
      this.masterGain.connect(comp);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxMuted ? 0 : 0.95;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicMuted ? 0 : 0.36;
      this.musicGain.connect(this.masterGain);

      this._createNoiseBuffer();
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.musicIntensity !== 'off' && !this.musicRunning) {
      this._startSequencer();
    }
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

  // ==================== INTENSE BATTLE MUSIC ENGINE (136 BPM, D MINOR) ====================

  _startSequencer() {
    if (this.musicRunning || !this.ctx) return;
    this.musicRunning = true;
    this.nextStepTime = this.ctx.currentTime + 0.06;
    const lookaheadMs = 35;
    const scheduleAheadSec = 0.14;

    const tick = () => {
      if (!this.musicRunning || !this.ctx) return;
      if (this.ctx.state === 'running') {
        const stepDur = 60 / this.bpm / 4; // 16th note (~0.110s)
        while (this.nextStepTime < this.ctx.currentTime + scheduleAheadSec) {
          this._scheduleMusicStep(this.stepIndex, this.nextStepTime, stepDur);
          this.nextStepTime += stepDur;
          this.stepIndex = (this.stepIndex + 1) % 128; // 8-bar epic cycle (Phrase A + Phrase B)
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

  _scheduleMusicStep(step, t, stepDur) {
    if (this.musicMuted || this.musicIntensity === 'off') return;
    const mode = this.musicIntensity;
    const bar = Math.floor(step / 16); // 0..7
    const sub = step % 16;             // 0..15 (16th notes in bar)

    // 8-bar intense tactical progression in D Minor:
    // Phrase A: Dm | Bb | Gm | A7
    // Phrase B: Dm | C  | Bb | A7 (climactic turnaround)
    const chords = [
      { root: 38, arp: [50, 57, 62, 65] }, // Bar 0: Dm (D2, D3-A3-D4-F4)
      { root: 34, arp: [46, 53, 58, 62] }, // Bar 1: Bb (Bb1)
      { root: 43, arp: [55, 58, 62, 67] }, // Bar 2: Gm (G2)
      { root: 45, arp: [57, 61, 64, 69] }, // Bar 3: A7 (A2, C#4 harmonic minor pull!)
      { root: 38, arp: [50, 57, 62, 65] }, // Bar 4: Dm
      { root: 36, arp: [48, 55, 60, 64] }, // Bar 5: C
      { root: 34, arp: [46, 53, 58, 62] }, // Bar 6: Bb
      { root: 45, arp: [57, 61, 64, 67] }, // Bar 7: A7
    ];
    const ch = chords[bar];

    // 1. SPICCATO STRINGS / HARPSICHORD OSTINATO (always active — crisp tactical tension!)
    const arpPattern = [0, 1, 2, 1, 3, 2, 1, 2, 0, 1, 2, 3, 2, 1, 2, 1];
    const arpNote = ch.arp[arpPattern[sub]];
    if (mode !== 'prep' || sub % 2 === 0 || sub === 15) {
      const accent = sub % 4 === 0 ? 0.13 : 0.08;
      this._mPluck(midiToFreq(arpNote), t, stepDur * 1.15, accent);
    }

    // 2. DRIVING OCTAVE BASSLINE (8th-note gallop!)
    if (sub % 2 === 0) {
      const octShift = sub % 4 === 2 ? 12 : 0;
      const bassNote = ch.root + octShift;
      const bassVol = mode === 'prep' ? 0.16 : 0.24;
      this._mBass(midiToFreq(bassNote), t, stepDur * 1.65, bassVol);
    }

    // 3. WAR DRUMS & MARCHING PERCUSSION
    if (mode === 'prep') {
      // Tense light rim-tick & low pulse
      if (sub === 0 || sub === 8) this._mKick(t, 0.22);
      if (sub === 4 || sub === 12) this._mHat(t, 0.055);
    } else {
      // Intense driving battle beat!
      const kickHits = mode === 'boss'
        ? [0, 3, 6, 8, 10, 14]
        : [0, 6, 8, 14];
      if (kickHits.includes(sub)) {
        this._mKick(t, sub === 0 || sub === 8 ? 0.38 : 0.27);
      }
      if (sub === 4 || sub === 12) {
        this._mSnare(t, 0.2);
      } else if ((bar === 3 || bar === 7) && (sub === 13 || sub === 14 || sub === 15)) {
        // Exciting marching snare fill at end of every 4-bar phrase!
        this._mSnare(t, 0.15);
      }
      // Driving 16th/8th hi-hat energy
      if (sub % 2 === 0 || mode === 'boss') {
        this._mHat(t, sub % 4 === 2 ? 0.075 : 0.042);
      }
    }

    // 4. HEROIC INTENSE LEAD MELODY (active during Battle & Boss waves!)
    if (mode === 'battle' || mode === 'boss') {
      // 8-bar memorable minor-key tactical motif (MIDI note or 0 for rest)
      const melodyBars = [
        // Bar 0 (Dm): D5 - F5 - E5 - D5 - A4 - D5
        [74, 0, 0, 77, 0, 0, 76, 0, 74, 0, 69, 0, 74, 0, 76, 0],
        // Bar 1 (Bb): F5 - - G5 - F5 - D5 - Bb4
        [77, 0, 0, 0, 79, 0, 77, 0, 74, 0, 0, 70, 74, 0, 0, 0],
        // Bar 2 (Gm): G5 - Bb5 - A5 - G5 - F5 - D5
        [79, 0, 0, 82, 0, 0, 81, 0, 79, 0, 77, 0, 74, 0, 76, 0],
        // Bar 3 (A7): E5 - - C#5 - A4 - C#5 - E5
        [76, 0, 0, 0, 73, 0, 0, 0, 69, 0, 73, 0, 76, 0, 79, 0],
        // Bar 4 (Dm): A5 - - G5 - F5 - E5 - D5 - F5
        [81, 0, 0, 79, 0, 0, 77, 0, 76, 0, 74, 0, 77, 0, 0, 0],
        // Bar 5 (C): G5 - - F5 - E5 - C5 - E5 - G5
        [79, 0, 0, 77, 0, 0, 76, 0, 72, 0, 76, 0, 79, 0, 81, 0],
        // Bar 6 (Bb): Bb5 - A5 - G5 - F5 - D5 - F5 - G5
        [82, 0, 81, 0, 79, 0, 77, 0, 74, 0, 77, 0, 79, 0, 0, 0],
        // Bar 7 (A7): A5 - - G5 - E5 - C#5 - - -
        [81, 0, 0, 79, 0, 0, 76, 0, 73, 0, 0, 0, 76, 0, 0, 0],
      ];
      const note = melodyBars[bar][sub];
      if (note > 0) {
        this._mLead(midiToFreq(note), t, stepDur * 2.5, mode === 'boss' ? 0.14 : 0.12);
      }

      // Boss wave dramatic low brass power-fifth stabs on downbeats!
      if (mode === 'boss' && (sub === 0 || sub === 8)) {
        this._mBrassStab(midiToFreq(ch.root + 12), t, stepDur * 3.5, 0.11);
        this._mBrassStab(midiToFreq(ch.root + 19), t, stepDur * 3.5, 0.08);
      }
    }
  }

  _mPluck(freq, t, dur, vol) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(480, t + dur);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  _mBass(freq, t, dur, vol) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(520, t);
    filter.frequency.exponentialRampToValueAtTime(160, t + dur);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  _mLead(freq, t, dur, vol) {
    // Dual slightly detuned oscillators for rich orchestral string/brass warmth
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + dur);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.015);
    gain.gain.setValueAtTime(vol * 0.8, t + dur * 0.55);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    for (const detune of [-5, 5]) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.setValueAtTime(detune, t);
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    filter.connect(gain);
    gain.connect(this.musicGain);
  }

  _mBrassStab(freq, t, dur, vol) {
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, t);
    filter.frequency.exponentialRampToValueAtTime(380, t + dur);

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  _mKick(t, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(125, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.13);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  _mSnare(t, vol) {
    if (!this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1900, t);
    filter.Q.value = 0.9;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    src.start(t, Math.random() * 0.4, 0.13);

    // Snare body snap
    const osc = this.ctx.createOscillator();
    const og = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(210, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.05);
    og.gain.setValueAtTime(vol * 0.55, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(og);
    og.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  _mHat(t, vol) {
    if (!this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6800, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    src.start(t, Math.random() * 0.5, 0.05);
  }
}

export const sound = new SoundEngine();

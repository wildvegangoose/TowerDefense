/**
 * Illustrated Motion-Comic Cutscene Player for TowerDeChess.
 * Renders widescreen painted scenes with smooth Ken Burns pan/zoom, live Canvas atmosphere
 * particles (sun motes, blizzard snow, rising embers, dawn light), captions, and orchestral score.
 */

import { getSceneUrl } from './assets.js';
import { sound } from './audio.js';
import { CUTSCENES } from './data/story.js';

export class CutscenePlayer {
  constructor() {
    this.el = {
      modal: document.getElementById('modal-cutscene'),
      img: document.getElementById('cutscene-img'),
      canvas: document.getElementById('cutscene-fx-canvas'),
      chapter: document.getElementById('cutscene-chapter'),
      title: document.getElementById('cutscene-title'),
      speaker: document.getElementById('cutscene-speaker'),
      caption: document.getElementById('cutscene-caption'),
      progressBar: document.getElementById('cutscene-progress-bar'),
      slideCounter: document.getElementById('cutscene-slide-counter'),
      btnNext: document.getElementById('btn-cutscene-next'),
      btnSkip: document.getElementById('btn-cutscene-skip'),
    };

    this.ctx = this.el.canvas ? this.el.canvas.getContext('2d') : null;
    this.activeCutscene = null;
    this.slideIndex = 0;
    this.slideElapsed = 0;
    this.rafId = null;
    this.lastTime = 0;
    this.particles = [];
    this.onComplete = null;
    this.wasPlayingMusic = false;

    this._bindEvents();
  }

  _bindEvents() {
    this.el.btnSkip?.addEventListener('click', () => {
      sound.unlock();
      this.stop(true);
    });
    this.el.btnNext?.addEventListener('click', () => this._advanceSlide());
    this.el.modal?.addEventListener('pointerdown', () => {
      if (!this.activeCutscene) return;
      sound.unlock();
      if (!sound.musicMuted && sound.musicIntensity !== 'off') {
        sound.setMusicIntensity(this.activeCutscene.musicMode || 'prep');
      }
    });
    window.addEventListener('resize', () => {
      if (this.activeCutscene) this._resizeCanvas();
    });
  }

  isOpen() {
    return Boolean(this.activeCutscene);
  }

  play(cutsceneId, onComplete = null) {
    const data = CUTSCENES[cutsceneId];
    if (!data || !this.el.modal) {
      onComplete?.();
      return;
    }

    this.activeCutscene = data;
    this.slideIndex = 0;
    this.slideElapsed = 0;
    this.onComplete = onComplete;

    this.el.chapter.textContent = data.chapterLabel;
    this.el.title.textContent = data.title;
    this.el.modal.classList.remove('hidden');

    // Sync cinematographic orchestral score with the cutscene chapter
    this.wasPlayingMusic = sound.musicIntensity !== 'off';
    sound.trackIndex = data.musicSuiteIndex ?? 0;
    sound.stepIndex = 0;
    sound.setMusicDucked(false);
    sound.setMusicIntensity(data.musicMode || 'prep');

    this._resizeCanvas();
    this._loadSlide(0);

    this.lastTime = performance.now();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    const loop = (now) => {
      const dt = Math.min(0.05, (now - this.lastTime) / 1000);
      this.lastTime = now;
      this._tick(dt);
      if (this.activeCutscene) {
        this.rafId = requestAnimationFrame(loop);
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(triggerCallback = true) {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    const cb = this.onComplete;
    this.activeCutscene = null;
    this.onComplete = null;
    this.el.modal?.classList.add('hidden');

    if (!this.wasPlayingMusic) {
      sound.setMusicIntensity('off');
    }
    if (triggerCallback && cb) cb();
  }

  _resizeCanvas() {
    if (!this.el.canvas) return;
    const rect = this.el.canvas.parentElement?.getBoundingClientRect();
    const w = Math.max(320, Math.round(rect?.width || 800));
    const h = Math.max(180, Math.round(rect?.height || 450));
    this.el.canvas.width = w;
    this.el.canvas.height = h;
  }

  _loadSlide(idx) {
    const slides = this.activeCutscene.slides;
    const slide = slides[idx];
    if (!slide) {
      this.stop(true);
      return;
    }
    this.slideIndex = idx;
    this.slideElapsed = 0;

    // Crossfade artwork cleanly
    this.el.img.classList.add('fading');
    const url = getSceneUrl(slide.scene);
    this.el.img.src = url;
    this.el.img.alt = this.activeCutscene.title;

    this.el.speaker.textContent = slide.speaker || '';
    this.el.caption.textContent = slide.caption || '';
    this.el.slideCounter.textContent = `${idx + 1} / ${slides.length}`;
    this.el.btnNext.textContent = idx === slides.length - 1 ? 'Continue →' : 'Next Scene →';

    this._seedParticles(slide.particleTheme || this.activeCutscene.particleTheme || 'gold');
    this._applyKenBurns(slide, 0);

    requestAnimationFrame(() => {
      this.el.img.classList.remove('fading');
    });
  }

  _advanceSlide() {
    sound.unlock();
    if (!this.activeCutscene) return;
    if (this.slideIndex + 1 < this.activeCutscene.slides.length) {
      sound.playSelect();
      this._loadSlide(this.slideIndex + 1);
    } else {
      sound.playSelect();
      this.stop(true);
    }
  }

  _applyKenBurns(slide, t) {
    const kb = slide.kb || { s0: 1.02, s1: 1.12, x0: 0, x1: 0, y0: 0, y1: 0 };
    const ease = t; // Linear steady cinematic dolly feels truest to film
    const s = kb.s0 + (kb.s1 - kb.s0) * ease;
    const x = kb.x0 + (kb.x1 - kb.x0) * ease;
    const y = kb.y0 + (kb.y1 - kb.y0) * ease;
    this.el.img.style.transform = `scale(${s.toFixed(4)}) translate(${x.toFixed(2)}%, ${y.toFixed(2)}%)`;
  }

  _seedParticles(theme) {
    const w = this.el.canvas?.width || 800;
    const h = this.el.canvas?.height || 450;
    const count = theme === 'snow' ? 56 : 42;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this._makeParticle(w, h, theme, true));
    }
  }

  _makeParticle(w, h, theme, randomY = false) {
    if (theme === 'snow') {
      return {
        theme,
        x: Math.random() * w,
        y: randomY ? Math.random() * h : -10,
        vx: -18 - Math.random() * 28,
        vy: 32 + Math.random() * 48,
        size: 1.5 + Math.random() * 2.8,
        alpha: 0.35 + Math.random() * 0.55,
        phase: Math.random() * Math.PI * 2,
      };
    }
    if (theme === 'ember') {
      return {
        theme,
        x: Math.random() * w,
        y: randomY ? Math.random() * h : h + 10,
        vx: -14 + Math.random() * 28,
        vy: -26 - Math.random() * 52,
        size: 1.4 + Math.random() * 2.8,
        alpha: 0.45 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      };
    }
    // gold / dawn floating sun motes
    return {
      theme,
      x: Math.random() * w,
      y: randomY ? Math.random() * h : h + 10,
      vx: -8 + Math.random() * 18,
      vy: -8 - Math.random() * 16,
      size: 1.4 + Math.random() * 2.6,
      alpha: 0.25 + Math.random() * 0.45,
      phase: Math.random() * Math.PI * 2,
    };
  }

  _tick(dt) {
    const slides = this.activeCutscene.slides;
    const slide = slides[this.slideIndex];
    if (!slide) return;

    this.slideElapsed += dt;
    const frac = Math.min(1, this.slideElapsed / (slide.duration || 7.5));
    this._applyKenBurns(slide, frac);

    const overall = (this.slideIndex + frac) / slides.length;
    if (this.el.progressBar) {
      this.el.progressBar.style.width = `${(overall * 100).toFixed(2)}%`;
    }

    this._renderParticles(dt, slide.particleTheme || this.activeCutscene.particleTheme || 'gold');

    if (this.slideElapsed >= (slide.duration || 7.5)) {
      if (this.slideIndex + 1 < slides.length) {
        this._loadSlide(this.slideIndex + 1);
      } else {
        this.stop(true);
      }
    }
  }

  _renderParticles(dt, theme) {
    if (!this.ctx || !this.el.canvas) return;
    const ctx = this.ctx;
    const w = this.el.canvas.width;
    const h = this.el.canvas.height;
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.phase += dt * 2.4;
      p.x += (p.vx + Math.sin(p.phase) * 10) * dt;
      p.y += p.vy * dt;

      if (p.y < -16 || p.y > h + 16 || p.x < -20 || p.x > w + 20) {
        this.particles[i] = this._makeParticle(w, h, theme, false);
        continue;
      }

      const flicker = 0.65 + 0.35 * Math.sin(p.phase * 1.5);
      ctx.save();
      ctx.globalAlpha = p.alpha * flicker;
      if (theme === 'snow') {
        ctx.fillStyle = '#dff3ff';
      } else if (theme === 'ember') {
        ctx.fillStyle = p.size > 2.8 ? '#ffae4a' : '#ff5b36';
      } else {
        ctx.fillStyle = '#ffe294';
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

/**
 * Cinematic Cutscene Player for TowerDeChess.
 *
 * Two presentation modes:
 * - Video: plays a cinematic (`assets/videos/<id>.mp4`) with its own score & foley, overlaying each
 *   slide's caption from its `videoStart` cue. The soundtrack rests while the video plays.
 * - Slides: illustrated motion-comic with smooth Ken Burns pan/zoom, live Canvas atmosphere
 *   particles (sun motes, blizzard snow, rising embers, dawn light), captions, and the soundtrack.
 * Video cutscenes fall back to their painted slides if the video cannot load.
 */

import { getSceneUrl, getVideoUrl } from './assets.js';
import { sound } from './audio.js';
import { CUTSCENES } from './data/story.js';

export class CutscenePlayer {
  constructor() {
    this.el = {
      modal: document.getElementById('modal-cutscene'),
      img: document.getElementById('cutscene-img'),
      video: document.getElementById('cutscene-video'),
      canvas: document.getElementById('cutscene-fx-canvas'),
      soundHint: document.getElementById('btn-cutscene-sound'),
      chapter: document.getElementById('cutscene-chapter'),
      title: document.getElementById('cutscene-title'),
      speaker: document.getElementById('cutscene-speaker'),
      caption: document.getElementById('cutscene-caption'),
      progressBar: document.getElementById('cutscene-progress-bar'),
      slideCounter: document.getElementById('cutscene-slide-counter'),
      dots: document.getElementById('cutscene-dots'),
      btnPrev: document.getElementById('btn-cutscene-prev'),
      btnPause: document.getElementById('btn-cutscene-pause'),
      btnNext: document.getElementById('btn-cutscene-next'),
      btnSkip: document.getElementById('btn-cutscene-skip'),
    };

    this.ctx = this.el.canvas ? this.el.canvas.getContext('2d') : null;
    this.activeCutscene = null;
    this.mode = 'slides'; // 'slides' | 'video'
    this.slideIndex = 0;
    this.slideElapsed = 0;
    this.paused = false;
    this.cueStarts = [];
    this.videoNeedsTap = false;
    this.rafId = null;
    this.lastTime = 0;
    this.particles = [];
    this.onComplete = null;
    this.prevMusicIntensity = 'off';

    this._bindEvents();
  }

  _bindEvents() {
    this.el.btnSkip?.addEventListener('click', () => {
      sound.unlock();
      this.stop(true);
    });
    this.el.btnPrev?.addEventListener('click', () => this._prevSlide());
    this.el.btnPause?.addEventListener('click', () => this._togglePause());
    this.el.btnNext?.addEventListener('click', () => this._advanceSlide());
    this.el.soundHint?.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.unlock();
      this._resumeVideoWithSound();
    });
    this.el.modal?.addEventListener('pointerdown', (e) => {
      if (!this.activeCutscene) return;
      if (e.target.closest('#btn-cutscene-skip, #btn-cutscene-prev, #btn-cutscene-pause, #btn-cutscene-next, #cutscene-dots')) return;
      sound.unlock();
      if (this.mode === 'video') {
        this._resumeVideoWithSound();
        return;
      }
      if (!sound.musicMuted && sound.musicIntensity !== 'off') {
        sound.setMusicIntensity(this.activeCutscene.musicMode || 'prep');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (!this.activeCutscene) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this._advanceSlide();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this._prevSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        this._togglePause();
      }
    });

    const video = this.el.video;
    video?.addEventListener('ended', () => {
      if (this.activeCutscene && this.mode === 'video') this.stop(true);
    });
    video?.addEventListener('error', () => {
      // Ignore synthetic empty-src errors fired during _teardownVideo()
      if (!video.getAttribute('src')) return;
      // Missing/unsupported video (offline, old WebView): continue with the painted slides
      if (this.activeCutscene && this.mode === 'video') {
        this._teardownVideo();
        this._startSlides();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (!this.activeCutscene || this.mode !== 'video') return;
      if (document.hidden) {
        video?.pause();
      } else if (!this.videoNeedsTap && !this.paused) {
        this._playVideo();
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

    if (this.activeCutscene) {
      this._teardownVideo();
    } else {
      // Restore whatever the soundtrack was doing once the cinematic closes
      this.prevMusicIntensity = sound.musicIntensity;
    }

    this.activeCutscene = data;
    this.slideIndex = 0;
    this.slideElapsed = 0;
    this.paused = false;
    this.onComplete = onComplete;

    this.el.chapter.textContent = data.chapterLabel;
    this.el.title.textContent = data.title;
    this._renderSceneDots();
    this._syncPauseButton();
    this.el.modal.classList.remove('hidden');

    this._resizeCanvas();

    const videoUrl = data.video && this.el.video ? getVideoUrl(data.video) : '';
    if (videoUrl) {
      this._startVideo(videoUrl);
    } else {
      this._startSlides();
    }

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
    this.paused = false;
    this._syncPauseButton();
    this._teardownVideo();
    this.mode = 'slides';
    this.el.modal?.classList.add('hidden');

    sound.setMusicIntensity(this.prevMusicIntensity || 'off');
    if (triggerCallback && cb) cb();
  }

  // ==================== SLIDESHOW MODE ====================

  _startSlides() {
    this.mode = 'slides';
    this.el.img?.classList.remove('hidden');

    // Score the motion-comic with the soundtrack from its opening bars
    sound.restartMusic();
    sound.setMusicDucked(false);
    sound.setMusicIntensity(this.activeCutscene.musicMode || 'prep');

    this._loadSlide(0);
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

    this._showCaption(idx);

    this._seedParticles(slide.particleTheme || this.activeCutscene.particleTheme || 'gold');
    this._applyKenBurns(slide, 0);

    requestAnimationFrame(() => {
      this.el.img.classList.remove('fading');
    });
  }

  _getSlideDuration(slide) {
    const words = String(slide?.caption || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    // Generous reading pace (~12–16s per caption) so players never feel rushed
    const readingSec = Math.max(12.0, 5.0 + words * 0.34);
    return Math.max(slide?.duration || 7.5, readingSec);
  }

  _renderSceneDots() {
    const dotsEl = this.el.dots;
    if (!dotsEl || !this.activeCutscene) return;
    dotsEl.innerHTML = '';
    const total = this.activeCutscene.slides.length;
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `cutscene-dot${i === this.slideIndex ? ' active' : ''}`;
      dot.dataset.sceneIdx = String(i);
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Scene ${i + 1} of ${total}`);
      dot.setAttribute('aria-selected', String(i === this.slideIndex));
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this._goToSlide(i);
      });
      dotsEl.appendChild(dot);
    }
  }

  _syncPauseButton() {
    const btn = this.el.btnPause;
    if (!btn) return;
    btn.classList.toggle('is-paused', this.paused);
    btn.setAttribute('aria-pressed', String(this.paused));
    btn.textContent = this.paused ? '▶ Play' : '⏸ Pause';
    btn.setAttribute('aria-label', this.paused ? 'Resume Cutscene' : 'Pause Cutscene');
  }

  _togglePause() {
    sound.unlock();
    if (!this.activeCutscene) return;
    sound.playSelect();
    this.paused = !this.paused;
    this._syncPauseButton();

    if (this.mode === 'video' && this.el.video) {
      if (this.paused) {
        this.el.video.pause();
      } else if (!this.el.video.ended) {
        this._playVideo();
      }
    }
  }

  _goToSlide(idx) {
    sound.unlock();
    if (!this.activeCutscene) return;
    const total = this.activeCutscene.slides.length;
    if (idx < 0 || idx >= total) return;
    sound.playSelect();
    if (this.mode === 'video') {
      this._seekToCue(idx);
    } else {
      this._loadSlide(idx);
    }
  }

  _showCaption(idx) {
    const slides = this.activeCutscene.slides;
    const slide = slides[idx];
    this.slideIndex = idx;
    this.el.speaker.textContent = slide?.speaker || '';
    this.el.caption.textContent = slide?.caption || '';
    this.el.slideCounter.textContent = `${idx + 1} / ${slides.length}`;
    if (this.el.btnPrev) {
      this.el.btnPrev.disabled = idx <= 0;
    }
    this.el.btnNext.textContent = idx === slides.length - 1 ? 'Continue →' : 'Next →';

    const dots = this.el.dots?.querySelectorAll('.cutscene-dot') || [];
    for (const dot of dots) {
      const isCurrent = Number(dot.dataset.sceneIdx) === idx;
      dot.classList.toggle('active', isCurrent);
      dot.setAttribute('aria-selected', String(isCurrent));
    }
  }

  _prevSlide() {
    sound.unlock();
    if (!this.activeCutscene || this.slideIndex <= 0) return;
    this._goToSlide(this.slideIndex - 1);
  }

  _advanceSlide() {
    sound.unlock();
    if (!this.activeCutscene) return;
    const isLast = this.slideIndex + 1 >= this.activeCutscene.slides.length;
    sound.playSelect();
    if (isLast) {
      this.stop(true);
    } else if (this.mode === 'video') {
      this._seekToCue(this.slideIndex + 1);
    } else {
      this._loadSlide(this.slideIndex + 1);
    }
  }

  // ==================== VIDEO MODE ====================

  _startVideo(url) {
    const video = this.el.video;
    const data = this.activeCutscene;
    this.mode = 'video';
    this.videoNeedsTap = false;

    // Caption cue start times (seconds); default to back-to-back slide durations
    let t = 0;
    this.cueStarts = data.slides.map((slide) => {
      const start = Number.isFinite(slide.videoStart) ? slide.videoStart : t;
      t = start + (slide.duration || 7.5);
      return start;
    });

    // The video carries its own score & foley — rest the soundtrack underneath it
    sound.setMusicIntensity('off');

    this.el.img?.classList.add('hidden');
    this.particles = [];
    this.ctx?.clearRect(0, 0, this.el.canvas.width, this.el.canvas.height);
    if (this.el.progressBar) this.el.progressBar.style.width = '0%';

    const firstScene = data.slides[0]?.scene;
    video.poster = firstScene ? getSceneUrl(firstScene) : '';
    video.setAttribute('aria-label', data.title);
    video.classList.remove('hidden');
    video.src = url;
    video.load();

    this._showCaption(0);
    this._playVideo();
  }

  _videoShouldBeMuted() {
    // The cinematic mixes score and battle foley: silence it only if both are switched off
    return sound.musicMuted && sound.sfxMuted;
  }

  _playVideo() {
    const video = this.el.video;
    if (!video || !this.activeCutscene || this.mode !== 'video') return;
    // Ignore rejections from interrupted plays or a video that has since been torn down
    const stillPlaying = (err) => err?.name !== 'AbortError' && this.activeCutscene && this.mode === 'video';

    video.muted = this._videoShouldBeMuted();
    video.play()?.catch((err) => {
      if (!stillPlaying(err)) return;
      if (video.muted) {
        this._setSoundHint(true, '▶ Tap to play');
        return;
      }
      // Autoplay with sound is blocked until the first tap: start muted and offer sound
      this._setSoundHint(true, '🔈 Tap for sound');
      video.muted = true;
      video.play()?.catch((retryErr) => {
        if (stillPlaying(retryErr)) this._setSoundHint(true, '▶ Tap to play');
      });
    });
  }

  _resumeVideoWithSound() {
    if (!this.videoNeedsTap || this.mode !== 'video') return;
    const video = this.el.video;
    this._setSoundHint(false);
    video.muted = this._videoShouldBeMuted();
    if (video.paused && !video.ended) {
      video.play()?.catch(() => {});
    }
  }

  _setSoundHint(visible, label = '') {
    this.videoNeedsTap = visible;
    if (!this.el.soundHint) return;
    if (label) this.el.soundHint.textContent = label;
    this.el.soundHint.classList.toggle('hidden', !visible);
  }

  _cueIndexAt(time) {
    let idx = 0;
    for (let i = 0; i < this.cueStarts.length; i++) {
      if (time + 0.001 >= this.cueStarts[i]) idx = i;
    }
    return idx;
  }

  _seekToCue(idx) {
    const video = this.el.video;
    const start = this.cueStarts[idx] ?? 0;
    try {
      video.currentTime = start;
    } catch {
      // Seeking before metadata loads is a no-op; the caption still advances
    }
    this._showCaption(idx);
  }

  _teardownVideo() {
    const video = this.el.video;
    this.mode = 'slides';
    this._setSoundHint(false);
    this.el.img?.classList.remove('hidden');
    if (!video) return;
    video.pause();
    if (video.hasAttribute('src')) {
      video.removeAttribute('src');
      video.load(); // Release the decoder & network stream
    }
    video.classList.add('hidden');
  }

  _tickVideo() {
    const video = this.el.video;
    const time = video.currentTime || 0;
    const idx = this._cueIndexAt(time);
    if (idx !== this.slideIndex) this._showCaption(idx);
    if (this.el.progressBar && Number.isFinite(video.duration) && video.duration > 0) {
      const overall = Math.min(1, time / video.duration);
      this.el.progressBar.style.width = `${(overall * 100).toFixed(2)}%`;
    }
  }

  // ==================== MOTION-COMIC RENDERING ====================

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
    if (this.mode === 'video') {
      this._tickVideo();
      return;
    }

    const slides = this.activeCutscene.slides;
    const slide = slides[this.slideIndex];
    if (!slide) return;

    const slideDur = this._getSlideDuration(slide);
    if (!this.paused) {
      this.slideElapsed += dt;
    }
    const frac = Math.min(1, this.slideElapsed / slideDur);
    this._applyKenBurns(slide, frac);

    const overall = (this.slideIndex + frac) / slides.length;
    if (this.el.progressBar) {
      this.el.progressBar.style.width = `${(overall * 100).toFixed(2)}%`;
    }

    this._renderParticles(
      this.paused ? dt * 0.35 : dt,
      slide.particleTheme || this.activeCutscene.particleTheme || 'gold'
    );

    if (!this.paused && this.slideElapsed >= slideDur) {
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

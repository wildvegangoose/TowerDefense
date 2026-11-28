/**
 * Background-Only Battlefield Weather Renderer for TowerDeChess.
 *
 * Renders atmospheric weather effects (sun rays, falling autumn leaves, rain,
 * siege storm rain, snow, blizzard, prismatic ice rays, volcanic ash, rising embers,
 * and volcanic storm) onto a dedicated canvas layered strictly BEHIND the 2.5D
 * chessboard and HUD (`#game-weather-canvas`), so gameplay tiles and pieces stay
 * completely unobstructed.
 */

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const LEAF_PALETTE = [
  { fill: '#e08b2e', vein: '#944a12' },
  { fill: '#c85028', vein: '#7a2510' },
  { fill: '#e9b749', vein: '#a36f18' },
  { fill: '#a93e24', vein: '#641d0f' },
  { fill: '#cc742a', vein: '#7f3d11' },
];

const ASH_PALETTE = ['#cdc5bc', '#9f958c', '#ddd2c5', '#877d75'];
const EMBER_PALETTE = ['#ffb44c', '#ff7b29', '#ff4d2e', '#ffe082'];

export class WeatherRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.weatherType = null;
    this.levelSeed = 1;
    this.particles = [];
    this.rays = [];
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.running = false;
    this.rafId = null;
    this.lastTs = 0;
    this.time = 0;
    this.nextFlashAt = 4.2;
    this.flashStrength = 0;
    this.reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  }

  resize() {
    if (!this.canvas || !this.ctx) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (w === this.width && h === this.height && dpr === this.dpr) return;
    this.width = w;
    this.height = h;
    this.dpr = dpr;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.weatherType) {
      this._buildPool();
      if (this.reducedMotion) this._drawFrame(0);
    }
  }

  start(weatherType, levelSeed = 1) {
    if (!this.canvas || !this.ctx) return;
    this.weatherType = weatherType || 'sunrays';
    this.levelSeed = Number(levelSeed) || 1;
    this.time = 0;
    this.flashStrength = 0;
    this.nextFlashAt = 3.2 + (this.levelSeed % 3) * 1.4;
    this.resize();
    this._buildPool();

    if (this.reducedMotion) {
      this.stop();
      this._drawFrame(0);
      return;
    }

    if (!this.running) {
      this.running = true;
      this.lastTs = performance.now();
      this.rafId = requestAnimationFrame((ts) => this._loop(ts));
    }
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.ctx && this.width > 0 && this.height > 0) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  _buildPool() {
    const w = Math.max(320, this.width);
    const h = Math.max(320, this.height);
    const rand = mulberry32(this.levelSeed * 104729 + 17);
    this.particles = [];
    this.rays = [];

    const type = this.weatherType;

    if (type === 'sunrays' || type === 'prism_rays') {
      const rayCount = 6;
      for (let i = 0; i < rayCount; i++) {
        this.rays.push({
          xFrac: -0.08 + (i / (rayCount - 1)) * 1.12 + (rand() - 0.5) * 0.08,
          width: w * (0.08 + rand() * 0.085),
          baseAlpha: type === 'prism_rays' ? 0.075 + rand() * 0.065 : 0.08 + rand() * 0.07,
          phase: rand() * Math.PI * 2,
          speed: 0.35 + rand() * 0.35,
          drift: 16 + rand() * 20,
          tint: i % 2,
        });
      }
      const moteCount = 34;
      for (let i = 0; i < moteCount; i++) {
        this.particles.push({
          kind: 'mote',
          x: rand() * w,
          y: rand() * h,
          vx: 4 + rand() * 8,
          vy: (type === 'prism_rays' ? 5 : -6) + (rand() - 0.5) * 6,
          size: 1.3 + rand() * 2.4,
          alpha: 0.24 + rand() * 0.42,
          phase: rand() * Math.PI * 2,
          twinkle: 1.4 + rand() * 2.2,
        });
      }
      return;
    }

    if (type === 'leaves') {
      const count = 34;
      for (let i = 0; i < count; i++) {
        const pal = LEAF_PALETTE[Math.floor(rand() * LEAF_PALETTE.length)];
        const depth = 0.55 + rand() * 0.85;
        this.particles.push({
          kind: 'leaf',
          x: rand() * w,
          y: rand() * h,
          vx: (18 + rand() * 26) * depth,
          vy: (24 + rand() * 30) * depth,
          size: (6.2 + rand() * 5.2) * depth,
          rot: rand() * Math.PI * 2,
          rotSpeed: (rand() - 0.5) * 2.1,
          swayAmp: 18 + rand() * 26,
          swayFreq: 0.9 + rand() * 1.1,
          flutterPhase: rand() * Math.PI * 2,
          flutterSpeed: 2.0 + rand() * 2.2,
          alpha: 0.34 + depth * 0.34,
          fill: pal.fill,
          vein: pal.vein,
        });
      }
      return;
    }

    if (type === 'rain' || type === 'storm_rain') {
      const isStorm = type === 'storm_rain';
      const count = isStorm ? 120 : 82;
      for (let i = 0; i < count; i++) {
        const depth = 0.5 + rand() * 0.85;
        this.particles.push({
          kind: 'rain',
          x: rand() * (w + 180) - 90,
          y: rand() * h,
          vx: (isStorm ? -145 : -82) * depth,
          vy: (isStorm ? 560 : 410) * depth,
          len: (isStorm ? 22 : 16) * depth + rand() * 8,
          lineWidth: isStorm ? 0.9 + depth * 0.55 : 0.75 + depth * 0.45,
          alpha: (isStorm ? 0.16 : 0.14) + depth * (isStorm ? 0.2 : 0.16),
        });
      }
      return;
    }

    if (type === 'snow' || type === 'blizzard') {
      const isBlizzard = type === 'blizzard';
      const count = isBlizzard ? 115 : 68;
      for (let i = 0; i < count; i++) {
        const depth = 0.45 + rand() * 0.95;
        this.particles.push({
          kind: 'snow',
          x: rand() * w,
          y: rand() * h,
          vx: (isBlizzard ? -92 - rand() * 68 : -10 - rand() * 16) * depth,
          vy: (isBlizzard ? 78 + rand() * 64 : 26 + rand() * 34) * depth,
          size: (isBlizzard ? 1.5 + rand() * 2.8 : 1.8 + rand() * 3.2) * depth,
          swayAmp: isBlizzard ? 10 + rand() * 14 : 16 + rand() * 22,
          swayFreq: isBlizzard ? 1.6 + rand() * 1.4 : 0.7 + rand() * 0.9,
          phase: rand() * Math.PI * 2,
          alpha: 0.22 + depth * 0.44,
          crisp: rand() > 0.48,
        });
      }
      return;
    }

    if (type === 'ash') {
      const count = 62;
      for (let i = 0; i < count; i++) {
        const depth = 0.5 + rand() * 0.85;
        const isCinder = rand() < 0.16;
        this.particles.push({
          kind: isCinder ? 'ember' : 'ash',
          x: rand() * w,
          y: rand() * h,
          vx: (isCinder ? 14 : -14) + (rand() - 0.5) * 18,
          vy: isCinder ? -(18 + rand() * 24) * depth : (16 + rand() * 22) * depth,
          size: (isCinder ? 1.5 + rand() * 1.8 : 2.1 + rand() * 3.0) * depth,
          rot: rand() * Math.PI * 2,
          rotSpeed: (rand() - 0.5) * 1.8,
          swayAmp: 12 + rand() * 18,
          swayFreq: 0.8 + rand() * 1.0,
          phase: rand() * Math.PI * 2,
          alpha: isCinder ? 0.35 + rand() * 0.35 : 0.24 + depth * 0.3,
          color: isCinder
            ? EMBER_PALETTE[Math.floor(rand() * EMBER_PALETTE.length)]
            : ASH_PALETTE[Math.floor(rand() * ASH_PALETTE.length)],
        });
      }
      return;
    }

    if (type === 'embers' || type === 'volcanic_storm') {
      const isVolcanic = type === 'volcanic_storm';
      const emberCount = isVolcanic ? 70 : 54;
      for (let i = 0; i < emberCount; i++) {
        const depth = 0.5 + rand() * 0.9;
        this.particles.push({
          kind: 'ember',
          x: rand() * w,
          y: rand() * h,
          vx: (rand() - 0.38) * (isVolcanic ? 42 : 24),
          vy: -(34 + rand() * (isVolcanic ? 58 : 42)) * depth,
          size: (1.4 + rand() * 2.5) * depth,
          swayAmp: 14 + rand() * 22,
          swayFreq: 1.1 + rand() * 1.5,
          phase: rand() * Math.PI * 2,
          alpha: 0.36 + depth * 0.42,
          color: EMBER_PALETTE[Math.floor(rand() * EMBER_PALETTE.length)],
        });
      }
      if (isVolcanic) {
        for (let i = 0; i < 28; i++) {
          const depth = 0.5 + rand() * 0.8;
          this.particles.push({
            kind: 'ash',
            x: rand() * w,
            y: rand() * h,
            vx: 16 + rand() * 24,
            vy: (18 + rand() * 26) * depth,
            size: (2.0 + rand() * 2.8) * depth,
            rot: rand() * Math.PI * 2,
            rotSpeed: (rand() - 0.5) * 2.2,
            swayAmp: 12 + rand() * 14,
            swayFreq: 1.0 + rand() * 1.1,
            phase: rand() * Math.PI * 2,
            alpha: 0.22 + depth * 0.24,
            color: ASH_PALETTE[Math.floor(rand() * ASH_PALETTE.length)],
          });
        }
      }
    }
  }

  _loop(ts) {
    if (!this.running) return;
    const dt = Math.min(0.05, Math.max(0.001, (ts - this.lastTs) / 1000));
    this.lastTs = ts;
    this._drawFrame(dt);
    this.rafId = requestAnimationFrame((nextTs) => this._loop(nextTs));
  }

  _drawFrame(dt) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    if (!ctx || w <= 0 || h <= 0) return;

    this.time += dt;
    ctx.clearRect(0, 0, w, h);

    const type = this.weatherType;

    // 1. Volumetric light shafts for sunrays & glacial prism_rays
    if (type === 'sunrays' || type === 'prism_rays') {
      this._drawSunRays(ctx, w, h, type === 'prism_rays');
    }

    // 2. Occasional subtle distant sheet lightning glow in storm_rain & volcanic_storm
    if (type === 'storm_rain' || type === 'volcanic_storm') {
      if (this.time >= this.nextFlashAt) {
        this.flashStrength = type === 'volcanic_storm' ? 0.22 : 0.2;
        this.nextFlashAt = this.time + 5.4 + ((this.levelSeed * 17 + Math.floor(this.time * 7)) % 5);
      }
      if (this.flashStrength > 0.004) {
        this.flashStrength = Math.max(0, this.flashStrength - dt * 0.72);
        const grad = ctx.createRadialGradient(w * 0.55, h * 0.14, 10, w * 0.55, h * 0.25, Math.max(w, h) * 0.78);
        if (type === 'volcanic_storm') {
          grad.addColorStop(0, `rgba(255, 110, 68, ${this.flashStrength.toFixed(3)})`);
          grad.addColorStop(0.5, `rgba(185, 42, 30, ${(this.flashStrength * 0.45).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          grad.addColorStop(0, `rgba(205, 228, 255, ${this.flashStrength.toFixed(3)})`);
          grad.addColorStop(0.5, `rgba(140, 178, 224, ${(this.flashStrength * 0.42).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // 3. Subtle low atmospheric horizon mist for rain & blizzard
    if (type === 'rain' || type === 'storm_rain' || type === 'blizzard') {
      const mist = ctx.createLinearGradient(0, h * 0.65, 0, h);
      if (type === 'blizzard') {
        mist.addColorStop(0, 'rgba(175, 225, 255, 0)');
        mist.addColorStop(1, 'rgba(175, 225, 255, 0.1)');
      } else {
        mist.addColorStop(0, 'rgba(145, 178, 210, 0)');
        mist.addColorStop(1, 'rgba(145, 178, 210, 0.08)');
      }
      ctx.fillStyle = mist;
      ctx.fillRect(0, h * 0.65, w, h * 0.35);
    }

    // 4. Advance & draw particles
    const pad = 42;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (dt > 0) {
        if (p.kind === 'leaf') {
          p.x += (p.vx + Math.sin(this.time * p.swayFreq + p.flutterPhase) * p.swayAmp) * dt;
          p.y += p.vy * dt;
          p.rot += p.rotSpeed * dt;
        } else if (p.kind === 'snow' || p.kind === 'ash' || p.kind === 'ember') {
          p.x += (p.vx + Math.sin(this.time * p.swayFreq + p.phase) * p.swayAmp) * dt;
          p.y += p.vy * dt;
          if (p.rot !== undefined) p.rot += p.rotSpeed * dt;
        } else if (p.kind === 'rain') {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        } else if (p.kind === 'mote') {
          p.x += (p.vx + Math.sin(this.time * 0.7 + p.phase) * 5) * dt;
          p.y += (p.vy + Math.cos(this.time * 0.6 + p.phase) * 3) * dt;
        }

        // Seamless wrap around viewport edges
        if (p.x < -pad) p.x = w + pad * 0.8;
        else if (p.x > w + pad) p.x = -pad * 0.8;
        if (p.y < -pad) p.y = h + pad * 0.8;
        else if (p.y > h + pad) p.y = -pad * 0.8;
      }

      if (p.kind === 'mote') {
        const pulse = 0.55 + 0.45 * Math.sin(this.time * p.twinkle + p.phase);
        ctx.save();
        ctx.globalAlpha = p.alpha * pulse;
        ctx.fillStyle = type === 'prism_rays' ? '#ccefff' : '#ffe6a3';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === 'leaf') {
        this._drawLeaf(ctx, p);
      } else if (p.kind === 'rain') {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.strokeStyle = type === 'storm_rain' ? '#c8dff5' : '#bdd4ea';
        ctx.lineWidth = p.lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + p.vx * (p.len / Math.max(1, p.vy)), p.y + p.len);
        ctx.stroke();
        ctx.restore();
      } else if (p.kind === 'snow') {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        if (p.crisp) {
          ctx.fillStyle = '#e8f6ff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.78, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.4);
          g.addColorStop(0, 'rgba(235, 248, 255, 0.95)');
          g.addColorStop(1, 'rgba(200, 232, 255, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (p.kind === 'ash') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.52, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.kind === 'ember') {
        const flicker = 0.62 + 0.38 * Math.sin(this.time * 5.2 + p.phase);
        ctx.save();
        ctx.globalAlpha = p.alpha * flicker;
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.8);
        glow.addColorStop(0, '#fff2c2');
        glow.addColorStop(0.35, p.color);
        glow.addColorStop(1, 'rgba(255, 80, 20, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  _getRayTexture(isPrism, tint) {
    const key = `${isPrism ? 'p' : 's'}_${tint}`;
    this._rayTexCache = this._rayTexCache || {};
    if (this._rayTexCache[key]) return this._rayTexCache[key];

    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 256;
    const gctx = c.getContext('2d');

    // 1. Soft bell-curve horizontal feather (0 -> bright core -> 0) so ray sides have ZERO hard edges
    const hGrad = gctx.createLinearGradient(0, 0, c.width, 0);
    const rgb = isPrism
      ? tint === 0
        ? '158, 228, 255'
        : '214, 236, 255'
      : tint === 0
      ? '255, 222, 145'
      : '248, 204, 118';
    hGrad.addColorStop(0, `rgba(${rgb}, 0)`);
    hGrad.addColorStop(0.22, `rgba(${rgb}, 0.28)`);
    hGrad.addColorStop(0.5, `rgba(${rgb}, 1)`);
    hGrad.addColorStop(0.78, `rgba(${rgb}, 0.28)`);
    hGrad.addColorStop(1, `rgba(${rgb}, 0)`);
    gctx.fillStyle = hGrad;
    gctx.fillRect(0, 0, c.width, c.height);

    // 2. Multiply by smooth lengthwise vertical fade (bright source at top -> soft dissolve at bottom)
    gctx.globalCompositeOperation = 'destination-in';
    const vGrad = gctx.createLinearGradient(0, 0, 0, c.height);
    vGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    vGrad.addColorStop(0.42, 'rgba(255, 255, 255, 0.58)');
    vGrad.addColorStop(0.82, 'rgba(255, 255, 255, 0.14)');
    vGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    gctx.fillStyle = vGrad;
    gctx.fillRect(0, 0, c.width, c.height);

    this._rayTexCache[key] = c;
    return c;
  }

  _drawSunRays(ctx, w, h, isPrism) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const angle = -0.38; // Gentle diagonal sunbeam slant (~22deg)
    const beamLen = Math.hypot(w, h) * 1.05;

    for (let i = 0; i < this.rays.length; i++) {
      const r = this.rays[i];
      const breathe = 0.7 + 0.3 * Math.sin(this.time * r.speed + r.phase);
      const swayX = Math.sin(this.time * (r.speed * 0.55) + r.phase) * r.drift;
      const topX = r.xFrac * w + swayX;
      const beamW = r.width * 2.15;
      const tex = this._getRayTexture(isPrism, r.tint);

      ctx.save();
      ctx.translate(topX, -36);
      ctx.rotate(angle);
      ctx.globalAlpha = Math.min(0.28, r.baseAlpha * 1.45 * breathe);
      ctx.drawImage(tex, -beamW * 0.5, 0, beamW, beamLen);
      ctx.restore();
    }
    ctx.restore();
  }

  _drawLeaf(ctx, p) {
    const tumble = 0.32 + 0.68 * Math.abs(Math.cos(this.time * p.flutterSpeed + p.flutterPhase));
    const s = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.scale(1, tumble);
    ctx.globalAlpha = p.alpha;

    ctx.fillStyle = p.fill;
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.quadraticCurveTo(-s * 0.2, -s * 0.78, s, 0);
    ctx.quadraticCurveTo(-s * 0.2, s * 0.78, -s, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = p.vein;
    ctx.lineWidth = Math.max(0.7, s * 0.1);
    ctx.beginPath();
    ctx.moveTo(-s * 1.15, 0);
    ctx.lineTo(s * 0.78, 0);
    ctx.stroke();

    ctx.restore();
  }
}

/**
 * Core 60fps Canvas Simulation & Tabletop Renderer for Crownward.
 */

import { BOARD_SIZE, expandWaypoints } from '../data/levels.js';
import { PIECE_REGISTRY, getPieceStats, getUpgradeInfo } from '../data/pieces.js';
import { createEnemyConfig, DIFFICULTY_PRESETS } from '../data/enemies.js';
import { SPRITES } from '../assets.js';
import { sound } from '../audio.js';
import { getPatternTiles, selectTarget, getEnemiesOnRay } from './targeting.js';

const FRAME_PAD_RATIO = 0.055; // Walnut wood border with A-H / 1-8 coordinates

export class GameEngine {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.callbacks = callbacks || {};

    this.level = null;
    this.difficulty = 'standard';
    this.pathTiles = [];
    this.pathSet = new Set();

    // Game economy & state
    this.gold = 0;
    this.lives = 0;
    this.maxLives = 0;
    this.score = 0;
    this.waveIndex = -1; // -1 = pre-game prep before Wave 1
    this.waveActive = false;
    this.gameState = 'idle'; // 'idle' | 'playing' | 'paused' | 'victory' | 'defeat'
    this.speedMult = 1;
    this.autoStartTimer = 0;

    // Entities
    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.beams = [];
    this.rings = [];
    this.particles = [];
    this.floatTexts = [];
    this.spawnQueue = [];
    this.nextEntityId = 1;

    // Interaction state
    this.selectedBuildPieceId = null; // Piece chosen from tray to build
    this.previewTile = null;          // { col, row } for touch confirm or hover
    this.hoverTile = null;            // { col, row } for desktop cursor
    this.selectedTowerId = null;      // Existing placed tower ID
    this.isTouchDevice = false;

    // Juice & animation timers
    this.time = 0;
    this.shakeTime = 0;
    this.shakeIntensity = 0;
    this.rafId = null;
    this.lastFrameTime = 0;

    // Layout metrics for 2.5D Diagonal Aerial Isometric projection
    this.canvasW = 0;
    this.canvasH = 0;
    this.tileW = 64;
    this.tileH = 36;
    this.isoRatio = 0.56;
    this.elevScale = 36;
    this.originX = 0;
    this.originY = 0;

    this._bindEvents();
  }

  boardToScreen(u, v, z = 0) {
    return {
      x: this.originX + (u - v) * (this.tileW * 0.5),
      y: this.originY + (u + v) * (this.tileH * 0.5) - z * this.elevScale,
    };
  }

  screenToBoard(sx, sy) {
    // Pick slightly elevated tile top surface (z = 0.10 midpoint) for crisp finger accuracy
    const adjY = sy + 0.1 * this.elevScale;
    const dx = (sx - this.originX) / (this.tileW * 0.5);
    const dy = (adjY - this.originY) / (this.tileH * 0.5);
    return {
      u: (dx + dy) * 0.5,
      v: (dy - dx) * 0.5,
    };
  }

  _bindEvents() {
    this._onPointerMove = (e) => {
      if (e.pointerType === 'touch') {
        this.isTouchDevice = true;
        return;
      }
      const tile = this._clientToTile(e.clientX, e.clientY);
      this.hoverTile = tile;
    };

    this._onPointerLeave = () => {
      this.hoverTile = null;
    };

    this._onPointerDown = (e) => {
      sound.unlock();
      if (e.pointerType === 'touch') {
        this.isTouchDevice = true;
      }
      if (this.gameState !== 'playing' && this.gameState !== 'paused') return;

      const tile = this._clientToTile(e.clientX, e.clientY);
      if (!tile) {
        this.clearSelection();
        return;
      }
      this._handleTileTap(tile.col, tile.row, e.pointerType === 'touch');
    };

    this.canvas.addEventListener('pointermove', this._onPointerMove);
    this.canvas.addEventListener('pointerleave', this._onPointerLeave);
    this.canvas.addEventListener('pointerdown', this._onPointerDown);
  }

  destroy() {
    this.stop();
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
    this.canvas.removeEventListener('pointerleave', this._onPointerLeave);
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
  }

  resize() {
    const stage = this.canvas.closest('.board-stage') || this.canvas.parentElement;
    if (!stage) return;
    const style = window.getComputedStyle(stage);
    const padX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0);
    const padY = (parseFloat(style.paddingTop) || 0) + (parseFloat(style.paddingBottom) || 0);
    const availW = Math.floor(stage.clientWidth - padX);
    const availH = Math.floor(stage.clientHeight - padY);
    if (availW <= 0 || availH <= 0) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.canvas.style.width = `${availW}px`;
    this.canvas.style.height = `${availH}px`;
    this.canvas.width = Math.round(availW * dpr);
    this.canvas.height = Math.round(availH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.canvasW = availW;
    this.canvasH = availH;

    // Fit full 8x8 diamond + 0.58-tile walnut bezel + top sprite headroom + 3D front slab thickness
    const bezelSpan = BOARD_SIZE + 1.25; // horizontal diamond width in tileW units
    const verticalSpan = (BOARD_SIZE + 1.25) * this.isoRatio + 1.05; // height in tileW units
    const tileW = Math.min((availW - 8) / bezelSpan, (availH - 8) / verticalSpan);

    this.tileW = Math.max(30, tileW);
    this.tileH = this.tileW * this.isoRatio;
    this.elevScale = this.tileH * 0.95;

    // Center diamond cleanly with slightly more top headroom for tall chess crowns
    const boardDiamondH = BOARD_SIZE * this.tileH;
    this.originX = availW * 0.5;
    this.originY = (availH - boardDiamondH) * 0.5 + this.tileH * 0.22;
  }

  loadLevel(level, difficulty = 'standard') {
    this.level = level;
    this.difficulty = difficulty;
    const diff = DIFFICULTY_PRESETS[difficulty] || DIFFICULTY_PRESETS.standard;
    this.pathTiles = expandWaypoints(level.waypoints);
    this.pathSet = new Set(this.pathTiles.map(([c, r]) => `${c},${r}`));

    this.gold = Math.round(level.startingGold * diff.goldMult);
    this.lives = level.startingLives;
    this.maxLives = level.startingLives;
    this.score = 0;
    this.waveIndex = -1;
    this.waveActive = false;
    this.gameState = 'playing';
    this.speedMult = 1;
    this.autoStartTimer = 0;

    this.towers = [];
    this.enemies = [];
    this.projectiles = [];
    this.beams = [];
    this.rings = [];
    this.particles = [];
    this.floatTexts = [];
    this.spawnQueue = [];

    this.selectedBuildPieceId = level.unlocksPiece || 'pawn';
    this.previewTile = null;
    this.selectedTowerId = null;

    sound.setMusicDucked(false);
    sound.setMusicIntensity('prep');

    this.resize();
    this._emitHud();
    this.start();
  }

  start() {
    if (this.rafId) return;
    this.lastFrameTime = performance.now();
    const loop = (now) => {
      const rawDt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
      this.lastFrameTime = now;
      if (this.gameState === 'playing') {
        this.update(rawDt * this.speedMult);
      } else {
        this.time += rawDt * 0.4;
      }
      this.render();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    sound.setMusicIntensity('off');
  }

  togglePause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused';
      sound.setMusicDucked(true);
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing';
      sound.setMusicDucked(false);
      this.lastFrameTime = performance.now();
    }
    this._emitHud();
  }

  toggleSpeed() {
    this.speedMult = this.speedMult === 1 ? 2 : 1;
    this._emitHud();
    return this.speedMult;
  }

  selectBuildPiece(pieceId) {
    sound.unlock();
    sound.playSelect();
    this.selectedTowerId = null;
    if (this.selectedBuildPieceId === pieceId) {
      this.selectedBuildPieceId = null;
      this.previewTile = null;
    } else {
      this.selectedBuildPieceId = pieceId;
      this.previewTile = null;
    }
    this._emitHud();
  }

  clearSelection() {
    this.selectedTowerId = null;
    this.previewTile = null;
    this._emitHud();
  }

  confirmPreviewPlacement() {
    if (!this.previewTile || !this.selectedBuildPieceId) return false;
    return this.placeTower(this.selectedBuildPieceId, this.previewTile.col, this.previewTile.row);
  }

  canBuildAt(col, row) {
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return false;
    if (this.pathSet.has(`${col},${row}`)) return false;
    if (this.towers.some((t) => t.col === col && t.row === row)) return false;
    return true;
  }

  getPieceCount(pieceId) {
    return this.towers.filter((t) => t.pieceId === pieceId).length;
  }

  placeTower(pieceId, col, row) {
    const def = PIECE_REGISTRY[pieceId];
    if (!def) return false;
    if (!this.canBuildAt(col, row)) return false;
    if (def.limit && this.getPieceCount(pieceId) >= def.limit) {
      this._spawnFloatText(col + 0.5, row + 0.3, `Max ${def.limit} ${def.name}`, '#e06c58');
      return false;
    }
    if (this.gold < def.cost) {
      this._spawnFloatText(col + 0.5, row + 0.3, `Need ${def.cost}g`, '#e06c58');
      return false;
    }

    this.gold -= def.cost;
    const tower = {
      id: this.nextEntityId++,
      pieceId,
      col,
      row,
      tier: 1,
      invested: def.cost,
      cooldown: 0.15,
      targetMode: 'first',
      kills: 0,
      damageDealt: 0,
      placeAnim: 1.0,
      recoil: 0,
      buffDamageMult: 1,
      buffRateMult: 1,
      buffedByKing: false,
    };
    this.towers.push(tower);
    this._recomputeKingAuras();
    sound.playPlace();
    this._spawnDustBurst(col + 0.5, row + 0.65, '#f0d8a8', 10);
    this.previewTile = null;
    this.selectedTowerId = null;
    if (def.limit && this.getPieceCount(pieceId) >= def.limit) {
      this.selectedBuildPieceId = null;
    }
    this._emitHud();
    return true;
  }

  upgradeSelectedTower() {
    const tower = this.getSelectedTower();
    if (!tower) return false;
    const next = getUpgradeInfo(tower.pieceId, tower.tier);
    if (!next) return false;
    if (this.gold < next.cost) return false;

    this.gold -= next.cost;
    tower.tier += 1;
    tower.invested += next.cost;
    tower.placeAnim = 0.7;
    this._recomputeKingAuras();
    sound.playUpgrade();
    this._spawnRing(tower.col + 0.5, tower.row + 0.5, 0.9, '#f0c050', 0.45);
    this._spawnDustBurst(tower.col + 0.5, tower.row + 0.5, '#f7d97e', 14);
    this._spawnFloatText(tower.col + 0.5, tower.row + 0.2, `Tier ${tower.tier}!`, '#f7d97e');
    this._emitHud();
    return true;
  }

  cycleSelectedTargetMode() {
    const tower = this.getSelectedTower();
    if (!tower) return;
    const modes = ['first', 'strongest', 'closest', 'last'];
    const idx = modes.indexOf(tower.targetMode);
    tower.targetMode = modes[(idx + 1) % modes.length];
    sound.playSelect();
    this._emitHud();
  }

  sellSelectedTower() {
    const tower = this.getSelectedTower();
    if (!tower) return false;
    const refund = Math.round(tower.invested * 0.75);
    this.gold += refund;
    this.towers = this.towers.filter((t) => t.id !== tower.id);
    this.selectedTowerId = null;
    this._recomputeKingAuras();
    sound.playSell();
    this._spawnDustBurst(tower.col + 0.5, tower.row + 0.55, '#d8c39b', 10);
    this._spawnFloatText(tower.col + 0.5, tower.row + 0.3, `+${refund}g`, '#f0c050');
    this._emitHud();
    return true;
  }

  getSelectedTower() {
    if (!this.selectedTowerId) return null;
    return this.towers.find((t) => t.id === this.selectedTowerId) || null;
  }

  startNextWave() {
    sound.unlock();
    if (this.gameState !== 'playing') return;
    if (!this.level) return;

    const nextIdx = this.waveIndex + 1;
    if (nextIdx >= this.level.waves.length) return;

    // Early-call gold bonus if previous wave is still wrapping up or auto timer active
    let earlyBonus = 0;
    if (this.waveActive && this.spawnQueue.length === 0) {
      earlyBonus = 15 + nextIdx * 3;
    } else if (!this.waveActive && this.waveIndex >= 0 && this.autoStartTimer > 1) {
      earlyBonus = Math.round(this.autoStartTimer * 2.5);
    }
    if (earlyBonus > 0) {
      this.gold += earlyBonus;
      const [sc, sr] = this.pathTiles[0];
      this._spawnFloatText(sc + 0.5, sr + 0.4, `+${earlyBonus}g Early!`, '#f0c050');
    }

    this.waveIndex = nextIdx;
    this.waveActive = true;
    this.autoStartTimer = 0;

    const waveDef = this.level.waves[this.waveIndex];
    let cursorTime = 0.2;
    let hasBoss = false;

    for (const group of waveDef.groups) {
      if (group.delay) cursorTime += group.delay;
      if (group.type === 'warlord') hasBoss = true;
      for (let i = 0; i < group.count; i++) {
        this.spawnQueue.push({
          time: cursorTime,
          type: group.type,
        });
        cursorTime += group.interval;
      }
    }
    this.spawnQueue.sort((a, b) => a.time - b.time);

    sound.playWaveStart(hasBoss);
    sound.setMusicIntensity(hasBoss ? 'boss' : 'battle');
    if (hasBoss) {
      this._triggerShake(0.4, 5);
      this._emitBanner('Crimson Warlord Approaches!');
    }
    this._emitHud();
  }

  _handleTileTap(col, row, isTouch) {
    // 1. Check if tapping an existing tower
    const existing = this.towers.find((t) => t.col === col && t.row === row);
    if (existing) {
      sound.playSelect();
      this.selectedTowerId = existing.id;
      this.previewTile = null;
      this._emitHud();
      return;
    }

    // 2. Otherwise check placement if a build piece is active
    if (this.selectedBuildPieceId && this.canBuildAt(col, row)) {
      if (isTouch) {
        // Two-tap confirm on touchscreens so players can inspect exact chess sightlines!
        if (
          this.previewTile &&
          this.previewTile.col === col &&
          this.previewTile.row === row
        ) {
          this.placeTower(this.selectedBuildPieceId, col, row);
        } else {
          sound.playSelect();
          this.selectedTowerId = null;
          this.previewTile = { col, row };
          this._emitHud();
        }
      } else {
        this.placeTower(this.selectedBuildPieceId, col, row);
      }
      return;
    }

    // 3. Tapped road or invalid tile -> deselect tower & preview
    this.selectedTowerId = null;
    this.previewTile = null;
    this._emitHud();
  }

  _clientToTile(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const { u, v } = this.screenToBoard(sx, sy);
    const col = Math.floor(u);
    const row = Math.floor(v);
    if (col < 0 || col >= BOARD_SIZE || row < 0 || row >= BOARD_SIZE) return null;
    return { col, row };
  }

  _recomputeKingAuras() {
    for (const t of this.towers) {
      t.buffDamageMult = 1;
      t.buffRateMult = 1;
      t.buffedByKing = false;
    }
    const kings = this.towers.filter((t) => t.pieceId === 'king');
    for (const king of kings) {
      const stats = getPieceStats('king', king.tier);
      if (!stats.auraBuff) continue;
      for (const other of this.towers) {
        if (other.id === king.id) continue;
        if (Math.abs(other.col - king.col) <= 1 && Math.abs(other.row - king.row) <= 1) {
          other.buffDamageMult = Math.max(other.buffDamageMult, stats.auraBuff.damageMult);
          other.buffRateMult = Math.max(other.buffRateMult, stats.auraBuff.rateMult);
          other.buffedByKing = true;
        }
      }
    }
  }

  // ==================== SIMULATION UPDATE ====================

  update(dt) {
    this.time += dt;

    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
    }

    // 1. Spawn queued enemies
    if (this.spawnQueue.length > 0) {
      for (const item of this.spawnQueue) {
        item.time -= dt;
      }
      while (this.spawnQueue.length > 0 && this.spawnQueue[0].time <= 0) {
        const next = this.spawnQueue.shift();
        this._spawnEnemy(next.type);
      }
    }

    // 2. Update enemies
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.hitFlash = Math.max(0, e.hitFlash - dt * 5);
      if (e.slowTimer > 0) {
        e.slowTimer = Math.max(0, e.slowTimer - dt);
        if (e.slowTimer === 0) e.slowAmount = 0;
      }
      if (e.sunderTimer > 0) {
        e.sunderTimer = Math.max(0, e.sunderTimer - dt);
        if (e.sunderTimer === 0) e.sunderAmount = 0;
      }
      if (e.staggerTimer > 0) {
        e.staggerTimer = Math.max(0, e.staggerTimer - dt);
      }

      // Cleric AoE heal pulse
      if (e.healAmount > 0) {
        e.healTimer -= dt;
        if (e.healTimer <= 0) {
          e.healTimer = e.healCooldown;
          let healedAny = false;
          for (const ally of this.enemies) {
            if (!ally.alive || ally.hp >= ally.maxHp) continue;
            if (Math.hypot(ally.x - e.x, ally.y - e.y) <= e.healRadius) {
              ally.hp = Math.min(ally.maxHp, ally.hp + e.healAmount);
              healedAny = true;
            }
          }
          if (healedAny) {
            this._spawnRing(e.x, e.y, e.healRadius, '#d9534f', 0.45);
          }
        }
      }

      // Move along waypoints
      const slowResist = e.isBoss ? 0.55 : 1.0;
      const effSlow = e.slowAmount * slowResist;
      const moveSpeed = e.staggerTimer > 0 ? e.speed * 0.15 : e.speed * (1 - effSlow);
      const stepDist = moveSpeed * dt;

      let remaining = stepDist;
      while (remaining > 0 && e.tileIdx < this.pathTiles.length - 1) {
        const [tx, ty] = this.pathTiles[e.tileIdx + 1];
        const targetX = tx + 0.5;
        const targetY = ty + 0.5;
        const dx = targetX - e.x;
        const dy = targetY - e.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= remaining) {
          e.x = targetX;
          e.y = targetY;
          e.tileIdx += 1;
          remaining -= dist;
        } else {
          e.x += (dx / dist) * remaining;
          e.y += (dy / dist) * remaining;
          // Isometric screen X direction is proportional to (dx - dy)
          const screenDx = dx - dy;
          if (Math.abs(screenDx) > 0.05) {
            e.facing = screenDx < 0 ? -1 : 1;
          }
          remaining = 0;
        }
      }
      e.pathProgress = e.tileIdx + 1 - Math.hypot(
        this.pathTiles[Math.min(e.tileIdx + 1, this.pathTiles.length - 1)][0] + 0.5 - e.x,
        this.pathTiles[Math.min(e.tileIdx + 1, this.pathTiles.length - 1)][1] + 0.5 - e.y
      );

      // Reached Citadel Gate
      if (e.tileIdx >= this.pathTiles.length - 1) {
        e.alive = false;
        this.lives = Math.max(0, this.lives - e.livesCost);
        sound.playLeak();
        this._triggerShake(0.32, 6);
        this._spawnFloatText(e.x, e.y - 0.3, `-${e.livesCost} ♥`, '#e05248');
        this._emitHud();
        if (this.lives <= 0) {
          this.gameState = 'defeat';
          sound.setMusicIntensity('off');
          sound.playDefeat();
          this.callbacks.onGameEnd?.({ victory: false, level: this.level, score: this.score });
          return;
        }
      }
    }

    // 3. Update towers & attacks
    for (const tower of this.towers) {
      if (tower.placeAnim > 0) tower.placeAnim = Math.max(0, tower.placeAnim - dt * 3.8);
      if (tower.recoil > 0) tower.recoil = Math.max(0, tower.recoil - dt * 6.0);

      const stats = getPieceStats(tower.pieceId, tower.tier);
      tower.cooldown -= dt;
      if (tower.cooldown > 0) continue;

      const selected = selectTarget(tower, stats, this.enemies);
      if (!selected) continue;

      const effectiveRate = stats.fireRate * tower.buffRateMult;
      tower.cooldown = 1 / effectiveRate;
      tower.recoil = 1.0;

      this._executeTowerAttack(tower, stats, selected.enemy, selected.hit);
    }

    // 4. Update projectiles
    for (const p of this.projectiles) {
      p.t += dt / p.duration;
      if (p.t >= 1) {
        p.done = true;
        this._resolveProjectileImpact(p);
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.done);

    // 5. Update beams, rings, particles, float texts
    for (const b of this.beams) b.life -= dt;
    this.beams = this.beams.filter((b) => b.life > 0);

    for (const r of this.rings) r.life -= dt;
    this.rings = this.rings.filter((r) => r.life > 0);

    for (const pt of this.particles) {
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.z = Math.max(0, (pt.z || 0) + (pt.vz || 0) * dt);
      pt.vz = (pt.vz || 0) - 6.5 * dt;
      pt.life -= dt;
    }
    this.particles = this.particles.filter((pt) => pt.life > 0);

    for (const ft of this.floatTexts) {
      ft.z = (ft.z || 0.9) + 1.15 * dt;
      ft.life -= dt;
    }
    this.floatTexts = this.floatTexts.filter((ft) => ft.life > 0);

    // Cleanup dead enemies
    this.enemies = this.enemies.filter((e) => e.alive);

    // 6. Check wave completion & victory
    if (this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      this._onWaveCleared();
    }
  }

  _spawnEnemy(typeId, customPos = null) {
    const cfg = createEnemyConfig(
      typeId,
      this.level.id,
      Math.max(0, this.waveIndex),
      this.level.waves.length,
      this.difficulty
    );
    const [sx, sy] = this.pathTiles[0];
    const enemy = {
      id: this.nextEntityId++,
      ...cfg,
      hp: cfg.maxHp,
      x: customPos ? customPos.x : sx + 0.5,
      y: customPos ? customPos.y : sy + 0.5,
      tileIdx: customPos ? customPos.tileIdx : 0,
      pathProgress: customPos ? customPos.pathProgress : 0,
      facing: 1,
      alive: true,
      hitFlash: 0,
      slowAmount: 0,
      slowTimer: 0,
      sunderAmount: 0,
      sunderTimer: 0,
      staggerTimer: 0,
      healTimer: cfg.healCooldown || 0,
      summonedMinions: false,
      bobPhase: Math.random() * Math.PI * 2,
    };
    this.enemies.push(enemy);
    return enemy;
  }

  _executeTowerAttack(tower, stats, target, hitMeta) {
    const tx = tower.col + 0.5;
    const ty = tower.row + 0.5;
    const baseDmg = stats.damage * tower.buffDamageMult;
    sound.playAttack(stats.attackType);

    if (stats.attackType === 'spear') {
      // Instant melee/short spear thrust + diagonal crit!
      const isCrit = Boolean(hitMeta.isCrit);
      const dmg = isCrit ? baseDmg * (stats.diagonalCritMult || 1.35) : baseDmg;
      this.beams.push({
        x1: tx,
        y1: ty,
        x2: target.x,
        y2: target.y,
        color: isCrit ? '#ffd452' : '#f2deb4',
        width: isCrit ? 4.5 : 3,
        life: 0.14,
        maxLife: 0.14,
      });
      this._applyDamage(target, dmg, stats.armorPierce, tower, isCrit);
      return;
    }

    if (stats.attackType === 'leap_slam') {
      // Knight arcing shockwave leap!
      const destX = target.x;
      const destY = target.y;
      this.projectiles.push({
        kind: 'knight_arc',
        tower,
        stats,
        damage: baseDmg,
        x1: tx,
        y1: ty,
        x2: destX,
        y2: destY,
        arcHeight: 1.35,
        t: 0,
        duration: 0.34,
        color: '#f0b848',
      });
      return;
    }

    if (stats.attackType === 'diagonal_beam') {
      // Bishop piercing solar beam down the diagonal ray!
      const rayHits = getEnemiesOnRay(tower, stats, hitMeta.dc, hitMeta.dr, this.enemies);
      const maxSteps = stats.maxRay || 6;
      let endX = tx;
      let endY = ty;
      for (let s = 1; s <= maxSteps; s++) {
        const nc = tower.col + hitMeta.dc * s;
        const nr = tower.row + hitMeta.dr * s;
        if (nc < 0 || nc >= BOARD_SIZE || nr < 0 || nr >= BOARD_SIZE) break;
        endX = nc + 0.5;
        endY = nr + 0.5;
      }
      this.beams.push({
        x1: tx,
        y1: ty,
        x2: endX,
        y2: endY,
        color: '#f7c148',
        glowColor: 'rgba(255, 198, 72, 0.55)',
        width: 6.5,
        life: 0.24,
        maxLife: 0.24,
      });
      for (const { enemy } of rayHits) {
        this._applyDamage(enemy, baseDmg, stats.armorPierce, tower, false);
        if (enemy.alive && stats.sunderAmount) {
          enemy.sunderAmount = Math.max(enemy.sunderAmount, stats.sunderAmount);
          enemy.sunderTimer = Math.max(enemy.sunderTimer, stats.sunderDuration || 3.5);
        }
      }
      return;
    }

    if (stats.attackType === 'cannon_line') {
      // Rook heavy orthogonal bronze cannonball
      const dist = Math.hypot(target.x - tx, target.y - ty);
      this.projectiles.push({
        kind: 'cannonball',
        tower,
        stats,
        damage: baseDmg,
        x1: tx,
        y1: ty,
        x2: target.x,
        y2: target.y,
        arcHeight: 0.18,
        t: 0,
        duration: Math.max(0.14, Math.min(0.42, dist * 0.085)),
        color: '#3a2e25',
      });
      this._spawnDustBurst(tx + hitMeta.dc * 0.35, ty + hitMeta.dr * 0.35, '#e8b96a', 5);
      return;
    }

    if (stats.attackType === 'royal_volley') {
      // Queen rapid ricocheting starlight bolts
      const hitSet = new Set([target.id]);
      let prevX = tx;
      let prevY = ty;
      let current = target;
      const bounces = stats.chainCount || 2;

      for (let i = 0; i < bounces && current; i++) {
        const dmg = baseDmg * Math.pow(0.8, i);
        this.beams.push({
          x1: prevX,
          y1: prevY,
          x2: current.x,
          y2: current.y,
          color: i === 0 ? '#ffe484' : '#f2b84b',
          glowColor: 'rgba(255, 224, 120, 0.45)',
          width: i === 0 ? 4.5 : 3.2,
          life: 0.18,
          maxLife: 0.18,
        });
        this._applyDamage(current, dmg, stats.armorPierce, tower, false);

        prevX = current.x;
        prevY = current.y;
        // Find nearest unhit enemy within 2.3 tiles
        let nextTarget = null;
        let bestDist = 2.35;
        for (const cand of this.enemies) {
          if (!cand.alive || hitSet.has(cand.id)) continue;
          const d = Math.hypot(cand.x - prevX, cand.y - prevY);
          if (d < bestDist) {
            bestDist = d;
            nextTarget = cand;
          }
        }
        if (nextTarget) hitSet.add(nextTarget.id);
        current = nextTarget;
      }
      return;
    }

    if (stats.attackType === 'aura_smite') {
      // King Sovereign Smite descending vertically from the sky in 3D!
      this.beams.push({
        x1: target.x,
        y1: target.y,
        z1: 3.6,
        x2: target.x,
        y2: target.y,
        z2: 0.2,
        color: '#ffe078',
        glowColor: 'rgba(255, 200, 72, 0.65)',
        width: 6,
        life: 0.22,
        maxLife: 0.22,
      });
      this._spawnRing(target.x, target.y, stats.splashRadius || 0.75, '#f0c050', 0.35);
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - target.x, e.y - target.y) <= (stats.splashRadius || 0.75) + 0.2) {
          this._applyDamage(e, baseDmg, stats.armorPierce, tower, false);
        }
      }
      return;
    }

    if (stats.attackType === 'frost_pulse') {
      // Non-Chess Relic: Frost Obelisk radial nova!
      const radius = stats.range || 2.15;
      this._spawnRing(tx, ty, radius, '#5cc2f2', 0.5);
      this._spawnDustBurst(tx, ty, '#9be0ff', 10);
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (Math.hypot(e.x - tx, e.y - ty) <= radius + 0.3) {
          this._applyDamage(e, baseDmg, stats.armorPierce, tower, false);
          if (e.alive) {
            e.slowAmount = Math.max(e.slowAmount, stats.slowAmount || 0.42);
            e.slowTimer = Math.max(e.slowTimer, stats.slowDuration || 2.6);
          }
        }
      }
    }
  }

  _resolveProjectileImpact(p) {
    const splash = p.stats.splashRadius || 0.85;
    const isCannon = p.kind === 'cannonball';
    sound.playImpact(p.kind);
    this._spawnRing(p.x2, p.y2, splash, isCannon ? '#e88b3c' : '#f2c14e', 0.38);
    this._spawnDustBurst(p.x2, p.y2, isCannon ? '#f0a250' : '#ffe099', isCannon ? 12 : 9);
    this._triggerShake(0.14, isCannon ? 3.5 : 2.2);

    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dist = Math.hypot(e.x - p.x2, e.y - p.y2);
      if (dist <= splash + 0.25) {
        const falloff = dist <= 0.45 ? 1.0 : 0.72;
        this._applyDamage(e, p.damage * falloff, p.stats.armorPierce, p.tower, false);
        if (e.alive && p.stats.staggerDuration && !e.isBoss) {
          e.staggerTimer = Math.max(e.staggerTimer, p.stats.staggerDuration);
        }
      }
    }
  }

  _applyDamage(enemy, rawDmg, armorPierce, tower, isCrit) {
    if (!enemy.alive) return;
    const effArmor = Math.max(0, enemy.armor * (1 - enemy.sunderAmount) * (1 - (armorPierce || 0)));
    const finalDmg = Math.max(2, Math.round(rawDmg * (1 - effArmor)));

    enemy.hp -= finalDmg;
    enemy.hitFlash = 1.0;
    if (tower) tower.damageDealt += finalDmg;

    if (isCrit) {
      this._spawnFloatText(enemy.x, enemy.y - 0.35, `${finalDmg}!`, '#ffd452');
    }

    // Crimson Warlord 50% HP summon ability!
    if (enemy.isBoss && !enemy.summonedMinions && enemy.hp > 0 && enemy.hp <= enemy.maxHp * 0.5) {
      enemy.summonedMinions = true;
      this._triggerShake(0.35, 5);
      this._spawnRing(enemy.x, enemy.y, 1.4, '#e04f3e', 0.5);
      this._spawnFloatText(enemy.x, enemy.y - 0.55, 'Reinforcements!', '#ff7666');
      for (let i = 0; i < 4; i++) {
        this._spawnEnemy('footman', {
          x: enemy.x + (Math.random() - 0.5) * 0.3,
          y: enemy.y + (Math.random() - 0.5) * 0.3,
          tileIdx: enemy.tileIdx,
          pathProgress: enemy.pathProgress,
        });
      }
    }

    if (enemy.hp <= 0) {
      enemy.alive = false;
      this.gold += enemy.reward;
      this.score += enemy.reward * 10;
      if (tower) tower.kills += 1;
      sound.playEnemyKill(Boolean(enemy.isBoss));
      this._spawnDustBurst(enemy.x, enemy.y, '#e8684a', enemy.isBoss ? 22 : 9);
      this._spawnFloatText(enemy.x, enemy.y - 0.25, `+${enemy.reward}g`, '#f5cc66');
      this._emitHud();
    } else {
      sound.playHit(isCrit, effArmor >= 0.35);
    }
  }

  _onWaveCleared() {
    // Tightened wave clear bonus + King Royal Treasury gold!
    const waveBonus = 15 + this.waveIndex * 4;
    let kingBonus = 0;
    for (const t of this.towers) {
      if (t.pieceId === 'king') {
        const stats = getPieceStats('king', t.tier);
        if (stats.auraBuff?.goldPerWave) {
          kingBonus += stats.auraBuff.goldPerWave;
          this._spawnFloatText(t.col + 0.5, t.row + 0.2, `+${stats.auraBuff.goldPerWave}g Crown`, '#ffd452');
        }
      }
    }
    this.gold += waveBonus + kingBonus;
    this.score += (waveBonus + kingBonus) * 5;

    if (this.waveIndex >= this.level.waves.length - 1) {
      // Campaign Level Victory!
      this.gameState = 'victory';
      const lifeRatio = this.lives / this.maxLives;
      const stars = lifeRatio >= 0.85 ? 3 : lifeRatio >= 0.45 ? 2 : 1;
      sound.setMusicIntensity('off');
      sound.playVictory();
      this._emitHud();
      this.callbacks.onGameEnd?.({
        victory: true,
        level: this.level,
        stars,
        score: this.score + this.lives * 100 + this.gold * 2,
        livesLeft: this.lives,
      });
      return;
    }

    sound.setMusicIntensity('prep');
    this._emitBanner(`Wave ${this.waveIndex + 1} Cleared! +${waveBonus + kingBonus}g`);
    this._emitHud();
  }

  _triggerShake(duration, intensity) {
    this.shakeTime = Math.max(this.shakeTime, duration);
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
  }

  _spawnRing(x, y, maxRadius, color, duration = 0.4) {
    this.rings.push({ x, y, maxRadius, color, life: duration, maxLife: duration });
  }

  _spawnDustBurst(x, y, color, count = 8) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const spd = 0.7 + Math.random() * 1.9;
      this.particles.push({
        x,
        y,
        z: 0.22,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        vz: 1.8 + Math.random() * 2.2,
        size: 2.2 + Math.random() * 2.6,
        color,
        life: 0.34 + Math.random() * 0.24,
        maxLife: 0.58,
      });
    }
  }

  _spawnFloatText(x, y, text, color) {
    this.floatTexts.push({ x, y, z: 0.95, text, color, life: 0.95, maxLife: 0.95 });
  }

  _emitBanner(msg) {
    this.callbacks.onBanner?.(msg);
  }

  _emitHud() {
    this.callbacks.onHudUpdate?.({
      gold: this.gold,
      lives: this.lives,
      maxLives: this.maxLives,
      waveIndex: this.waveIndex,
      totalWaves: this.level ? this.level.waves.length : 0,
      waveActive: this.waveActive,
      gameState: this.gameState,
      speedMult: this.speedMult,
      selectedBuildPieceId: this.selectedBuildPieceId,
      previewTile: this.previewTile,
      selectedTower: this.getSelectedTower(),
      towers: this.towers,
      nextWaveDef:
        this.level && this.waveIndex + 1 < this.level.waves.length
          ? this.level.waves[this.waveIndex + 1]
          : null,
    });
  }

  // ==================== 2.5D ISOMETRIC TABLETOP RENDERER ====================

  _traceIsoQuad(ctx, u1, v1, u2, v2, z = 0) {
    const p0 = this.boardToScreen(u1, v1, z);
    const p1 = this.boardToScreen(u2, v1, z);
    const p2 = this.boardToScreen(u2, v2, z);
    const p3 = this.boardToScreen(u1, v2, z);
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
  }

  _drawIsoExtrudedBox(ctx, u1, v1, u2, v2, zTop, zBot, topFill, leftWallFill, rightWallFill) {
    const t0 = this.boardToScreen(u1, v1, zTop); // North
    const t1 = this.boardToScreen(u2, v1, zTop); // East
    const t2 = this.boardToScreen(u2, v2, zTop); // South
    const t3 = this.boardToScreen(u1, v2, zTop); // West

    const b1 = this.boardToScreen(u2, v1, zBot);
    const b2 = this.boardToScreen(u2, v2, zBot);
    const b3 = this.boardToScreen(u1, v2, zBot);

    // Front-Left vertical face (West -> South, lit by warm upper-left light)
    if (leftWallFill) {
      ctx.beginPath();
      ctx.moveTo(t3.x, t3.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(b2.x, b2.y);
      ctx.lineTo(b3.x, b3.y);
      ctx.closePath();
      ctx.fillStyle = leftWallFill;
      ctx.fill();
    }

    // Front-Right vertical face (South -> East, deeper shadow side)
    if (rightWallFill) {
      ctx.beginPath();
      ctx.moveTo(t2.x, t2.y);
      ctx.lineTo(t1.x, t1.y);
      ctx.lineTo(b1.x, b1.y);
      ctx.lineTo(b2.x, b2.y);
      ctx.closePath();
      ctx.fillStyle = rightWallFill;
      ctx.fill();
    }

    // Top diamond surface
    if (topFill) {
      ctx.beginPath();
      ctx.moveTo(t0.x, t0.y);
      ctx.lineTo(t1.x, t1.y);
      ctx.lineTo(t2.x, t2.y);
      ctx.lineTo(t3.x, t3.y);
      ctx.closePath();
      ctx.fillStyle = topFill;
      ctx.fill();
    }
  }

  render() {
    const ctx = this.ctx;
    if (!this.canvasW || !this.level) return;

    ctx.clearRect(0, 0, this.canvasW, this.canvasH);
    ctx.save();

    // Subtle screen shake on cannon booms & warlord arrival
    if (this.shakeTime > 0) {
      const mag = this.shakeIntensity * (this.shakeTime / 0.3);
      ctx.translate((Math.random() - 0.5) * mag * 2, (Math.random() - 0.5) * mag * 2);
    }

    this._drawWalnutSlab(ctx);
    this._drawIsoBoardTiles(ctx);
    this._drawRoadRibbonAndRift(ctx);
    this._drawPatternOverlay(ctx);
    this._drawKingTethers(ctx);
    this._drawEntitiesSorted(ctx);
    this._drawProjectilesAndVfx(ctx);
    this._drawFloatTexts(ctx);

    ctx.restore();
  }

  _drawWalnutSlab(ctx) {
    const b = 0.56; // Walnut frame overhang in tiles
    const slabTop = 0.06;
    const slabBot = -0.58;

    // 1. Soft grounded drop shadow beneath the entire 3D diamond tabletop board
    ctx.save();
    this._traceIsoQuad(ctx, -b + 0.12, -b + 0.16, BOARD_SIZE + b + 0.12, BOARD_SIZE + b + 0.16, slabBot - 0.18);
    ctx.fillStyle = 'rgba(6, 3, 1, 0.55)';
    ctx.fill();
    ctx.restore();

    // 2. Sculpted 3D Walnut Tabletop Slab with warm directional shading
    const pTopN = this.boardToScreen(-b, -b, slabTop);
    const pTopS = this.boardToScreen(BOARD_SIZE + b, BOARD_SIZE + b, slabTop);
    const topGrad = ctx.createLinearGradient(pTopN.x, pTopN.y, pTopS.x, pTopS.y);
    topGrad.addColorStop(0, '#503421');
    topGrad.addColorStop(0.5, '#3a2416');
    topGrad.addColorStop(1, '#2a190f');

    this._drawIsoExtrudedBox(
      ctx,
      -b,
      -b,
      BOARD_SIZE + b,
      BOARD_SIZE + b,
      slabTop,
      slabBot,
      topGrad,
      '#462c1b', // Lit front-left walnut side
      '#24140b'  // Shaded front-right walnut side
    );

    // 3. Gleaming antique brass inlay band running around the 3D vertical slab wall
    const bandZ = -0.24;
    const wL = this.boardToScreen(-b, BOARD_SIZE + b, bandZ);
    const wS = this.boardToScreen(BOARD_SIZE + b, BOARD_SIZE + b, bandZ);
    const wR = this.boardToScreen(BOARD_SIZE + b, -b, bandZ);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(wL.x, wL.y);
    ctx.lineTo(wS.x, wS.y);
    ctx.lineTo(wR.x, wR.y);
    ctx.strokeStyle = 'rgba(222, 180, 102, 0.65)';
    ctx.lineWidth = Math.max(1.8, this.tileW * 0.032);
    ctx.stroke();

    // Outer top rim brass bevel
    this._traceIsoQuad(ctx, -b, -b, BOARD_SIZE + b, BOARD_SIZE + b, slabTop);
    ctx.strokeStyle = 'rgba(218, 178, 104, 0.52)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Inner inlaid brass frame hugging the 8x8 playing field
    this._traceIsoQuad(ctx, -0.04, -0.04, BOARD_SIZE + 0.04, BOARD_SIZE + 0.04, slabTop + 0.01);
    ctx.strokeStyle = 'rgba(232, 194, 118, 0.72)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 4. Gilded chess coordinates along front-left (A-H) and front-right (8-1) walnut bevels
    const fontSize = Math.max(8, Math.round(this.tileW * 0.16));
    ctx.save();
    ctx.fillStyle = 'rgba(236, 206, 152, 0.78)';
    ctx.font = `700 ${fontSize}px Cinzel, Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const files = 'ABCDEFGH';

    for (let i = 0; i < BOARD_SIZE; i++) {
      // A-H along front-left edge (v = 8.28)
      const pf = this.boardToScreen(i + 0.5, BOARD_SIZE + 0.28, slabTop);
      ctx.fillText(files[i], pf.x, pf.y);
      // 8-1 along front-right edge (u = 8.28)
      const pr = this.boardToScreen(BOARD_SIZE + 0.28, i + 0.5, slabTop);
      ctx.fillText(String(8 - i), pr.x, pr.y);
    }
    ctx.restore();
  }

  _drawIsoBoardTiles(ctx) {
    const elevatedZ = 0.16;
    const roadZ = 0.0;

    // Back-to-front painter's order guarantees vertical stone lips occlude recessed road tiles cleanly!
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const isRoad = this.pathSet.has(`${c},${r}`);
        const isLight = (r + c) % 2 === 0;

        if (isRoad) {
          // Recessed dark obsidian basalt cobblestone trench!
          this._traceIsoQuad(ctx, c, r, c + 1, r + 1, roadZ);
          ctx.fillStyle = isLight ? '#403833' : '#352e2a';
          ctx.fill();
          ctx.strokeStyle = 'rgba(18, 12, 8, 0.5)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Subtle carved inner cobblestone flagstone highlight
          this._traceIsoQuad(ctx, c + 0.12, r + 0.12, c + 0.88, r + 0.88, roadZ);
          ctx.fillStyle = 'rgba(255, 224, 175, 0.045)';
          ctx.fill();
        } else {
          // Elevated sculpted travertine & walnut marble block!
          const topFill = isLight ? '#e8dac2' : '#9c886d';
          const leftWall = isLight ? '#bfa989' : '#78664e';
          const rightWall = isLight ? '#968062' : '#594a38';

          // Draw extruded stone block from roadZ up to elevatedZ
          this._drawIsoExtrudedBox(
            ctx,
            c + 0.015,
            r + 0.015,
            c + 0.985,
            r + 0.985,
            elevatedZ,
            roadZ,
            topFill,
            leftWall,
            rightWall
          );

          // Crisp sunlit marble edge highlight along North-West & North-East bevel
          const tN = this.boardToScreen(c + 0.02, r + 0.02, elevatedZ);
          const tE = this.boardToScreen(c + 0.98, r + 0.02, elevatedZ);
          const tW = this.boardToScreen(c + 0.02, r + 0.98, elevatedZ);
          ctx.beginPath();
          ctx.moveTo(tW.x, tW.y);
          ctx.lineTo(tN.x, tN.y);
          ctx.lineTo(tE.x, tE.y);
          ctx.strokeStyle = isLight ? 'rgba(255, 252, 244, 0.45)' : 'rgba(255, 245, 226, 0.18)';
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }
    }
  }

  _drawRoadRibbonAndRift(ctx) {
    // 1. Golden-ember directional path ribbon flush inside the recessed road trench
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i < this.pathTiles.length; i++) {
      const [c, r] = this.pathTiles[i];
      const p = this.boardToScreen(c + 0.5, r + 0.5, 0.01);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.strokeStyle = 'rgba(217, 148, 72, 0.24)';
    ctx.lineWidth = Math.max(2.5, this.tileW * 0.11);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Animated marching dashes flowing down the isometric trench
    const dashLen = this.tileW * 0.16;
    ctx.setLineDash([dashLen, dashLen * 1.6]);
    ctx.lineDashOffset = -this.time * this.tileW * 0.55;
    ctx.strokeStyle = 'rgba(246, 192, 102, 0.5)';
    ctx.lineWidth = Math.max(1.5, this.tileW * 0.048);
    ctx.stroke();
    ctx.restore();

    // 2. Elliptical glowing Dark Rift Spawn Portal lying flat on the start diamond
    const [sc, sr] = this.pathTiles[0];
    const sp = this.boardToScreen(sc + 0.5, sr + 0.5, 0.02);
    const pulse = 0.88 + 0.12 * Math.sin(this.time * 4.2);
    const rx = this.tileW * 0.34 * pulse;
    const ry = rx * this.isoRatio;

    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.scale(1, this.isoRatio);
    const riftGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, rx);
    riftGrad.addColorStop(0, 'rgba(255, 130, 86, 0.95)');
    riftGrad.addColorStop(0.45, 'rgba(180, 34, 24, 0.78)');
    riftGrad.addColorStop(1, 'rgba(40, 10, 10, 0)');
    ctx.fillStyle = riftGrad;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Subtle swirling crimson inner ring
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 160, 110, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(sp.x, sp.y, rx * 0.55, ry * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  _drawPatternOverlay(ctx) {
    let originCol = null;
    let originRow = null;
    let stats = null;
    let isPreview = false;

    const selTower = this.getSelectedTower();
    if (selTower) {
      originCol = selTower.col;
      originRow = selTower.row;
      stats = getPieceStats(selTower.pieceId, selTower.tier);
    } else if (this.selectedBuildPieceId) {
      const targetTile = this.previewTile || this.hoverTile;
      if (targetTile && this.canBuildAt(targetTile.col, targetTile.row)) {
        originCol = targetTile.col;
        originRow = targetTile.row;
        stats = getPieceStats(this.selectedBuildPieceId, 1);
        isPreview = true;
      }
    }

    if (originCol === null || !stats) return;

    const tiles = getPatternTiles(originCol, originRow, stats);
    const originP = this.boardToScreen(originCol + 0.5, originRow + 0.5, 0.25);

    // Highlight every threatened square as a glowing isometric diamond!
    for (const t of tiles) {
      const onRoad = this.pathSet.has(`${t.col},${t.row}`);
      const z = onRoad ? 0.02 : 0.175;
      this._traceIsoQuad(ctx, t.col + 0.04, t.row + 0.04, t.col + 0.96, t.row + 0.96, z);

      if (t.kind === 'frost') {
        ctx.fillStyle = onRoad ? 'rgba(92, 194, 242, 0.4)' : 'rgba(92, 194, 242, 0.18)';
      } else if (t.kind === 'aura') {
        ctx.fillStyle = onRoad ? 'rgba(240, 192, 80, 0.38)' : 'rgba(240, 192, 80, 0.24)';
      } else if (t.kind === 'crit') {
        ctx.fillStyle = onRoad ? 'rgba(255, 200, 64, 0.48)' : 'rgba(255, 200, 64, 0.26)';
      } else {
        ctx.fillStyle = onRoad ? 'rgba(240, 184, 72, 0.44)' : 'rgba(240, 184, 72, 0.2)';
      }
      ctx.fill();

      if (onRoad || t.kind === 'jump' || t.kind === 'crit') {
        ctx.strokeStyle =
          t.kind === 'frost' ? 'rgba(136, 224, 255, 0.9)' : 'rgba(255, 220, 118, 0.92)';
        ctx.lineWidth = onRoad ? 2 : 1.25;
        ctx.stroke();
      }

      // 3D graceful L-jump preview arcs for Knight
      if (t.kind === 'jump') {
        const destP = this.boardToScreen(t.col + 0.5, t.row + 0.5, z + 0.02);
        const midP = this.boardToScreen(
          (originCol + t.col) * 0.5 + 0.5,
          (originRow + t.row) * 0.5 + 0.5,
          1.35
        );
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(originP.x, originP.y);
        ctx.quadraticCurveTo(midP.x, midP.y, destP.x, destP.y);
        ctx.strokeStyle = onRoad ? 'rgba(255, 220, 118, 0.78)' : 'rgba(255, 220, 118, 0.3)';
        ctx.lineWidth = onRoad ? 2 : 1.2;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Highlight origin diamond
    this._traceIsoQuad(ctx, originCol + 0.03, originRow + 0.03, originCol + 0.97, originRow + 0.97, 0.18);
    ctx.strokeStyle = isPreview ? '#6be09a' : '#ffe082';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Translucent 3D miniature ghost when previewing placement
    if (isPreview) {
      const sprite = SPRITES[stats.sprite];
      if (sprite) {
        const gp = this.boardToScreen(originCol + 0.5, originRow + 0.5, 0.16);
        const drawSize = this.tileW * 0.96;
        ctx.save();
        ctx.globalAlpha = 0.76;
        ctx.drawImage(sprite, gp.x - drawSize * 0.5, gp.y - drawSize * 0.76, drawSize, drawSize);
        ctx.restore();
      }
    }
  }

  _drawKingTethers(ctx) {
    const kings = this.towers.filter((t) => t.pieceId === 'king');
    if (kings.length === 0) return;

    ctx.save();
    for (const king of kings) {
      const kp = this.boardToScreen(king.col + 0.5, king.row + 0.5, 0.22);
      for (const other of this.towers) {
        if (other.id === king.id || !other.buffedByKing) continue;
        if (Math.abs(other.col - king.col) <= 1 && Math.abs(other.row - king.row) <= 1) {
          const op = this.boardToScreen(other.col + 0.5, other.row + 0.5, 0.22);
          ctx.beginPath();
          ctx.moveTo(kp.x, kp.y);
          ctx.lineTo(op.x, op.y);
          ctx.strokeStyle = 'rgba(247, 206, 98, 0.48)';
          ctx.lineWidth = 2.2;
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }

  _drawEntitiesSorted(ctx) {
    // True Isometric Painter's Algorithm: sort strictly by depth (u + v)!
    const drawList = [];

    const [gc, gr] = this.pathTiles[this.pathTiles.length - 1];
    drawList.push({ depth: gc + gr + 1.05, kind: 'gate', col: gc, row: gr });

    for (const tower of this.towers) {
      drawList.push({ depth: tower.col + tower.row + 1.0, kind: 'tower', obj: tower });
    }
    for (const enemy of this.enemies) {
      if (enemy.alive) {
        drawList.push({ depth: enemy.x + enemy.y, kind: 'enemy', obj: enemy });
      }
    }

    drawList.sort((a, b) => a.depth - b.depth);

    for (const item of drawList) {
      if (item.kind === 'gate') {
        const gp = this.boardToScreen(item.col + 0.5, item.row + 0.5, 0.02);
        this._drawIsoShadow(ctx, gp.x, gp.y + this.tileH * 0.06, this.tileW * 0.38);
        const gateSprite = SPRITES.citadel_gate;
        if (gateSprite) {
          const sz = this.tileW * 1.12;
          ctx.drawImage(gateSprite, gp.x - sz * 0.5, gp.y - sz * 0.74, sz, sz);
        }
      } else if (item.kind === 'tower') {
        this._drawTower(ctx, item.obj);
      } else if (item.kind === 'enemy') {
        this._drawEnemy(ctx, item.obj);
      }
    }
  }

  _drawTower(ctx, tower) {
    const stats = getPieceStats(tower.pieceId, tower.tier);
    const baseZ = 0.16;
    const bounceZ = tower.placeAnim > 0 ? Math.sin(tower.placeAnim * Math.PI) * 0.55 : 0;
    const groundP = this.boardToScreen(tower.col + 0.5, tower.row + 0.5, baseZ);
    const pieceP = this.boardToScreen(tower.col + 0.5, tower.row + 0.5, baseZ + bounceZ);

    // Grounded isometric elliptical shadow
    this._drawIsoShadow(ctx, groundP.x, groundP.y + this.tileH * 0.06, this.tileW * 0.31);

    // King Royal Court aura ellipse under buffed defenders
    if (tower.buffedByKing) {
      ctx.save();
      ctx.strokeStyle = 'rgba(247, 206, 98, 0.82)';
      ctx.lineWidth = 2;
      const rx = this.tileW * 0.34;
      ctx.beginPath();
      ctx.ellipse(groundP.x, groundP.y + this.tileH * 0.04, rx, rx * this.isoRatio, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    const recoilScale = 1 + tower.recoil * 0.08;
    const drawSize = this.tileW * 0.96 * recoilScale;

    const sprite = SPRITES[stats.sprite];
    if (sprite) {
      ctx.drawImage(
        sprite,
        pieceP.x - drawSize * 0.5,
        pieceP.y - drawSize * 0.76,
        drawSize,
        drawSize
      );
    }

    // Promotion Tier pips nestled cleanly at the front of the walnut plinth
    if (tower.tier > 1) {
      const pipCount = tower.tier;
      const pipSpacing = Math.max(5.5, this.tileW * 0.11);
      const startX = groundP.x - ((pipCount - 1) * pipSpacing) / 2;
      const pipY = groundP.y + this.tileH * 0.22;
      for (let i = 0; i < pipCount; i++) {
        ctx.fillStyle = tower.tier === 3 ? '#ffe066' : '#e6b24c';
        ctx.strokeStyle = '#2a1a0e';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(startX + i * pipSpacing, pipY, Math.max(2.4, this.tileW * 0.042), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  _drawEnemy(ctx, enemy) {
    const bobZ = Math.abs(Math.sin(this.time * 7 * enemy.speed + enemy.bobPhase)) * 0.11;
    const groundP = this.boardToScreen(enemy.x, enemy.y, 0.02);
    const bodyP = this.boardToScreen(enemy.x, enemy.y, 0.02 + bobZ);

    this._drawIsoShadow(ctx, groundP.x, groundP.y + this.tileH * 0.05, this.tileW * 0.26 * enemy.scale);

    // Isometric glacial chill ring lying flat on the basalt trench
    if (enemy.slowTimer > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(116, 216, 255, 0.88)';
      ctx.fillStyle = 'rgba(92, 194, 242, 0.24)';
      ctx.lineWidth = 1.8;
      const rx = this.tileW * 0.3 * enemy.scale;
      ctx.beginPath();
      ctx.ellipse(groundP.x, groundP.y + this.tileH * 0.04, rx, rx * this.isoRatio, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    const hitScale = 1 + enemy.hitFlash * 0.08;
    const drawSize = this.tileW * 0.84 * enemy.scale * hitScale;
    const sprite = SPRITES[enemy.sprite];

    ctx.save();
    ctx.translate(bodyP.x, bodyP.y);
    if (enemy.facing < 0) {
      ctx.scale(-1, 1);
    }
    if (enemy.hitFlash > 0.15) {
      ctx.filter = `brightness(${1 + enemy.hitFlash * 0.75})`;
    } else if (enemy.slowTimer > 0) {
      ctx.filter = 'hue-rotate(155deg) saturate(1.25) brightness(1.08)';
    }
    if (sprite) {
      ctx.drawImage(sprite, -drawSize * 0.5, -drawSize * 0.76, drawSize, drawSize);
    }
    ctx.filter = 'none';
    ctx.restore();

    // Crisp HP bar floating cleanly above the miniature's head
    const barW = this.tileW * (enemy.isBoss ? 0.68 : 0.48);
    const barH = Math.max(3.5, this.tileW * (enemy.isBoss ? 0.085 : 0.065));
    const bx = bodyP.x - barW * 0.5;
    const by = bodyP.y - drawSize * 0.82;
    const hpRatio = Math.max(0, enemy.hp / enemy.maxHp);

    ctx.fillStyle = 'rgba(20, 14, 10, 0.84)';
    ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    ctx.fillStyle = enemy.isBoss ? '#f05442' : enemy.slowTimer > 0 ? '#5ec2f0' : '#d9483b';
    ctx.fillRect(bx, by, barW * hpRatio, barH);

    // Sundered armor indicator pip
    if (enemy.sunderTimer > 0) {
      ctx.fillStyle = '#f7c148';
      ctx.beginPath();
      ctx.arc(bx + barW + 4, by + barH * 0.5, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawIsoShadow(ctx, cx, cy, rx) {
    ctx.save();
    ctx.fillStyle = 'rgba(18, 10, 5, 0.38)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, rx * this.isoRatio, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  _drawProjectilesAndVfx(ctx) {
    // 1. Isometric ground-plane rings (Frost Nova, Knight shockwave, Rook blast, Cleric heal)
    for (const r of this.rings) {
      const progress = 1 - r.life / r.maxLife;
      const center = this.boardToScreen(r.x, r.y, 0.08);
      const rx = r.maxRadius * this.tileW * 0.68 * (0.25 + progress * 0.75);
      const ry = rx * this.isoRatio;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - progress);
      ctx.strokeStyle = r.color;
      ctx.lineWidth = Math.max(1.5, 3.8 * (1 - progress));
      ctx.beginPath();
      ctx.ellipse(center.x, center.y, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 2. 3D Elevated Beams (Bishop diagonal sunbeam, Queen ricochet, Pawn spear, King vertical smite)
    for (const b of this.beams) {
      const alpha = Math.max(0, b.life / b.maxLife);
      const p1 = this.boardToScreen(b.x1, b.y1, b.z1 ?? 0.62);
      const p2 = this.boardToScreen(b.x2, b.y2, b.z2 ?? 0.36);

      ctx.save();
      ctx.lineCap = 'round';
      if (b.glowColor) {
        ctx.globalAlpha = alpha * 0.8;
        ctx.strokeStyle = b.glowColor;
        ctx.lineWidth = b.width * 2.3;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = b.width;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.restore();
    }

    // 3. 3D Arcing Projectiles (Knight golden comet & Rook bronze cannonball)
    for (const p of this.projectiles) {
      const px = p.x1 + (p.x2 - p.x1) * p.t;
      const py = p.y1 + (p.y2 - p.y1) * p.t;
      const baseZ = 0.62 * (1 - p.t) + 0.25 * p.t;
      const arcZ = Math.sin(p.t * Math.PI) * (p.kind === 'knight_arc' ? 2.1 : 0.45);

      const groundP = this.boardToScreen(px, py, 0.05);
      const airP = this.boardToScreen(px, py, baseZ + arcZ);

      this._drawIsoShadow(ctx, groundP.x, groundP.y, this.tileW * 0.12);

      ctx.save();
      if (p.kind === 'knight_arc') {
        ctx.fillStyle = '#ffe28a';
        ctx.shadowColor = '#f0a830';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(airP.x, airP.y, Math.max(4.5, this.tileW * 0.11), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#332820';
        ctx.strokeStyle = '#d49a4a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(airP.x, airP.y, Math.max(4, this.tileW * 0.095), 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // 4. 3D Particles popping off the marble board
    for (const pt of this.particles) {
      const sp = this.boardToScreen(pt.x, pt.y, pt.z || 0.1);
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  _drawFloatTexts(ctx) {
    const fontSize = Math.max(11, Math.round(this.tileW * 0.21));

    ctx.save();
    ctx.font = `700 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const ft of this.floatTexts) {
      const alpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
      const sp = this.boardToScreen(ft.x, ft.y, ft.z || 0.95);
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(24, 15, 8, 0.85)';
      ctx.strokeText(ft.text, sp.x, sp.y);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, sp.x, sp.y);
    }
    ctx.restore();
  }
}


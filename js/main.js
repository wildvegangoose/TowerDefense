/**
 * Crownward — Main App Controller, Campaign Progression & Reactive HUD.
 */

import { preloadAssets, getSpriteUrl } from './assets.js';
import { sound } from './audio.js';
import { LEVELS } from './data/levels.js';
import {
  PIECE_REGISTRY,
  PIECE_ORDER,
  PIECE_CATEGORIES,
  FUTURE_BLUEPRINTS,
  getPieceStats,
  getUpgradeInfo,
  getUnlockedPiecesForLevel,
} from './data/pieces.js';
import { ENEMY_TYPES } from './data/enemies.js';
import { GameEngine } from './engine/game.js';

const SAVE_KEY = 'crownward_progress_v1';

class CrownwardApp {
  constructor() {
    this.progress = this._loadProgress();
    this.sandboxAll = localStorage.getItem('crownward_sandbox') === '1';
    this.currentLevel = null;
    this.engine = null;
    this.bannerTimer = null;
    this.deferredInstallPrompt = null;

    this._cacheDom();
    this._bindGlobalEvents();
    this._registerServiceWorker();
    this._init();
  }

  _cacheDom() {
    this.el = {
      screenHome: document.getElementById('screen-home'),
      screenGame: document.getElementById('screen-game'),
      levelGrid: document.getElementById('level-grid'),
      toggleSandbox: document.getElementById('toggle-sandbox'),
      btnOpenCodex: document.getElementById('btn-open-codex'),
      btnGameCodex: document.getElementById('btn-game-codex'),
      btnInstallPwa: document.getElementById('btn-install-pwa'),

      // Game HUD
      canvas: document.getElementById('game-canvas'),
      btnBackMenu: document.getElementById('btn-back-menu'),
      hudLevelNum: document.getElementById('hud-level-num'),
      hudLevelName: document.getElementById('hud-level-name'),
      hudGold: document.getElementById('hud-gold'),
      hudLives: document.getElementById('hud-lives'),
      hudWave: document.getElementById('hud-wave'),
      btnSpeed: document.getElementById('btn-speed'),
      btnPause: document.getElementById('btn-pause'),
      btnMute: document.getElementById('btn-mute'),
      battleBanner: document.getElementById('battle-banner'),

      // Touch Confirm
      touchConfirmBar: document.getElementById('touch-confirm-bar'),
      touchConfirmLabel: document.getElementById('touch-confirm-label'),
      btnCancelPreview: document.getElementById('btn-cancel-preview'),
      btnConfirmPlace: document.getElementById('btn-confirm-place'),

      // Tactical Dock
      tacticalDock: document.querySelector('.tactical-dock'),
      waveIntelTitle: document.getElementById('wave-intel-title'),
      waveEnemiesPreview: document.getElementById('wave-enemies-preview'),
      btnStartWave: document.getElementById('btn-start-wave'),
      buildHintBar: document.getElementById('build-hint-bar'),
      pieceDock: document.getElementById('piece-dock'),

      // Tower Inspector
      towerInspector: document.getElementById('tower-inspector'),
      inspSprite: document.getElementById('insp-sprite'),
      inspName: document.getElementById('insp-name'),
      inspTier: document.getElementById('insp-tier'),
      inspPattern: document.getElementById('insp-pattern'),
      inspDmg: document.getElementById('insp-dmg'),
      inspRate: document.getElementById('insp-rate'),
      inspKills: document.getElementById('insp-kills'),
      inspAura: document.getElementById('insp-aura'),
      inspUpgradeDesc: document.getElementById('insp-upgrade-desc'),
      btnCloseInspector: document.getElementById('btn-close-inspector'),
      btnUpgradeTower: document.getElementById('btn-upgrade-tower'),
      btnTargetMode: document.getElementById('btn-target-mode'),
      btnSellTower: document.getElementById('btn-sell-tower'),

      // Briefing Modal
      modalBriefing: document.getElementById('modal-briefing'),
      briefKicker: document.getElementById('brief-kicker'),
      briefTitle: document.getElementById('brief-title'),
      briefPieceImg: document.getElementById('brief-piece-img'),
      briefUnlockBadge: document.getElementById('brief-unlock-badge'),
      briefPieceName: document.getElementById('brief-piece-name'),
      briefPiecePattern: document.getElementById('brief-piece-pattern'),
      briefDesc: document.getElementById('brief-desc'),
      btnBriefStart: document.getElementById('btn-brief-start'),

      // Result Modal
      modalResult: document.getElementById('modal-result'),
      resultKicker: document.getElementById('result-kicker'),
      resultTitle: document.getElementById('result-title'),
      resultStars: document.getElementById('result-stars'),
      resultSummary: document.getElementById('result-summary'),
      resultNextUnlock: document.getElementById('result-next-unlock'),
      resultNextImg: document.getElementById('result-next-img'),
      resultNextName: document.getElementById('result-next-name'),
      resultNextPattern: document.getElementById('result-next-pattern'),
      btnResultMenu: document.getElementById('btn-result-menu'),
      btnResultRetry: document.getElementById('btn-result-retry'),
      btnResultNext: document.getElementById('btn-result-next'),

      // Codex Modal
      modalCodex: document.getElementById('modal-codex'),
      codexBody: document.getElementById('codex-body'),
      btnCloseCodex: document.getElementById('btn-close-codex'),
    };
  }

  async _init() {
    this.el.toggleSandbox.checked = this.sandboxAll;
    this._syncMuteIcon();
    this._renderCampaign();

    await preloadAssets();

    this.engine = new GameEngine(this.el.canvas, {
      onHudUpdate: (state) => this._renderHud(state),
      onBanner: (msg) => this._showBanner(msg),
      onGameEnd: (result) => this._handleGameEnd(result),
    });

    const stage = document.querySelector('.board-stage');
    if (stage && typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        if (this.el.screenGame.classList.contains('active')) {
          this.engine.resize();
        }
      });
      ro.observe(stage);
    }

    window.addEventListener('resize', () => {
      if (this.el.screenGame.classList.contains('active')) {
        this.engine.resize();
      }
    });
  }

  _bindGlobalEvents() {
    this.el.toggleSandbox.addEventListener('change', (e) => {
      this.sandboxAll = e.target.checked;
      localStorage.setItem('crownward_sandbox', this.sandboxAll ? '1' : '0');
      this._renderCampaign();
    });

    this.el.btnOpenCodex.addEventListener('click', () => this._openCodex());
    this.el.btnGameCodex.addEventListener('click', () => this._openCodex());
    this.el.btnCloseCodex.addEventListener('click', () => {
      this.el.modalCodex.classList.add('hidden');
    });
    this.el.modalCodex.addEventListener('click', (e) => {
      if (e.target === this.el.modalCodex) this.el.modalCodex.classList.add('hidden');
    });

    this.el.btnBackMenu.addEventListener('click', () => this._returnToCampaign());
    this.el.btnStartWave.addEventListener('click', () => this.engine?.startNextWave());
    this.el.btnSpeed.addEventListener('click', () => {
      sound.unlock();
      this.engine?.toggleSpeed();
    });
    this.el.btnPause.addEventListener('click', () => {
      sound.unlock();
      this.engine?.togglePause();
    });
    this.el.btnMute.addEventListener('click', () => {
      sound.unlock();
      sound.toggleMute();
      this._syncMuteIcon();
    });

    // Touch Confirm Placement
    this.el.btnCancelPreview.addEventListener('click', () => this.engine?.clearSelection());
    this.el.btnConfirmPlace.addEventListener('click', () => this.engine?.confirmPreviewPlacement());

    // Inspector Buttons
    this.el.btnCloseInspector.addEventListener('click', () => this.engine?.clearSelection());
    this.el.btnUpgradeTower.addEventListener('click', () => this.engine?.upgradeSelectedTower());
    this.el.btnTargetMode.addEventListener('click', () => this.engine?.cycleSelectedTargetMode());
    this.el.btnSellTower.addEventListener('click', () => this.engine?.sellSelectedTower());

    // Modals
    this.el.btnBriefStart.addEventListener('click', () => {
      sound.unlock();
      this.el.modalBriefing.classList.add('hidden');
    });

    this.el.btnResultMenu.addEventListener('click', () => {
      this.el.modalResult.classList.add('hidden');
      this._returnToCampaign();
    });

    this.el.btnResultRetry.addEventListener('click', () => {
      this.el.modalResult.classList.add('hidden');
      if (this.currentLevel) this._startLevel(this.currentLevel.id, false);
    });

    this.el.btnResultNext.addEventListener('click', () => {
      this.el.modalResult.classList.add('hidden');
      if (this.currentLevel) {
        const nextLevel = LEVELS.find((l) => l.id === this.currentLevel.id + 1);
        if (nextLevel) this._startLevel(nextLevel.id, true);
        else this._returnToCampaign();
      }
    });

    // Android PWA Install Prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredInstallPrompt = e;
      this.el.btnInstallPwa.classList.remove('hidden');
    });

    this.el.btnInstallPwa.addEventListener('click', async () => {
      if (!this.deferredInstallPrompt) return;
      this.deferredInstallPrompt.prompt();
      await this.deferredInstallPrompt.userChoice;
      this.deferredInstallPrompt = null;
      this.el.btnInstallPwa.classList.add('hidden');
    });
  }

  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  _loadProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          highestUnlocked: Math.max(1, parsed.highestUnlocked || 1),
          stars: parsed.stars || {},
        };
      }
    } catch {
      // ignore storage errors
    }
    return { highestUnlocked: 1, stars: {} };
  }

  _saveProgress() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.progress));
    } catch {
      // ignore storage errors
    }
  }

  _syncMuteIcon() {
    this.el.btnMute.textContent = sound.muted ? '🔇' : '🔊';
    this.el.btnMute.classList.toggle('active-toggle', sound.muted);
  }

  // ==================== CAMPAIGN SCREEN ====================

  _renderCampaign() {
    const grid = this.el.levelGrid;
    grid.innerHTML = '';

    for (const lvl of LEVELS) {
      const unlocked = this.sandboxAll || lvl.id <= this.progress.highestUnlocked;
      const earnedStars = this.progress.stars[lvl.id] || 0;
      const piece = PIECE_REGISTRY[lvl.unlocksPiece];
      const isMythic = piece?.category === 'mythic';

      const card = document.createElement('button');
      card.type = 'button';
      card.className = `level-card ${unlocked ? '' : 'locked'} ${isMythic ? 'mythic-level' : ''}`;
      card.disabled = !unlocked;

      const starsHtml = [1, 2, 3]
        .map((n) => `<span class="${n <= earnedStars ? '' : 'star-empty'}">★</span>`)
        .join('');

      card.innerHTML = `
        <div class="level-card-top">
          <div>
            <span class="level-card-num">${isMythic ? `LEVEL ${lvl.id} • NON-CHESS RELIC` : `LEVEL ${lvl.id}`}</span>
            <h3 class="level-card-title">${lvl.name}</h3>
          </div>
          <div class="level-stars" aria-label="${earnedStars} of 3 stars">${starsHtml}</div>
        </div>
        <div class="level-unlock-row">
          <img class="level-unlock-sprite" src="${getSpriteUrl(piece.sprite)}" alt="${piece.name}" />
          <div class="level-unlock-meta">
            <span class="level-unlock-label">${lvl.id === 1 ? 'Starting Piece' : 'Unlocks Piece'}</span>
            <span class="level-unlock-name">${piece.name}</span>
            <span class="level-unlock-pattern">${piece.patternLabel}</span>
          </div>
        </div>
        <div class="level-card-footer">
          <span>${lvl.waves.length} Waves • ${lvl.startingGold}g</span>
          <strong>${unlocked ? 'Play →' : '🔒 Locked'}</strong>
        </div>
      `;

      if (unlocked) {
        card.addEventListener('click', () => {
          sound.unlock();
          sound.playSelect();
          this._startLevel(lvl.id, true);
        });
      }
      grid.appendChild(card);
    }
  }

  _startLevel(levelId, showBriefing = true) {
    const lvl = LEVELS.find((l) => l.id === levelId);
    if (!lvl) return;
    this.currentLevel = lvl;

    this.el.screenHome.classList.remove('active');
    this.el.screenGame.classList.add('active');
    this.el.hudLevelNum.textContent = `LEVEL ${lvl.id}`;
    this.el.hudLevelName.textContent = lvl.name;

    this.engine.loadLevel(lvl);
    requestAnimationFrame(() => this.engine.resize());

    if (showBriefing) {
      const piece = PIECE_REGISTRY[lvl.unlocksPiece];
      this.el.briefKicker.textContent = `LEVEL ${lvl.id} • ${lvl.subtitle.toUpperCase()}`;
      this.el.briefTitle.textContent = lvl.name;
      this.el.briefPieceImg.src = getSpriteUrl(piece.sprite);
      this.el.briefPieceImg.alt = piece.name;
      this.el.briefUnlockBadge.textContent =
        piece.category === 'mythic'
          ? 'NON-CHESS RELIC UNLOCKED'
          : lvl.id === 1
          ? 'STARTING CHESS PIECE'
          : 'NEW CHESS PIECE UNLOCKED';
      this.el.briefPieceName.textContent = `${piece.name} — ${piece.title}`;
      this.el.briefPiecePattern.textContent = piece.patternLabel;
      this.el.briefDesc.textContent = lvl.description;
      this.el.modalBriefing.classList.remove('hidden');
    }
  }

  _returnToCampaign() {
    this.engine?.stop();
    this.el.modalBriefing.classList.add('hidden');
    this.el.modalResult.classList.add('hidden');
    this.el.screenGame.classList.remove('active');
    this.el.screenHome.classList.add('active');
    this._renderCampaign();
  }

  // ==================== REACTIVE GAMEPLAY HUD ====================

  _renderHud(state) {
    if (!this.currentLevel) return;

    this.el.hudGold.textContent = state.gold;
    this.el.hudLives.textContent = state.lives;
    this.el.hudWave.textContent = `${Math.max(0, state.waveIndex + 1)}/${state.totalWaves}`;

    this.el.btnSpeed.textContent = `${state.speedMult}x`;
    this.el.btnSpeed.classList.toggle('active-toggle', state.speedMult > 1);
    this.el.btnPause.textContent = state.gameState === 'paused' ? '▶' : '❚❚';
    this.el.btnPause.classList.toggle('active-toggle', state.gameState === 'paused');

    // Wave Launch Button & Next Wave Enemy Preview
    const nextWaveNum = state.waveIndex + 2;
    const hasMoreWaves = state.nextWaveDef !== null;

    if (!hasMoreWaves) {
      this.el.btnStartWave.disabled = true;
      this.el.btnStartWave.textContent = state.waveActive ? 'Final Wave!' : 'Cleared!';
      this.el.waveIntelTitle.textContent = 'Final Wave in Progress';
      this.el.waveEnemiesPreview.innerHTML = '';
    } else {
      const canCallEarly = !state.waveActive || this.engine.spawnQueue.length === 0;
      this.el.btnStartWave.disabled = !canCallEarly;
      this.el.btnStartWave.textContent = state.waveActive
        ? `Early Wave ${nextWaveNum} (+g)`
        : `Send Wave ${nextWaveNum}`;
      this.el.waveIntelTitle.textContent = `Incoming Wave ${nextWaveNum}`;

      // Summarize enemy counts for next wave
      const counts = {};
      for (const g of state.nextWaveDef.groups) {
        counts[g.type] = (counts[g.type] || 0) + g.count;
      }
      this.el.waveEnemiesPreview.innerHTML = Object.entries(counts)
        .map(([typeId, count]) => {
          const e = ENEMY_TYPES[typeId];
          return `<span class="wave-enemy-pill" title="${e.name}: ${e.trait}">
            <img src="${getSpriteUrl(e.sprite)}" alt="${e.name}" />
            <span>×${count}</span>
          </span>`;
        })
        .join('');
    }

    // Touch preview confirm overlay
    if (state.previewTile && state.selectedBuildPieceId) {
      const def = PIECE_REGISTRY[state.selectedBuildPieceId];
      const canAfford = state.gold >= def.cost;
      this.el.touchConfirmLabel.textContent = `${def.name} (${def.cost}g)`;
      this.el.btnConfirmPlace.disabled = !canAfford;
      this.el.touchConfirmBar.classList.remove('hidden');
    } else {
      this.el.touchConfirmBar.classList.add('hidden');
    }

    // Build Hint Strip
    if (state.selectedBuildPieceId) {
      const def = PIECE_REGISTRY[state.selectedBuildPieceId];
      this.el.buildHintBar.innerHTML = `<strong>${def.name}:</strong> ${def.patternLabel}. ${def.tacticalTip}`;
    } else {
      this.el.buildHintBar.innerHTML = 'Select a defender below to inspect its chess attack pattern and place it on any open marble square.';
    }

    // Piece Build Dock
    this._renderPieceDock(state);

    // Selected Placed Tower Inspector
    this._renderInspector(state);
  }

  _renderPieceDock(state) {
    const unlockedIds = new Set(getUnlockedPiecesForLevel(this.currentLevel.id));
    const dock = this.el.pieceDock;
    dock.innerHTML = '';

    for (const id of PIECE_ORDER) {
      const def = PIECE_REGISTRY[id];
      const unlocked = unlockedIds.has(id);
      const countPlaced = this.engine.getPieceCount(id);
      const atLimit = def.limit && countPlaced >= def.limit;
      const canAfford = state.gold >= def.cost && !atLimit;
      const selected = state.selectedBuildPieceId === id;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = [
        'piece-card',
        def.category === 'mythic' ? 'mythic' : '',
        unlocked ? '' : 'locked',
        selected ? 'selected' : '',
        unlocked && !canAfford ? 'unaffordable' : '',
      ]
        .filter(Boolean)
        .join(' ');
      btn.disabled = !unlocked;
      btn.title = unlocked
        ? `${def.name} (${def.cost}g) — ${def.patternLabel}`
        : `Unlocks at Level ${def.unlockLevel}`;

      btn.innerHTML = `
        ${def.category === 'mythic' ? '<span class="piece-card-tag">RELIC</span>' : ''}
        <img class="piece-card-sprite" src="${getSpriteUrl(def.sprite)}" alt="${def.name}" />
        <span class="piece-card-name">${def.name}</span>
        <span class="piece-card-cost">${
          !unlocked ? `Lv.${def.unlockLevel}` : atLimit ? 'MAX' : `${def.cost}g`
        }</span>
      `;

      if (unlocked) {
        btn.addEventListener('click', () => this.engine.selectBuildPiece(id));
      }
      dock.appendChild(btn);
    }
  }

  _renderInspector(state) {
    const tower = state.selectedTower;
    if (!tower) {
      this.el.towerInspector.classList.add('hidden');
      this.el.tacticalDock.classList.remove('inspecting');
      return;
    }

    this.el.towerInspector.classList.remove('hidden');
    this.el.tacticalDock.classList.add('inspecting');

    const stats = getPieceStats(tower.pieceId, tower.tier);
    const nextUpg = getUpgradeInfo(tower.pieceId, tower.tier);
    const effDmg = Math.round(stats.damage * tower.buffDamageMult);
    const effRate = (stats.fireRate * tower.buffRateMult).toFixed(2);
    const refund = Math.round(tower.invested * 0.75);

    this.el.inspSprite.src = getSpriteUrl(stats.sprite);
    this.el.inspSprite.alt = stats.displayName;
    this.el.inspName.textContent = stats.displayName;
    this.el.inspTier.textContent = `Tier ${tower.tier}/3`;
    this.el.inspPattern.textContent = stats.patternLabel;
    this.el.inspDmg.textContent = tower.buffedByKing ? `${effDmg} ↑` : `${effDmg}`;
    this.el.inspRate.textContent = `${effRate}/s`;
    this.el.inspKills.textContent = `${tower.kills}`;
    this.el.inspAura.textContent = stats.auraBuff
      ? `+${Math.round((stats.auraBuff.damageMult - 1) * 100)}%`
      : tower.buffedByKing
      ? 'Royal'
      : '—';

    if (nextUpg) {
      this.el.inspUpgradeDesc.textContent = `Promote → ${nextUpg.name}: ${nextUpg.desc}`;
      this.el.btnUpgradeTower.disabled = state.gold < nextUpg.cost;
      this.el.btnUpgradeTower.textContent = `Promote (${nextUpg.cost}g)`;
    } else {
      this.el.inspUpgradeDesc.textContent = 'Maximum Promotion reached — Royal Masterpiece!';
      this.el.btnUpgradeTower.disabled = true;
      this.el.btnUpgradeTower.textContent = 'Max Tier';
    }

    const modeLabels = { first: 'First', strongest: 'Strong', closest: 'Close', last: 'Last' };
    this.el.btnTargetMode.textContent = `Aim: ${modeLabels[tower.targetMode] || 'First'}`;
    this.el.btnSellTower.textContent = `Sell +${refund}g`;
  }

  _showBanner(msg) {
    this.el.battleBanner.textContent = msg;
    this.el.battleBanner.classList.remove('hidden');
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      this.el.battleBanner.classList.add('hidden');
    }, 2400);
  }

  // ==================== VICTORY / DEFEAT ====================

  _handleGameEnd(result) {
    const modal = this.el.modalResult;
    modal.classList.remove('hidden');

    if (result.victory) {
      const prevStars = this.progress.stars[result.level.id] || 0;
      this.progress.stars[result.level.id] = Math.max(prevStars, result.stars);
      if (result.level.id + 1 <= LEVELS.length) {
        this.progress.highestUnlocked = Math.max(
          this.progress.highestUnlocked,
          result.level.id + 1
        );
      }
      this._saveProgress();

      this.el.resultKicker.textContent = `LEVEL ${result.level.id} CONQUERED`;
      this.el.resultTitle.textContent = 'Victory!';
      this.el.resultStars.textContent = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
      this.el.resultSummary.textContent = `The Obsidian Army has been repelled with ${result.livesLeft} Citadel lives intact. Final Score: ${result.score.toLocaleString()}.`;

      const nextLevel = LEVELS.find((l) => l.id === result.level.id + 1);
      if (nextLevel) {
        const nextPiece = PIECE_REGISTRY[nextLevel.unlocksPiece];
        this.el.resultNextUnlock.classList.remove('hidden');
        this.el.resultNextImg.src = getSpriteUrl(nextPiece.sprite);
        this.el.resultNextName.textContent = `${nextPiece.name} — ${nextPiece.title}`;
        this.el.resultNextPattern.textContent = nextPiece.patternLabel;
        this.el.btnResultNext.classList.remove('hidden');
      } else {
        this.el.resultNextUnlock.classList.add('hidden');
        this.el.btnResultNext.classList.add('hidden');
      }
    } else {
      this.el.resultKicker.textContent = 'THE CITADEL HAS FALLEN';
      this.el.resultTitle.textContent = 'Checkmate';
      this.el.resultStars.textContent = '☆☆☆';
      this.el.resultSummary.textContent =
        'The dark legion breached your sanctuary. Adjust your chess sightlines, promote key pieces, and hold the line!';
      this.el.resultNextUnlock.classList.add('hidden');
      this.el.btnResultNext.classList.add('hidden');
    }
  }

  // ==================== PIECE CODEX ====================

  _openCodex() {
    sound.unlock();
    sound.playSelect();

    const chessIds = PIECE_ORDER.filter((id) => PIECE_REGISTRY[id].category === 'chess');
    const mythicIds = PIECE_ORDER.filter((id) => PIECE_REGISTRY[id].category === 'mythic');

    const renderGroup = (ids) =>
      ids
        .map((id) => {
          const p = PIECE_REGISTRY[id];
          const isMythic = p.category === 'mythic';
          return `
            <div class="codex-item ${isMythic ? 'mythic' : ''}">
              <img src="${getSpriteUrl(p.sprite)}" alt="${p.name}" />
              <div class="codex-item-info">
                <h4>
                  ${p.name}
                  <span class="codex-badge ${isMythic ? 'mythic' : ''}">Lv.${p.unlockLevel} • ${p.cost}g</span>
                </h4>
                <p class="codex-item-pattern">${p.patternLabel}</p>
                <p class="codex-item-tip">${p.tacticalTip}</p>
              </div>
            </div>
          `;
        })
        .join('');

    const blueprintsHtml = FUTURE_BLUEPRINTS.map(
      (bp) => `
      <div class="blueprint-card">
        <h4>${bp.name} <span class="codex-badge mythic">WORKSHOP BLUEPRINT</span></h4>
        <p><strong>${bp.role}:</strong> ${bp.desc}</p>
      </div>
    `
    ).join('');

    this.el.codexBody.innerHTML = `
      <div>
        <h3 class="codex-section-title">${PIECE_CATEGORIES.chess.label}</h3>
        <div class="codex-grid">${renderGroup(chessIds)}</div>
      </div>
      <div>
        <h3 class="codex-section-title">${PIECE_CATEGORIES.mythic.label}</h3>
        <div class="codex-grid">${renderGroup(mythicIds)}${blueprintsHtml}</div>
      </div>
    `;

    this.el.modalCodex.classList.remove('hidden');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new CrownwardApp();
});

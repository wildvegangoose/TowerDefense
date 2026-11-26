/**
 * TowerDeChess — Main App Controller, Campaign Progression & Reactive HUD.
 */

import { preloadAssets, getSpriteUrl } from './assets.js';
import { sound } from './audio.js';
import { LEVELS, CHAPTERS, getChapterForLevel, expandWaypoints } from './data/levels.js';
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
import {
  loadProgressSync,
  hydrateProgressFromBackup,
  recordLevelVictory,
  clearProgress,
  getStarsForLevel,
  getTotalStars,
  exportSaveCode,
  importSaveCode,
} from './storage.js';

class TowerDeChessApp {
  constructor() {
    this.progress = loadProgressSync();
    this.sandboxAll = localStorage.getItem('towerdechess_sandbox') === '1';
    this.difficulty = localStorage.getItem('towerdechess_difficulty') || 'standard';
    this.selectedMapLevelId = Math.min(LEVELS.length, this.progress.highestUnlocked || 1);
    this.justUnlockedLevelId = null;
    this._mapNodeY = new Map();
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
      campaignTotalStars: document.getElementById('campaign-total-stars'),
      campaignRevealedPill: document.getElementById('campaign-revealed-pill'),
      mapRealmIndicator: document.getElementById('map-realm-indicator'),
      btnJumpFrontier: document.getElementById('btn-jump-frontier'),
      campaignMapViewport: document.getElementById('campaign-map-viewport'),
      campaignMapCanvas: document.getElementById('campaign-map-canvas'),
      stageKicker: document.getElementById('stage-kicker'),
      stageTitle: document.getElementById('stage-title'),
      stageSubtitle: document.getElementById('stage-subtitle'),
      stageStars: document.getElementById('stage-stars'),
      stageMinimap: document.getElementById('stage-minimap'),
      stageWaves: document.getElementById('stage-waves'),
      stageGold: document.getElementById('stage-gold'),
      stageLives: document.getElementById('stage-lives'),
      stageBestScore: document.getElementById('stage-best-score'),
      stagePieceBox: document.getElementById('stage-piece-box'),
      stagePieceImg: document.getElementById('stage-piece-img'),
      stagePieceBadge: document.getElementById('stage-piece-badge'),
      stagePieceName: document.getElementById('stage-piece-name'),
      stagePiecePattern: document.getElementById('stage-piece-pattern'),
      stageDesc: document.getElementById('stage-desc'),
      btnStageDeploy: document.getElementById('btn-stage-deploy'),
      toggleSandbox: document.getElementById('toggle-sandbox'),
      btnDiffStandard: document.getElementById('btn-diff-standard'),
      btnDiffGrandmaster: document.getElementById('btn-diff-grandmaster'),
      btnOpenCodex: document.getElementById('btn-open-codex'),
      btnOpenSave: document.getElementById('btn-open-save'),
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
      btnMusic: document.getElementById('btn-music'),
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

      // Save Data Modal
      modalSave: document.getElementById('modal-save'),
      btnCloseSave: document.getElementById('btn-close-save'),
      saveTacticalStars: document.getElementById('save-tactical-stars'),
      saveGmStars: document.getElementById('save-gm-stars'),
      saveUnlockedLv: document.getElementById('save-unlocked-lv'),
      inputSaveCode: document.getElementById('input-save-code'),
      saveStatusMsg: document.getElementById('save-status-msg'),
      btnCopySave: document.getElementById('btn-copy-save'),
      btnImportSave: document.getElementById('btn-import-save'),

      // Settings Modal
      btnOpenSettings: document.getElementById('btn-open-settings'),
      modalSettings: document.getElementById('modal-settings'),
      btnCloseSettings: document.getElementById('btn-close-settings'),
      toggleSettingMusic: document.getElementById('toggle-setting-music'),
      toggleSettingSfx: document.getElementById('toggle-setting-sfx'),
      settingsProgressSummary: document.getElementById('settings-progress-summary'),
      btnSettingsOpenSave: document.getElementById('btn-settings-open-save'),
      btnClearSaveInit: document.getElementById('btn-clear-save-init'),
      clearSaveConfirm: document.getElementById('clear-save-confirm'),
      btnClearSaveCancel: document.getElementById('btn-clear-save-cancel'),
      btnClearSaveConfirm: document.getElementById('btn-clear-save-confirm'),
      settingsStatusMsg: document.getElementById('settings-status-msg'),
    };
  }

  async _init() {
    this.el.toggleSandbox.checked = this.sandboxAll;
    this._syncDifficultyUi();
    this._syncMuteIcon();
    this._renderCampaign(true);

    // Reconcile with durable IndexedDB backup in case localStorage was cleared
    hydrateProgressFromBackup(this.progress).then(({ progress, changed }) => {
      if (changed) {
        this.progress = progress;
        this.selectedMapLevelId = Math.min(LEVELS.length, this.progress.highestUnlocked || 1);
        this._renderCampaign(true);
      }
    });

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
      localStorage.setItem('towerdechess_sandbox', this.sandboxAll ? '1' : '0');
      const maxAllowed = this.sandboxAll ? LEVELS.length : Math.min(LEVELS.length, this.progress.highestUnlocked);
      if (this.selectedMapLevelId > maxAllowed) {
        this.selectedMapLevelId = maxAllowed;
      }
      this._renderCampaign(false);
    });

    this.el.btnJumpFrontier?.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      const frontierId = Math.min(LEVELS.length, this.progress.highestUnlocked || 1);
      this._selectMapLevel(frontierId);
      this._scrollToMapNode(frontierId, true);
    });

    this.el.btnStageDeploy?.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      this._startLevel(this.selectedMapLevelId, false);
    });

    const setDiff = (mode) => {
      this.difficulty = mode;
      localStorage.setItem('towerdechess_difficulty', mode);
      this._syncDifficultyUi();
      this._renderCampaign(false);
    };
    this.el.btnDiffStandard.addEventListener('click', () => setDiff('standard'));
    this.el.btnDiffGrandmaster.addEventListener('click', () => setDiff('grandmaster'));

    this.el.btnOpenCodex.addEventListener('click', () => this._openCodex());
    this.el.btnGameCodex.addEventListener('click', () => this._openCodex());
    this.el.btnCloseCodex.addEventListener('click', () => {
      this.el.modalCodex.classList.add('hidden');
    });
    this.el.modalCodex.addEventListener('click', (e) => {
      if (e.target === this.el.modalCodex) this.el.modalCodex.classList.add('hidden');
    });

    this.el.btnOpenSave.addEventListener('click', () => this._openSaveModal());
    this.el.btnCloseSave.addEventListener('click', () => {
      this.el.modalSave.classList.add('hidden');
    });
    this.el.modalSave.addEventListener('click', (e) => {
      if (e.target === this.el.modalSave) this.el.modalSave.classList.add('hidden');
    });
    this.el.btnCopySave.addEventListener('click', async () => {
      const code = exportSaveCode(this.progress);
      this.el.inputSaveCode.value = code;
      try {
        await navigator.clipboard.writeText(code);
        this._setSaveStatus('Save Code copied to clipboard!', false);
      } catch {
        this.el.inputSaveCode.select();
        this._setSaveStatus('Save Code selected — tap Copy to save it.', false);
      }
    });
    this.el.btnImportSave.addEventListener('click', () => {
      try {
        this.progress = importSaveCode(this.el.inputSaveCode.value, this.progress);
        this._renderCampaign();
        this._refreshSaveModalStats();
        this._setSaveStatus('Progress restored & merged!', false);
      } catch (err) {
        this._setSaveStatus(err.message || 'Invalid Save Code.', true);
      }
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
    this.el.btnMusic.addEventListener('click', () => {
      sound.unlock();
      sound.toggleMusic();
      this._syncMuteIcon();
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
    // Settings Modal
    this.el.btnOpenSettings?.addEventListener('click', () => this._openSettings());
    this.el.btnCloseSettings?.addEventListener('click', () => {
      this.el.modalSettings.classList.add('hidden');
    });
    this.el.modalSettings?.addEventListener('click', (e) => {
      if (e.target === this.el.modalSettings) this.el.modalSettings.classList.add('hidden');
    });
    this.el.toggleSettingMusic?.addEventListener('change', (e) => {
      sound.unlock();
      sound.setMusicMuted(!e.target.checked);
      this._syncMuteIcon();
      if (!sound.sfxMuted) sound.playSelect();
    });
    this.el.toggleSettingSfx?.addEventListener('change', (e) => {
      sound.unlock();
      sound.setSfxMuted(!e.target.checked);
      this._syncMuteIcon();
      if (!sound.sfxMuted) sound.playSelect();
    });
    this.el.btnSettingsOpenSave?.addEventListener('click', () => {
      this.el.modalSettings.classList.add('hidden');
      this._openSaveModal();
    });
    this.el.btnClearSaveInit?.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      this.el.clearSaveConfirm.classList.remove('hidden');
      this.el.settingsStatusMsg.textContent = '';
    });
    this.el.btnClearSaveCancel?.addEventListener('click', () => {
      this.el.clearSaveConfirm.classList.add('hidden');
    });
    this.el.btnClearSaveConfirm?.addEventListener('click', () => this._handleClearSave());

    // Android hardware Back button handling when packaged with Capacitor
    const capApp = window.Capacitor?.Plugins?.App;
    if (capApp?.addListener) {
      capApp.addListener('backButton', () => {
        if (!this.el.modalSettings?.classList.contains('hidden')) {
          this.el.modalSettings.classList.add('hidden');
          return;
        }
        if (!this.el.modalSave?.classList.contains('hidden')) {
          this.el.modalSave.classList.add('hidden');
          return;
        }
        if (!this.el.modalCodex.classList.contains('hidden')) {
          this.el.modalCodex.classList.add('hidden');
          return;
        }
        if (!this.el.modalBriefing.classList.contains('hidden')) {
          this.el.modalBriefing.classList.add('hidden');
          return;
        }
        if (!this.el.modalResult.classList.contains('hidden')) {
          this.el.modalResult.classList.add('hidden');
          this._returnToCampaign();
          return;
        }
        if (this.el.screenGame.classList.contains('active')) {
          this._returnToCampaign();
          return;
        }
        capApp.exitApp();
      });
    }
  }

  _registerServiceWorker() {
    // Native Capacitor builds bundle assets locally — only register SW on web/PWA origins
    if (window.Capacitor?.isNativePlatform?.()) return;
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  _openSettings() {
    sound.unlock();
    sound.playSelect();
    this._refreshSettingsUi();
    this.el.clearSaveConfirm.classList.add('hidden');
    this.el.settingsStatusMsg.textContent = '';
    this.el.modalSettings.classList.remove('hidden');
  }

  _refreshSettingsUi() {
    if (this.el.toggleSettingMusic) {
      this.el.toggleSettingMusic.checked = !sound.musicMuted;
    }
    if (this.el.toggleSettingSfx) {
      this.el.toggleSettingSfx.checked = !sound.sfxMuted;
    }
    if (this.el.settingsProgressSummary) {
      const tacStars = getTotalStars(this.progress, 'standard');
      const gmStars = getTotalStars(this.progress, 'grandmaster');
      const ch = getChapterForLevel(this.progress.highestUnlocked);
      this.el.settingsProgressSummary.textContent = `Unlocked up to Level ${this.progress.highestUnlocked} / ${LEVELS.length} (Chapter ${ch.roman}) • ★ ${tacStars} Tactical / ★ ${gmStars} Grandmaster`;
    }
  }

  async _handleClearSave() {
    this.progress = await clearProgress();
    this.sandboxAll = false;
    localStorage.removeItem('towerdechess_sandbox');
    if (this.el.toggleSandbox) this.el.toggleSandbox.checked = false;

    this.selectedMapLevelId = 1;
    this.justUnlockedLevelId = null;

    this.el.clearSaveConfirm.classList.add('hidden');
    this._refreshSettingsUi();
    this._refreshSaveModalStats();
    this._renderCampaign(true);
    this.el.settingsStatusMsg.textContent = 'Save cleared! Campaign reset to Chapter I, Level 1.';
  }

  _openSaveModal() {
    sound.unlock();
    sound.playSelect();
    this._refreshSaveModalStats();
    this.el.inputSaveCode.value = exportSaveCode(this.progress);
    this._setSaveStatus('', false);
    this.el.modalSave.classList.remove('hidden');
  }

  _refreshSaveModalStats() {
    const maxStars = LEVELS.length * 3;
    const tacStars = getTotalStars(this.progress, 'standard');
    const gmStars = getTotalStars(this.progress, 'grandmaster');
    this.el.saveTacticalStars.textContent = `★ ${tacStars} / ${maxStars}`;
    this.el.saveGmStars.textContent = `★ ${gmStars} / ${maxStars}`;
    this.el.saveUnlockedLv.textContent = `Lv. ${this.progress.highestUnlocked} / ${LEVELS.length}`;
  }

  _setSaveStatus(msg, isError) {
    this.el.saveStatusMsg.textContent = msg;
    this.el.saveStatusMsg.classList.toggle('error', Boolean(isError));
  }

  _syncDifficultyUi() {
    const isGm = this.difficulty === 'grandmaster';
    this.el.btnDiffStandard.classList.toggle('active', !isGm);
    this.el.btnDiffGrandmaster.classList.toggle('active', isGm);
    this.el.btnDiffGrandmaster.classList.toggle('grandmaster', true);
  }

  _syncMuteIcon() {
    this.el.btnMute.textContent = sound.sfxMuted ? '🔇' : '🔊';
    this.el.btnMute.classList.toggle('active-toggle', sound.sfxMuted);
    if (this.el.btnMusic) {
      this.el.btnMusic.textContent = sound.musicMuted ? '🚫' : '🎵';
      this.el.btnMusic.classList.toggle('active-toggle', sound.musicMuted);
    }
    if (this.el.toggleSettingMusic) {
      this.el.toggleSettingMusic.checked = !sound.musicMuted;
    }
    if (this.el.toggleSettingSfx) {
      this.el.toggleSettingSfx.checked = !sound.sfxMuted;
    }
  }

  // ==================== CAMPAIGN MAP SCREEN ====================

  _renderCampaign(scrollToFrontier = false) {
    const canvas = this.el.campaignMapCanvas;
    if (!canvas) return;
    canvas.innerHTML = '';
    this._mapNodeY.clear();

    const maxStars = LEVELS.length * 3;
    const modeStars = getTotalStars(this.progress, this.difficulty);
    const frontierId = Math.min(LEVELS.length, this.progress.highestUnlocked || 1);
    const revealedMax = this.sandboxAll ? LEVELS.length : frontierId;

    if (this.el.campaignTotalStars) {
      const modeTag = this.difficulty === 'grandmaster' ? 'GM ' : '';
      this.el.campaignTotalStars.textContent = `${modeTag}★ ${modeStars} / ${maxStars}`;
    }
    if (this.el.campaignRevealedPill) {
      this.el.campaignRevealedPill.textContent =
        revealedMax >= LEVELS.length
          ? `All ${LEVELS.length} Revealed`
          : `${revealedMax} / ${LEVELS.length} Revealed`;
    }

    if (this.selectedMapLevelId > revealedMax) {
      this.selectedMapLevelId = revealedMax;
    }

    const revealedLevels = LEVELS.filter((l) => l.id <= revealedMax);
    const nextMysteryLevel = revealedMax < LEVELS.length ? LEVELS.find((l) => l.id === revealedMax + 1) : null;

    // 1. Compute vertical layout coordinates for chapter banners and map nodes
    const nodesLayout = [];
    const chapterBands = [];
    const chapterBanners = [];
    let cursorY = 44;
    let currentChapterId = null;
    let activeBand = null;

    for (const lvl of revealedLevels) {
      if (lvl.chapter !== currentChapterId) {
        if (activeBand) {
          activeBand.bottom = cursorY - 12;
          chapterBands.push(activeBand);
        }
        const ch = getChapterForLevel(lvl.id);
        currentChapterId = lvl.chapter;
        const bandTop = chapterBands.length === 0 ? 0 : cursorY - 12;
        if (chapterBands.length > 0) cursorY += 34;

        const chEarned = ch.levelIds.reduce(
          (sum, id) => sum + getStarsForLevel(this.progress, id, this.difficulty),
          0
        );
        chapterBanners.push({
          chapter: ch,
          y: cursorY,
          earnedStars: chEarned,
          maxStars: ch.levelIds.length * 3,
        });
        activeBand = { theme: ch.theme, top: bandTop, bottom: cursorY + 130 };
        cursorY += 98;
      }

      nodesLayout.push({ lvl, x: lvl.mapX, y: cursorY, shrouded: false });
      this._mapNodeY.set(lvl.id, cursorY);
      cursorY += 124;
    }

    if (nextMysteryLevel) {
      // Shrouded teaser node just ahead on the mist-covered road
      nodesLayout.push({
        lvl: nextMysteryLevel,
        x: nextMysteryLevel.mapX,
        y: cursorY,
        shrouded: true,
      });
      cursorY += 178;
    } else {
      cursorY += 36;
    }

    const totalH = Math.max(380, cursorY);
    if (activeBand) {
      activeBand.bottom = totalH;
      chapterBands.push(activeBand);
    }

    canvas.style.height = `${totalH}px`;

    // 2. Render per-chapter biome terrain backdrops
    for (const band of chapterBands) {
      const el = document.createElement('div');
      el.className = `map-biome-band theme-${band.theme}`;
      el.style.top = `${band.top}px`;
      el.style.height = `${Math.max(0, band.bottom - band.top)}px`;
      canvas.appendChild(el);
    }

    // 3. Render winding SVG cartography trail (exact % x-coords via 0..1000 viewBox)
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'map-svg-layer');
    svg.setAttribute('viewBox', `0 0 1000 ${totalH}`);
    svg.setAttribute('preserveAspectRatio', 'none');

    // Subtle cartographic topographic contour curves along the canvas
    for (let cy = 90; cy < totalH; cy += 180) {
      const contour = document.createElementNS(svgNS, 'path');
      contour.setAttribute(
        'd',
        `M -40 ${cy} Q 260 ${cy - 44}, 520 ${cy + 14} T 1040 ${cy - 22}`
      );
      contour.setAttribute('fill', 'none');
      contour.setAttribute('stroke', 'rgba(232, 206, 158, 0.06)');
      contour.setAttribute('stroke-width', '1.5');
      contour.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(contour);
    }

    // Winding Cubic Bezier Road between consecutive nodes
    for (let i = 0; i < nodesLayout.length - 1; i++) {
      const a = nodesLayout[i];
      const b = nodesLayout[i + 1];
      const x1 = a.x * 10;
      const y1 = a.y;
      const x2 = b.x * 10;
      const y2 = b.y;
      const midY = (y1 + y2) * 0.5;
      const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;

      const isFogSegment = b.shrouded;
      const isFrontierSegment = !b.shrouded && b.lvl.id === frontierId;

      // Dark stone roadbed shadow
      const roadShadow = document.createElementNS(svgNS, 'path');
      roadShadow.setAttribute('d', d);
      roadShadow.setAttribute('fill', 'none');
      roadShadow.setAttribute('stroke', isFogSegment ? 'rgba(12, 8, 5, 0.35)' : 'rgba(12, 8, 5, 0.7)');
      roadShadow.setAttribute('stroke-width', isFogSegment ? '7' : '11');
      roadShadow.setAttribute('stroke-linecap', 'round');
      roadShadow.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(roadShadow);

      // Main gilded/misty trail
      const roadMain = document.createElementNS(svgNS, 'path');
      roadMain.setAttribute('d', d);
      roadMain.setAttribute('fill', 'none');
      roadMain.setAttribute('stroke-linecap', 'round');
      roadMain.setAttribute('vector-effect', 'non-scaling-stroke');

      if (isFogSegment) {
        roadMain.setAttribute('stroke', 'rgba(201, 183, 156, 0.34)');
        roadMain.setAttribute('stroke-width', '3.5');
        roadMain.setAttribute('stroke-dasharray', '6 9');
      } else if (isFrontierSegment) {
        roadMain.setAttribute('stroke', '#f5ca6d');
        roadMain.setAttribute('stroke-width', '4.5');
        roadMain.setAttribute('stroke-dasharray', '9 7');
        roadMain.setAttribute('class', 'trail-frontier-dash');
      } else {
        roadMain.setAttribute('stroke', '#c99439');
        roadMain.setAttribute('stroke-width', '4.5');
      }
      svg.appendChild(roadMain);
    }
    canvas.appendChild(svg);

    // Subtle non-distorted Compass Rose watermark in upper-right corner
    const compass = document.createElement('div');
    compass.style.cssText =
      'position:absolute;top:14px;right:14px;width:64px;height:64px;opacity:0.16;pointer-events:none;z-index:2;';
    compass.innerHTML = `
      <svg viewBox="0 0 80 80" width="64" height="64" fill="none">
        <circle cx="40" cy="40" r="34" stroke="#e8c67c" stroke-width="1.2" stroke-dasharray="3 4"/>
        <circle cx="40" cy="40" r="24" stroke="#e8c67c" stroke-width="1"/>
        <polygon points="40,6 45,35 40,40 35,35" fill="#f5ca6d"/>
        <polygon points="40,74 45,45 40,40 35,45" fill="#c9b79c"/>
        <polygon points="6,40 35,35 40,40 35,45" fill="#c9b79c"/>
        <polygon points="74,40 45,35 40,40 45,45" fill="#c9b79c"/>
        <circle cx="40" cy="40" r="4" fill="#f5ca6d"/>
      </svg>`;
    canvas.appendChild(compass);

    // 4. Render Chapter Banners
    for (const cb of chapterBanners) {
      const banner = document.createElement('div');
      banner.className = `map-chapter-banner theme-${cb.chapter.theme}`;
      banner.style.top = `${cb.y}px`;
      banner.innerHTML = `
        <span class="map-chapter-roman">Chapter ${cb.chapter.roman}</span>
        <span class="map-chapter-title">${cb.chapter.name}</span>
        <span class="map-chapter-stars">★ ${cb.earnedStars}/${cb.maxStars}</span>
      `;
      canvas.appendChild(banner);
    }

    // 5. Render Revealed & Shrouded Nodes
    for (const item of nodesLayout) {
      const { lvl, x, y, shrouded } = item;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.left = `${x}%`;
      btn.style.top = `${y}px`;
      btn.dataset.levelId = String(lvl.id);

      if (shrouded) {
        btn.className = 'map-node shrouded';
        btn.title = `Conquer Level ${lvl.id - 1} to reveal this territory`;
        btn.innerHTML = `
          <div class="map-node-medallion">
            <span class="map-node-mystery-glyph">?</span>
          </div>
          <span class="map-node-label">Uncharted Territory</span>
        `;
        btn.addEventListener('click', () => {
          sound.unlock();
          if (this.el.mapRealmIndicator) {
            this.el.mapRealmIndicator.textContent = `Conquer Level ${lvl.id - 1} to reveal Level ${lvl.id}!`;
          }
        });
        canvas.appendChild(btn);
        continue;
      }

      const earnedStars = getStarsForLevel(this.progress, lvl.id, this.difficulty);
      const pieceId = lvl.unlocksPiece || lvl.featuredPiece || 'pawn';
      const piece = PIECE_REGISTRY[pieceId];
      const isFrontier = lvl.id === frontierId;
      const isSelected = lvl.id === this.selectedMapLevelId;
      const isJustRevealed = lvl.id === this.justUnlockedLevelId;
      const isMythic = piece?.category === 'mythic' && Boolean(lvl.unlocksPiece);

      btn.className = [
        'map-node',
        earnedStars > 0 ? 'conquered' : '',
        isFrontier ? 'frontier' : '',
        isSelected ? 'selected' : '',
        isJustRevealed ? 'just-revealed' : '',
        lvl.isChapterBoss ? 'chapter-boss' : '',
        isMythic ? 'mythic-node' : '',
      ]
        .filter(Boolean)
        .join(' ');

      const starsHtml = [1, 2, 3]
        .map((n) => `<span class="${n <= earnedStars ? '' : 'star-empty'}">★</span>`)
        .join('');

      btn.innerHTML = `
        ${isFrontier ? '<span class="map-node-beacon">Next Battle</span>' : ''}
        <div class="map-node-medallion">
          <img class="map-node-sprite" src="${getSpriteUrl(piece.sprite)}" alt="${piece.name}" />
          <span class="map-node-num">${lvl.isChapterBoss ? `👑${lvl.id}` : lvl.id}</span>
        </div>
        <div class="map-node-stars" aria-label="${earnedStars} of 3 stars">${starsHtml}</div>
        <span class="map-node-label">${lvl.name}</span>
      `;

      btn.addEventListener('click', () => {
        sound.unlock();
        sound.playSelect();
        if (this.selectedMapLevelId === lvl.id) {
          // Clicking an already-selected node scrolls the deploy panel cleanly or launches on desktop double-tap
          this._renderStagePanel(lvl.id);
        } else {
          this._selectMapLevel(lvl.id);
        }
      });

      btn.addEventListener('dblclick', () => {
        sound.unlock();
        this._startLevel(lvl.id, false);
      });

      canvas.appendChild(btn);
    }

    // 6. Render Fog-of-War Bank hiding remaining undiscovered territories
    if (revealedMax < LEVELS.length) {
      const hiddenCount = LEVELS.length - revealedMax;
      const fog = document.createElement('div');
      fog.className = 'map-fog-bank';
      fog.innerHTML = `
        <span class="map-fog-pill">☁ Uncharted Lands • ${hiddenCount} ${hiddenCount === 1 ? 'Territory' : 'Territories'} Hidden in Fog</span>
        <p class="map-fog-sub">Conquer Level ${frontierId} to part the mist and reveal the road ahead.</p>
      `;
      canvas.appendChild(fog);
    }

    // Clear one-shot reveal celebration flag after triggering animation
    if (this.justUnlockedLevelId) {
      setTimeout(() => {
        this.justUnlockedLevelId = null;
      }, 1000);
    }

    this._renderStagePanel(this.selectedMapLevelId);

    if (scrollToFrontier) {
      requestAnimationFrame(() => this._scrollToMapNode(this.selectedMapLevelId, false));
    }
  }

  _selectMapLevel(levelId) {
    this.selectedMapLevelId = levelId;
    const nodes = this.el.campaignMapCanvas?.querySelectorAll('.map-node[data-level-id]') || [];
    for (const node of nodes) {
      node.classList.toggle('selected', Number(node.dataset.levelId) === levelId);
    }
    this._renderStagePanel(levelId);
  }

  _scrollToMapNode(levelId, smooth = true) {
    const vp = this.el.campaignMapViewport;
    const y = this._mapNodeY.get(levelId);
    if (!vp || y === undefined) return;
    const targetTop = Math.max(0, y - vp.clientHeight * 0.5);
    vp.scrollTo({ top: targetTop, behavior: smooth ? 'smooth' : 'auto' });
  }

  _renderStagePanel(levelId) {
    const lvl = LEVELS.find((l) => l.id === levelId) || LEVELS[0];
    if (!lvl) return;

    const ch = getChapterForLevel(lvl.id);
    const goldMult = this.difficulty === 'grandmaster' ? 0.9 : 1.0;
    const displayGold = Math.round(lvl.startingGold * goldMult);
    const earnedStars = getStarsForLevel(this.progress, lvl.id, this.difficulty);
    const bestScore = this.progress.bestScores?.[String(lvl.id)] || 0;
    const pieceId = lvl.unlocksPiece || lvl.featuredPiece || 'pawn';
    const piece = PIECE_REGISTRY[pieceId];
    const isMythic = piece?.category === 'mythic';

    if (this.el.mapRealmIndicator) {
      this.el.mapRealmIndicator.textContent = `Chapter ${ch.roman} • ${ch.name}`;
    }
    this.el.stageKicker.textContent = `CHAPTER ${ch.roman} • LEVEL ${lvl.id}${lvl.isChapterBoss ? ' • FINALE' : ''}`;
    this.el.stageTitle.textContent = lvl.name;
    this.el.stageSubtitle.textContent = `${ch.name} — ${lvl.subtitle}`;
    this.el.stageStars.innerHTML = [1, 2, 3]
      .map((n) => `<span class="${n <= earnedStars ? '' : 'star-empty'}">★</span>`)
      .join('');
    this.el.stageStars.setAttribute('aria-label', `${earnedStars} of 3 stars`);

    this.el.stageWaves.textContent = `${lvl.waves.length}`;
    this.el.stageGold.textContent = `${displayGold}g`;
    this.el.stageLives.textContent = `${lvl.startingLives} ♥`;
    this.el.stageBestScore.textContent = bestScore > 0 ? bestScore.toLocaleString() : '—';

    this.el.stagePieceBox.classList.toggle('mythic', isMythic);
    this.el.stagePieceImg.src = getSpriteUrl(piece.sprite);
    this.el.stagePieceImg.alt = piece.name;
    this.el.stagePieceBadge.textContent = lvl.unlocksPiece
      ? isMythic
        ? 'UNLOCKS NON-CHESS RELIC'
        : lvl.id === 1
        ? 'STARTING CHESS PIECE'
        : 'UNLOCKS CHESS PIECE'
      : 'RECOMMENDED COMMANDER';
    this.el.stagePieceName.textContent = `${piece.name} — ${piece.title}`;
    this.el.stagePiecePattern.textContent = piece.patternLabel;
    this.el.stageDesc.textContent = lvl.description;

    const diffLabel = this.difficulty === 'grandmaster' ? ' (Grandmaster)' : '';
    this.el.btnStageDeploy.textContent = `Deploy to Level ${lvl.id}${diffLabel} →`;
    this.el.stageMinimap.innerHTML = this._renderMiniBoardSvg(lvl);
  }

  _renderMiniBoardSvg(lvl) {
    const tiles = expandWaypoints(lvl.waypoints);
    const pathSet = new Set(tiles.map(([c, r]) => `${c},${r}`));
    const start = tiles[0];
    const end = tiles[tiles.length - 1];
    const rects = [];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const isPath = pathSet.has(`${c},${r}`);
        const isLight = (c + r) % 2 === 0;
        let fill = isLight ? '#d8c4a2' : '#9c7d56';
        if (isPath) fill = '#2b2320';
        rects.push(`<rect x="${c * 10}" y="${r * 10}" width="10" height="10" fill="${fill}"/>`);
      }
    }

    const pts = tiles.map(([c, r]) => `${c * 10 + 5},${r * 10 + 5}`).join(' ');
    return `
      <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        ${rects.join('')}
        <polyline points="${pts}" fill="none" stroke="rgba(245, 202, 109, 0.55)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="${start[0] * 10 + 5}" cy="${start[1] * 10 + 5}" r="3.2" fill="#63d48e" stroke="#18120d" stroke-width="1"/>
        <circle cx="${end[0] * 10 + 5}" cy="${end[1] * 10 + 5}" r="3.5" fill="#f5ca6d" stroke="#8a281e" stroke-width="1.4"/>
      </svg>
    `;
  }

  _startLevel(levelId, showBriefing = true) {
    const lvl = LEVELS.find((l) => l.id === levelId);
    if (!lvl) return;
    this.currentLevel = lvl;
    this.selectedMapLevelId = lvl.id;

    this.el.screenHome.classList.remove('active');
    this.el.screenGame.classList.add('active');
    const diffTag = this.difficulty === 'grandmaster' ? ' • GRANDMASTER' : '';
    this.el.hudLevelNum.textContent = `LEVEL ${lvl.id}${diffTag}`;
    this.el.hudLevelName.textContent = lvl.name;

    this.engine.loadLevel(lvl, this.difficulty);
    requestAnimationFrame(() => this.engine.resize());

    if (showBriefing) {
      const ch = getChapterForLevel(lvl.id);
      const pieceId = lvl.unlocksPiece || lvl.featuredPiece || 'pawn';
      const piece = PIECE_REGISTRY[pieceId];
      this.el.briefKicker.textContent = `CHAPTER ${ch.roman} • LEVEL ${lvl.id} • ${lvl.subtitle.toUpperCase()}`;
      this.el.briefTitle.textContent = lvl.name;
      this.el.briefPieceImg.src = getSpriteUrl(piece.sprite);
      this.el.briefPieceImg.alt = piece.name;
      this.el.briefUnlockBadge.textContent = lvl.unlocksPiece
        ? piece.category === 'mythic'
          ? 'NON-CHESS RELIC UNLOCKED'
          : lvl.id === 1
          ? 'STARTING CHESS PIECE'
          : 'NEW CHESS PIECE UNLOCKED'
        : lvl.isChapterBoss
        ? 'CHAPTER FINALE • KEY COMMANDER'
        : 'RECOMMENDED COMMANDER';
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
    this._renderCampaign(Boolean(this.justUnlockedLevelId));
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
      const prevUnlocked = this.progress.highestUnlocked;
      this.progress = recordLevelVictory(this.progress, {
        levelId: result.level.id,
        stars: result.stars,
        score: result.score,
        difficulty: this.difficulty,
        totalLevels: LEVELS.length,
      });

      if (this.progress.highestUnlocked > prevUnlocked) {
        this.justUnlockedLevelId = this.progress.highestUnlocked;
        this.selectedMapLevelId = this.progress.highestUnlocked;
      }

      this.el.resultKicker.textContent = `LEVEL ${result.level.id} CONQUERED`;
      this.el.resultTitle.textContent = 'Victory!';
      this.el.resultStars.textContent = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
      this.el.resultSummary.textContent = `The Obsidian Army has been repelled with ${result.livesLeft} Citadel lives intact. Final Score: ${result.score.toLocaleString()}.`;

      const nextLevel = LEVELS.find((l) => l.id === result.level.id + 1);
      if (nextLevel) {
        const nextPieceId = nextLevel.unlocksPiece || nextLevel.featuredPiece || 'king';
        const nextPiece = PIECE_REGISTRY[nextPieceId];
        const nextCh = getChapterForLevel(nextLevel.id);
        const tagEl = this.el.resultNextUnlock.querySelector('.unlock-tag');
        this.el.resultNextUnlock.classList.remove('hidden');
        this.el.resultNextImg.src = getSpriteUrl(nextPiece.sprite);
        if (nextLevel.unlocksPiece) {
          if (tagEl) tagEl.textContent = 'NEXT LEVEL UNLOCKS';
          this.el.resultNextName.textContent = `${nextPiece.name} — ${nextPiece.title}`;
          this.el.resultNextPattern.textContent = nextPiece.patternLabel;
        } else {
          if (tagEl) tagEl.textContent = `REVEALED ON MAP • CHAPTER ${nextCh.roman}`;
          this.el.resultNextName.textContent = `Level ${nextLevel.id}: ${nextLevel.name}`;
          this.el.resultNextPattern.textContent = `${nextCh.name} — ${nextLevel.subtitle}`;
        }
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
  new TowerDeChessApp();
});

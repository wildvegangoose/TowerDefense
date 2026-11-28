/**
 * TowerDeChess — Main App Controller, Campaign Progression & Reactive HUD.
 */

import {
  preloadAssets,
  getSpriteUrl,
  getSceneUrl,
  getMapBgUrl,
  getMapNodeUrl,
  getLevelBgUrl,
  getUiIconUrl,
} from './assets.js';
import { sound } from './audio.js';
import { CutscenePlayer } from './cutscene.js';
import { LEVELS, CHAPTERS, getChapterForLevel, generateQuickMatchLevel } from './data/levels.js';
import {
  PIECE_REGISTRY,
  PIECE_ORDER,
  PIECE_CATEGORIES,
  FUTURE_BLUEPRINTS,
  getPieceStats,
  getUpgradeInfo,
  getUnlockedPiecesForLevel,
} from './data/pieces.js';
import { ENEMY_TYPES, DIFFICULTY_PRESETS, normalizeDifficulty } from './data/enemies.js';
import {
  CUTSCENES,
  CUTSCENE_ORDER,
  getCutsceneIdForLevel,
  VILLAINS,
  ENEMY_LORE,
  LEVEL_DISPATCHES,
} from './data/story.js';
import { GameEngine } from './engine/game.js';
import { WeatherRenderer } from './engine/weather.js';
import {
  loadProgressSync,
  hydrateProgressFromBackup,
  recordLevelVictory,
  markCutsceneSeen,
  clearProgress,
  getStarsForLevel,
  getTotalStars,
  exportSaveCode,
  importSaveCode,
} from './storage.js';

class TowerDeChessApp {
  _readPref(key, fallback = null) {
    try {
      const val = localStorage.getItem(key);
      return val === null ? fallback : val;
    } catch {
      return fallback;
    }
  }

  _writePref(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore storage restrictions (e.g. sandboxed preview or private mode)
    }
  }

  _removePref(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore storage restrictions
    }
  }

  constructor() {
    this.progress = loadProgressSync();
    this._removePref('towerdechess_sandbox');
    this.difficulty = normalizeDifficulty(this._readPref('towerdechess_difficulty'));
    this.weatherEnabled = this._readPref('towerdechess_weather_enabled') !== 'false';
    this.cutscenesEnabled = this._readPref('towerdechess_cutscenes_enabled') !== 'false';
    this.selectedMapLevelId = Math.min(LEVELS.length, this.progress.highestUnlocked || 1);
    this.justUnlockedLevelId = null;
    this.pendingProgression = null;
    this._progressionTimers = [];
    this._mapNodeY = new Map();
    this._lastQuickMatchBgId = null;
    this.currentLevel = null;
    this.engine = null;
    this.bannerTimer = null;
    this.deferredInstallPrompt = null;
    this.activeCodexTab = 'defenders';
    this.cutscene = new CutscenePlayer();

    this._cacheDom();
    this._bindGlobalEvents();
    this._registerServiceWorker();
    this._init();
  }

  _cacheDom() {
    this.el = {
      screenHome: document.getElementById('screen-home'),
      screenCampaign: document.getElementById('screen-campaign'),
      screenGame: document.getElementById('screen-game'),
      gameBgArt: document.getElementById('game-bg-art'),
      btnModeCampaign: document.getElementById('btn-mode-campaign'),
      btnModeQuickmatch: document.getElementById('btn-mode-quickmatch'),
      homeCampaignMeta: document.getElementById('home-campaign-meta'),
      btnCampaignBack: document.getElementById('btn-campaign-back'),
      campaignTotalStars: document.getElementById('campaign-total-stars'),
      campaignRevealedPill: document.getElementById('campaign-revealed-pill'),
      mapRealmIndicator: document.getElementById('map-realm-indicator'),
      btnPlayChapterStory: document.getElementById('btn-play-chapter-story'),
      campaignMapViewport: document.getElementById('campaign-map-viewport'),
      campaignMapCanvas: document.getElementById('campaign-map-canvas'),
      diffButtons: Array.from(document.querySelectorAll('.diff-btn[data-diff]')),
      btnOpenCodex: document.getElementById('btn-open-codex'),
      btnInstallPwa: document.getElementById('btn-install-pwa'),

      // Game HUD
      canvas: document.getElementById('game-canvas'),
      gameWeatherCanvas: document.getElementById('game-weather-canvas'),
      btnBackMenu: document.getElementById('btn-back-menu'),
      hudLevelNum: document.getElementById('hud-level-num'),
      hudLevelName: document.getElementById('hud-level-name'),
      hudGold: document.getElementById('hud-gold'),
      hudLives: document.getElementById('hud-lives'),
      hudWave: document.getElementById('hud-wave'),
      btnSpeed: document.getElementById('btn-speed'),
      speedBadge: document.getElementById('speed-badge'),
      btnPause: document.getElementById('btn-pause'),
      btnPauseIcon: document.getElementById('btn-pause-icon'),
      btnGameSettings: document.getElementById('btn-game-settings'),
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
      btnCloseBriefing: document.getElementById('btn-close-briefing'),
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
      codexTabs: document.getElementById('codex-tabs'),
      codexBody: document.getElementById('codex-body'),
      btnCloseCodex: document.getElementById('btn-close-codex'),

      // Save Data Modal
      modalSave: document.getElementById('modal-save'),
      btnCloseSave: document.getElementById('btn-close-save'),
      saveNoviceStars: document.getElementById('save-novice-stars'),
      saveMasterStars: document.getElementById('save-master-stars'),
      saveGmStars: document.getElementById('save-gm-stars'),

      // Quick Match Modal
      modalQuickmatch: document.getElementById('modal-quickmatch'),
      btnCloseQuickmatch: document.getElementById('btn-close-quickmatch'),
      btnQmCancel: document.getElementById('btn-qm-cancel'),
      btnQmStart: document.getElementById('btn-qm-start'),
      qmDiffDesc: document.getElementById('qm-diff-desc'),
      saveUnlockedLv: document.getElementById('save-unlocked-lv'),
      inputSaveCode: document.getElementById('input-save-code'),
      saveStatusMsg: document.getElementById('save-status-msg'),
      btnCopySave: document.getElementById('btn-copy-save'),
      btnImportSave: document.getElementById('btn-import-save'),

      // Settings Modal
      btnOpenSettings: document.getElementById('btn-open-settings'),
      modalSettings: document.getElementById('modal-settings'),
      btnCloseSettings: document.getElementById('btn-close-settings'),
      settingsBattleSection: document.getElementById('settings-battle-section'),
      btnSettingsResume: document.getElementById('btn-settings-resume'),
      btnSettingsCodex: document.getElementById('btn-settings-codex'),
      btnSettingsRestart: document.getElementById('btn-settings-restart'),
      btnSettingsMap: document.getElementById('btn-settings-map'),
      toggleSettingMusic: document.getElementById('toggle-setting-music'),
      toggleSettingSfx: document.getElementById('toggle-setting-sfx'),
      toggleSettingWeather: document.getElementById('toggle-setting-weather'),
      toggleSettingCutscenes: document.getElementById('toggle-setting-cutscenes'),
      settingsTrackName: document.getElementById('settings-track-name'),
      settingsProgressSummary: document.getElementById('settings-progress-summary'),
      btnSettingsOpenSave: document.getElementById('btn-settings-open-save'),
      btnClearSaveInit: document.getElementById('btn-clear-save-init'),
      clearSaveConfirm: document.getElementById('clear-save-confirm'),
      btnClearSaveCancel: document.getElementById('btn-clear-save-cancel'),
      btnClearSaveConfirm: document.getElementById('btn-clear-save-confirm'),
      settingsStatusMsg: document.getElementById('settings-status-msg'),

      // WildGoose Studio Opening Intro
      studioIntro: document.getElementById('studio-intro'),
      studioLogoImg: document.getElementById('studio-logo-img'),
      studioLogoSheenMask: document.getElementById('studio-logo-sheen-mask'),
    };
  }

  _playStudioIntro() {
    const intro = this.el.studioIntro;
    if (!intro) return Promise.resolve();

    // Sync exact alpha mask (works for both relative URL & standalone inline data URI)
    const logoSrc = this.el.studioLogoImg?.getAttribute('src') || this.el.studioLogoImg?.src || '';
    if (this.el.studioLogoSheenMask && logoSrc) {
      const maskVal = `url("${logoSrc}")`;
      this.el.studioLogoSheenMask.style.webkitMaskImage = maskVal;
      this.el.studioLogoSheenMask.style.maskImage = maskVal;
    }

    return new Promise((resolve) => {
      let dismissed = false;
      let fadeTimer = null;
      let hideTimer = null;
      const startedAt = performance.now();

      const finish = () => {
        if (dismissed) return;
        dismissed = true;
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
        intro.removeEventListener('click', onSkip);
        window.removeEventListener('keydown', onKey);
        intro.classList.add('fading-out');
        hideTimer = setTimeout(() => {
          intro.classList.add('hidden');
          resolve();
        }, 550);
      };

      const onSkip = () => {
        if (performance.now() - startedAt < 450) return;
        finish();
      };
      const onKey = (e) => {
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
          onSkip();
        }
      };

      intro.addEventListener('click', onSkip);
      window.addEventListener('keydown', onKey);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          intro.classList.add('is-playing');
        });
      });

      // Exact 3.0s studio intro: 2.45s showcase + 0.55s smooth fade-out
      fadeTimer = setTimeout(finish, 2450);
    });
  }

  async _init() {
    this._setupHistoryNavigation();
    this._studioIntroDone = this._playStudioIntro();
    this._syncDifficultyUi();
    this._syncMuteIcon();
    this._renderCampaign(true);

    // Reconcile with durable IndexedDB backup in case localStorage was cleared
    hydrateProgressFromBackup(this.progress).then(async ({ progress, changed }) => {
      if (changed) {
        this.progress = progress;
        this.selectedMapLevelId = Math.min(LEVELS.length, this.progress.highestUnlocked || 1);
        this._renderCampaign(true);
      }
      // Wait until the 3-second WildGoose studio intro completes before auto-playing Prologue
      await this._studioIntroDone;
      if (
        this.cutscenesEnabled &&
        !this.progress.seenCutscenes?.includes('prologue') &&
        this.el.screenHome.classList.contains('active') &&
        !this.cutscene.isOpen()
      ) {
        this._playCutscene('prologue');
      }
    });

    await preloadAssets();

    this.weather = new WeatherRenderer(this.el.gameWeatherCanvas);
    if (!this.weatherEnabled) {
      this.weather.stop();
    }
    if (this.el.toggleSettingWeather) {
      this.el.toggleSettingWeather.checked = this.weatherEnabled;
    }
    if (this.el.toggleSettingCutscenes) {
      this.el.toggleSettingCutscenes.checked = this.cutscenesEnabled;
    }

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
          if (this.weatherEnabled) this.weather?.resize();
        }
      });
      ro.observe(stage);
    }

    window.addEventListener('resize', () => {
      if (this.el.screenGame.classList.contains('active')) {
        this.engine.resize();
        if (this.weatherEnabled) this.weather?.resize();
      }
    });
  }

  _bindGlobalEvents() {
    this.el.btnPlayChapterStory?.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      const cutsceneId = getCutsceneIdForLevel(this.selectedMapLevelId || 1);
      this._playCutscene(cutsceneId);
    });

    const setDiff = (mode) => {
      const normalized = normalizeDifficulty(mode);
      this.difficulty = normalized;
      this._writePref('towerdechess_difficulty', normalized);
      sound.unlock();
      sound.playSelect();
      this._syncDifficultyUi();
      this._renderCampaign(false);
    };
    for (const btn of this.el.diffButtons || []) {
      btn.addEventListener('click', () => setDiff(btn.dataset.diff));
    }

    this.el.btnOpenCodex.addEventListener('click', () => this._openCodex());
    this.el.codexTabs?.addEventListener('click', (e) => {
      const btn = e.target.closest('.codex-tab[data-tab]');
      if (!btn) return;
      sound.unlock();
      sound.playSelect();
      this._renderCodexTab(btn.dataset.tab);
    });
    this.el.btnCloseCodex.addEventListener('click', () => this._closeCodex());
    this.el.modalCodex.addEventListener('click', (e) => {
      if (e.target === this.el.modalCodex) this._closeCodex();
    });

    this.el.btnCloseSave.addEventListener('click', () => this._closeSaveModal());
    this.el.modalSave.addEventListener('click', (e) => {
      if (e.target === this.el.modalSave) this._closeSaveModal();
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

    this.el.btnModeCampaign?.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      this._openCampaignScreen();
    });

    this.el.btnModeQuickmatch?.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      this._openQuickMatchModal();
    });

    this.el.btnCloseQuickmatch?.addEventListener('click', () => this._closeQuickMatchModal());
    this.el.btnQmCancel?.addEventListener('click', () => this._closeQuickMatchModal());
    this.el.modalQuickmatch?.addEventListener('click', (e) => {
      if (e.target === this.el.modalQuickmatch) this._closeQuickMatchModal();
    });
    this.el.btnQmStart?.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      this.el.modalQuickmatch?.classList.add('hidden');
      this._startQuickMatch();
    });

    this.el.btnCampaignBack?.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      this._returnToHome();
    });

    this.el.btnBackMenu.addEventListener('click', () => this._leaveBattle());
    this.el.btnStartWave.addEventListener('click', () => this.engine?.startNextWave());
    this.el.btnSpeed.addEventListener('click', () => {
      sound.unlock();
      this.engine?.toggleSpeed();
    });
    this.el.btnPause.addEventListener('click', () => {
      sound.unlock();
      this.engine?.togglePause();
    });
    this.el.btnGameSettings?.addEventListener('click', () => this._openSettings());

    // Touch Confirm Placement
    this.el.btnCancelPreview.addEventListener('click', () => this.engine?.clearSelection());
    this.el.btnConfirmPlace.addEventListener('click', () => this.engine?.confirmPreviewPlacement());

    // Inspector Buttons
    this.el.btnCloseInspector.addEventListener('click', () => this.engine?.clearSelection());
    this.el.btnUpgradeTower.addEventListener('click', () => this.engine?.upgradeSelectedTower());
    this.el.btnTargetMode.addEventListener('click', () => this.engine?.cycleSelectedTargetMode());
    this.el.btnSellTower.addEventListener('click', () => this.engine?.sellSelectedTower());

    // Level Details / Briefing Modal (click outside borders or X to close back to Campaign Map)
    this.el.btnCloseBriefing?.addEventListener('click', () => this._closeLevelBriefing());
    this.el.modalBriefing?.addEventListener('click', (e) => {
      if (e.target === this.el.modalBriefing) this._closeLevelBriefing();
    });
    this.el.btnBriefStart.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      const pending = this._pendingBriefLevel;
      this._pendingBriefLevel = null;
      this.el.modalBriefing.classList.add('hidden');
      if (pending) {
        this._startLevel(pending.id, false, true);
      } else {
        this._syncHistoryGuard();
      }
    });

    this.el.btnResultMenu.addEventListener('click', () => {
      this.el.modalResult.classList.add('hidden');
      this._leaveBattle();
    });

    this.el.btnResultRetry.addEventListener('click', () => {
      this.pendingProgression = null;
      this.el.modalResult.classList.add('hidden');
      if (this.currentLevel?.isQuickMatch) {
        this._launchLevelBoard(this.currentLevel);
      } else if (this.currentLevel) {
        this._startLevel(this.currentLevel.id, false, false);
      }
    });

    this.el.btnResultNext.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      this.el.modalResult.classList.add('hidden');
      if (this.currentLevel?.isQuickMatch) {
        this._startQuickMatch();
      } else {
        this._returnToCampaign();
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

    // Settings Modal (accessible from Main Menu, Campaign Map & inside Battle)
    this.el.btnOpenSettings?.addEventListener('click', () => this._openSettings());
    this.el.btnCloseSettings?.addEventListener('click', () => this._closeSettings());
    this.el.modalSettings?.addEventListener('click', (e) => {
      if (e.target === this.el.modalSettings) this._closeSettings();
    });
    this.el.btnSettingsResume?.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      this._closeSettings();
    });
    this.el.btnSettingsCodex?.addEventListener('click', () => {
      this.el.modalSettings.classList.add('hidden');
      this._openCodex();
    });
    this.el.btnSettingsRestart?.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      this._pausedBySettings = false;
      this.el.modalSettings.classList.add('hidden');
      if (this.currentLevel?.isQuickMatch) {
        this._launchLevelBoard(this.currentLevel);
      } else if (this.currentLevel) {
        this._startLevel(this.currentLevel.id, false, false);
      }
    });
    this.el.btnSettingsMap?.addEventListener('click', () => {
      sound.unlock();
      sound.playSelect();
      this._pausedBySettings = false;
      this.el.modalSettings.classList.add('hidden');
      this._leaveBattle();
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
    this.el.toggleSettingWeather?.addEventListener('change', (e) => {
      sound.unlock();
      this.weatherEnabled = Boolean(e.target.checked);
      this._writePref('towerdechess_weather_enabled', String(this.weatherEnabled));
      if (!this.weatherEnabled) {
        this.weather?.stop();
        this.el.gameWeatherCanvas?.classList.add('hidden');
      } else {
        this.el.gameWeatherCanvas?.classList.remove('hidden');
        if (this.el.screenGame.classList.contains('active') && this.currentLevel) {
          this.weather?.start(
            this.currentLevel.weather || 'sunrays',
            this.currentLevel.bgLevelId || this.currentLevel.id
          );
        }
      }
      if (!sound.sfxMuted) sound.playSelect();
    });
    this.el.toggleSettingCutscenes?.addEventListener('change', (e) => {
      sound.unlock();
      this.cutscenesEnabled = Boolean(e.target.checked);
      this._writePref('towerdechess_cutscenes_enabled', String(this.cutscenesEnabled));
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
        if (!this._handleBackNavigation()) {
          capApp.exitApp();
        }
      });
    }
  }

  // ==================== CONTEXT-AWARE BACK NAVIGATION (PWA + CAPACITOR) ====================

  _setupHistoryNavigation() {
    this._inPopstate = false;
    this._ignoringPopstate = false;
    this._historyGuardEnabled =
      typeof window !== 'undefined' &&
      Boolean(window.history?.pushState) &&
      /^https?:$/.test(location.protocol) &&
      !window.Capacitor?.isNativePlatform?.();

    if (!this._historyGuardEnabled) return;

    try {
      if (!history.state?.tdcRoot && !history.state?.tdcGuard) {
        history.replaceState({ tdcRoot: true }, '');
      }
    } catch {
      this._historyGuardEnabled = false;
      return;
    }

    window.addEventListener('popstate', () => {
      if (this._ignoringPopstate) {
        this._ignoringPopstate = false;
        return;
      }
      if (this._hasBackTarget()) {
        this._inPopstate = true;
        this._handleBackNavigation();
        this._inPopstate = false;
        // If another inner layer remains open (e.g., closed Settings while still in Battle),
        // re-arm the guard so the next Back press handles that layer instead of exiting!
        if (this._hasBackTarget()) {
          this._pushHistoryGuard();
        }
      }
    });
  }

  _hasBackTarget() {
    return (
      Boolean(this.cutscene?.isOpen()) ||
      !this.el.modalSettings?.classList.contains('hidden') ||
      !this.el.modalQuickmatch?.classList.contains('hidden') ||
      !this.el.modalSave?.classList.contains('hidden') ||
      !this.el.modalCodex?.classList.contains('hidden') ||
      !this.el.modalBriefing?.classList.contains('hidden') ||
      !this.el.modalResult?.classList.contains('hidden') ||
      Boolean(this.el.screenGame?.classList.contains('active')) ||
      Boolean(this.el.screenCampaign?.classList.contains('active'))
    );
  }

  _pushHistoryGuard() {
    if (!this._historyGuardEnabled) return;
    try {
      if (!history.state?.tdcGuard) {
        history.pushState({ tdcGuard: true }, '');
      }
    } catch {
      // Ignore restricted history environments
    }
  }

  _syncHistoryGuard() {
    if (!this._historyGuardEnabled || this._inPopstate) return;
    if (this._hasBackTarget()) {
      this._pushHistoryGuard();
    } else if (history.state?.tdcGuard) {
      // Returned to root Main Menu via UI controls — pop our guard so the next Back exits naturally
      this._ignoringPopstate = true;
      history.back();
    }
  }

  _handleBackNavigation() {
    if (this.el.studioIntro && !this.el.studioIntro.classList.contains('hidden')) {
      this.el.studioIntro.click();
      return true;
    }
    if (this.cutscene?.isOpen()) {
      this.cutscene.stop(true);
      return true;
    }
    if (!this.el.modalSettings?.classList.contains('hidden')) {
      this._closeSettings();
      return true;
    }
    if (!this.el.modalQuickmatch?.classList.contains('hidden')) {
      this._closeQuickMatchModal();
      return true;
    }
    if (!this.el.modalSave?.classList.contains('hidden')) {
      this._closeSaveModal();
      return true;
    }
    if (!this.el.modalCodex?.classList.contains('hidden')) {
      this._closeCodex();
      return true;
    }
    if (!this.el.modalBriefing?.classList.contains('hidden')) {
      this._closeLevelBriefing();
      return true;
    }
    if (!this.el.modalResult?.classList.contains('hidden')) {
      this.el.modalResult.classList.add('hidden');
      this._leaveBattle();
      return true;
    }
    if (this.el.screenGame?.classList.contains('active')) {
      this._leaveBattle();
      return true;
    }
    if (this.el.screenCampaign?.classList.contains('active')) {
      this._returnToHome();
      return true;
    }
    return false;
  }

  _openQuickMatchModal() {
    this._syncDifficultyUi();
    this.el.modalQuickmatch?.classList.remove('hidden');
    this._syncHistoryGuard();
  }

  _closeQuickMatchModal() {
    this.el.modalQuickmatch?.classList.add('hidden');
    this._syncHistoryGuard();
  }

  _closeCodex() {
    this.el.modalCodex.classList.add('hidden');
    if (this._pausedBySettings && this.el.screenGame.classList.contains('active')) {
      if (this.engine?.gameState === 'paused') this.engine.togglePause();
      this._pausedBySettings = false;
    }
    this._syncHistoryGuard();
  }

  _closeSaveModal() {
    this.el.modalSave.classList.add('hidden');
    this._syncHistoryGuard();
  }

  _playCutscene(cutsceneId, onComplete = null) {
    if (!CUTSCENES[cutsceneId]) {
      onComplete?.();
      return;
    }
    this.progress = markCutsceneSeen(this.progress, cutsceneId);
    this.cutscene.play(cutsceneId, () => {
      onComplete?.();
      this._syncHistoryGuard();
    });
    this._syncHistoryGuard();
  }

  _registerServiceWorker() {
    // Native Capacitor builds bundle assets locally — only register SW on web/PWA origins
    if (window.Capacitor?.isNativePlatform?.()) return;
    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => reg.update().catch(() => {}))
        .catch(() => {});
    }
  }

  _openSettings() {
    sound.unlock();
    sound.playSelect();
    const inGame = this.el.screenGame.classList.contains('active');
    if (this.el.settingsBattleSection) {
      this.el.settingsBattleSection.classList.toggle('hidden', !inGame);
    }
    if (this.el.btnSettingsMap) {
      const labelEl = this.el.btnSettingsMap.querySelector('span');
      if (labelEl) {
        labelEl.textContent = this.currentLevel?.isQuickMatch ? 'Main Menu' : 'Campaign Map';
      }
    }
    // Auto-pause active gameplay while Royal Settings is open
    this._pausedBySettings = false;
    if (inGame && this.engine?.gameState === 'playing') {
      this.engine.togglePause();
      this._pausedBySettings = true;
    }
    this._refreshSettingsUi();
    this.el.clearSaveConfirm.classList.add('hidden');
    this.el.settingsStatusMsg.textContent = '';
    this.el.modalSettings.classList.remove('hidden');
    this._syncHistoryGuard();
  }

  _closeSettings() {
    this.el.modalSettings.classList.add('hidden');
    if (this._pausedBySettings && this.el.screenGame.classList.contains('active')) {
      if (this.engine?.gameState === 'paused') {
        this.engine.togglePause();
      }
      this._pausedBySettings = false;
    }
    this._syncHistoryGuard();
  }

  _refreshSettingsUi() {
    if (this.el.toggleSettingMusic) {
      this.el.toggleSettingMusic.checked = !sound.musicMuted;
    }
    if (this.el.toggleSettingSfx) {
      this.el.toggleSettingSfx.checked = !sound.sfxMuted;
    }
    if (this.el.toggleSettingWeather) {
      this.el.toggleSettingWeather.checked = this.weatherEnabled;
    }
    if (this.el.toggleSettingCutscenes) {
      this.el.toggleSettingCutscenes.checked = this.cutscenesEnabled;
    }
    if (this.el.settingsTrackName) {
      const tr = sound.getCurrentTrack();
      this.el.settingsTrackName.textContent = `${tr.name} • ${tr.subtitle}`;
    }
    if (this.el.settingsProgressSummary) {
      const novStars = getTotalStars(this.progress, 'novice');
      const masStars = getTotalStars(this.progress, 'master');
      const gmStars = getTotalStars(this.progress, 'grandmaster');
      const ch = getChapterForLevel(this.progress.highestUnlocked);
      this.el.settingsProgressSummary.textContent = `Unlocked up to Level ${this.progress.highestUnlocked} / ${LEVELS.length} (Chapter ${ch.roman}) • ★ ${novStars} Novice / ★ ${masStars} Master / ★ ${gmStars} Grandmaster`;
    }
  }

  async _handleClearSave() {
    this.progress = await clearProgress();
    this._removePref('towerdechess_sandbox');

    this.selectedMapLevelId = 1;
    this.justUnlockedLevelId = null;
    this.pendingProgression = null;
    this._clearProgressionTimers();

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
    this._syncHistoryGuard();
  }

  _refreshSaveModalStats() {
    const maxStars = LEVELS.length * 3;
    const novStars = getTotalStars(this.progress, 'novice');
    const masStars = getTotalStars(this.progress, 'master');
    const gmStars = getTotalStars(this.progress, 'grandmaster');
    if (this.el.saveNoviceStars) this.el.saveNoviceStars.textContent = `★ ${novStars} / ${maxStars}`;
    if (this.el.saveMasterStars) this.el.saveMasterStars.textContent = `★ ${masStars} / ${maxStars}`;
    if (this.el.saveGmStars) this.el.saveGmStars.textContent = `★ ${gmStars} / ${maxStars}`;
    if (this.el.saveUnlockedLv) {
      this.el.saveUnlockedLv.textContent = `Lv. ${this.progress.highestUnlocked} / ${LEVELS.length}`;
    }
  }

  _setSaveStatus(msg, isError) {
    this.el.saveStatusMsg.textContent = msg;
    this.el.saveStatusMsg.classList.toggle('error', Boolean(isError));
  }

  _syncDifficultyUi() {
    const active = normalizeDifficulty(this.difficulty);
    this.difficulty = active;
    for (const btn of this.el.diffButtons || []) {
      const isSelected = btn.dataset.diff === active;
      btn.classList.toggle('active', isSelected);
      btn.setAttribute('aria-pressed', String(isSelected));
    }
    if (this.el.qmDiffDesc) {
      const preset = DIFFICULTY_PRESETS[active] || DIFFICULTY_PRESETS.novice;
      this.el.qmDiffDesc.textContent = preset.desc;
    }
  }

  _syncMuteIcon() {
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
    const revealedMax = frontierId;

    if (this.el.campaignTotalStars) {
      const modeTag =
        this.difficulty === 'grandmaster'
          ? 'GM '
          : this.difficulty === 'master'
            ? 'Master '
            : '';
      this.el.campaignTotalStars.textContent = `${modeTag}★ ${modeStars} / ${maxStars}`;
    }
    if (this.el.campaignRevealedPill) {
      this.el.campaignRevealedPill.textContent =
        revealedMax >= LEVELS.length
          ? `All ${LEVELS.length} Revealed`
          : `${revealedMax} / ${LEVELS.length} Revealed`;
    }
    if (this.el.homeCampaignMeta) {
      const frontierCh = getChapterForLevel(frontierId);
      this.el.homeCampaignMeta.textContent = `Chapter ${frontierCh.roman} • ${revealedMax}/${LEVELS.length} • ★ ${modeStars}/${maxStars}`;
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
        activeBand = { theme: ch.theme, top: bandTop, bottom: cursorY + 140 };
        cursorY += 108;
      }

      nodesLayout.push({ lvl, x: lvl.mapX, y: cursorY, shrouded: false });
      this._mapNodeY.set(lvl.id, cursorY);
      cursorY += 136;
    }

    if (nextMysteryLevel) {
      // Shrouded teaser node just ahead on the mist-covered road
      nodesLayout.push({
        lvl: nextMysteryLevel,
        x: nextMysteryLevel.mapX,
        y: cursorY,
        shrouded: true,
      });
      cursorY += 188;
    } else {
      cursorY += 108;
    }

    const totalH = Math.max(420, cursorY);
    if (activeBand) {
      activeBand.bottom = totalH;
      chapterBands.push(activeBand);
    }

    canvas.style.height = `${totalH}px`;

    // 2. Render per-chapter illustrated cartography backdrops at low opacity
    for (const band of chapterBands) {
      const el = document.createElement('div');
      el.className = `map-biome-band theme-${band.theme}`;
      el.style.top = `${band.top}px`;
      el.style.height = `${Math.max(0, band.bottom - band.top)}px`;
      const bgUrl = getMapBgUrl(band.theme);
      if (bgUrl) {
        const art = document.createElement('div');
        art.className = 'map-biome-art';
        art.style.backgroundImage = `url("${bgUrl}")`;
        el.appendChild(art);
      }
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
      roadShadow.setAttribute('data-road-shadow', `${a.lvl.id}-${b.lvl.id}`);
      roadShadow.setAttribute('fill', 'none');
      roadShadow.setAttribute('stroke', isFogSegment ? 'rgba(12, 8, 5, 0.35)' : 'rgba(12, 8, 5, 0.7)');
      roadShadow.setAttribute('stroke-width', isFogSegment ? '7' : '11');
      roadShadow.setAttribute('stroke-linecap', 'round');
      roadShadow.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.appendChild(roadShadow);

      // Main gilded/misty trail
      const roadMain = document.createElementNS(svgNS, 'path');
      roadMain.setAttribute('d', d);
      roadMain.setAttribute('data-from', String(a.lvl.id));
      roadMain.setAttribute('data-to', String(b.lvl.id));
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
        `chapter-${lvl.chapter}`,
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
          <img class="map-node-art" src="${getMapNodeUrl(lvl.id)}" alt="${lvl.name}" />
          <span class="map-node-num">${lvl.isChapterBoss ? `👑${lvl.id}` : lvl.id}</span>
        </div>
        <div class="map-node-stars" aria-label="${earnedStars} of 3 stars">${starsHtml}</div>
        <span class="map-node-label">${lvl.name}</span>
      `;

      btn.addEventListener('click', () => {
        sound.unlock();
        sound.playSelect();
        this._selectMapLevel(lvl.id);
        this._openLevelBriefing(lvl.id);
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

    // Clear one-shot reveal celebration flag (handled by progression animation if present)
    if (this.justUnlockedLevelId && !this.pendingProgression) {
      setTimeout(() => {
        this.justUnlockedLevelId = null;
      }, 1000);
    }

    this._syncRealmIndicator(this.selectedMapLevelId);

    if (this.pendingProgression) {
      const prog = this.pendingProgression;
      this.pendingProgression = null;
      requestAnimationFrame(() => this._playMapProgression(prog));
    } else if (scrollToFrontier) {
      requestAnimationFrame(() => this._scrollToMapNode(this.selectedMapLevelId, false));
    }
  }

  _clearProgressionTimers() {
    for (const id of this._progressionTimers) clearTimeout(id);
    this._progressionTimers = [];
  }

  _playMapProgression({ fromId, toId, newlyUnlocked }) {
    this._clearProgressionTimers();
    const canvas = this.el.campaignMapCanvas;
    const vp = this.el.campaignMapViewport;
    if (!canvas) return;

    const fromLvl = LEVELS.find((l) => l.id === fromId);
    const toLvl = LEVELS.find((l) => l.id === toId);
    const yFrom = this._mapNodeY.get(fromId);
    const yTo = this._mapNodeY.get(toId);
    if (!fromLvl || !toLvl || yFrom === undefined || yTo === undefined) return;

    if (vp) {
      const midY = (yFrom + yTo) * 0.5;
      vp.scrollTo({ top: Math.max(0, midY - vp.clientHeight * 0.5), behavior: 'smooth' });
    }

    const baseRoad = canvas.querySelector(`path[data-from="${fromId}"][data-to="${toId}"]`);
    const targetNode = canvas.querySelector(`.map-node[data-level-id="${toId}"]`);
    const canvasW = Math.max(1, canvas.clientWidth);
    const canvasH = Math.max(1, canvas.clientHeight);

    // Hold newly unlocked target node concealed until the marching line & footsteps arrive
    if (newlyUnlocked && targetNode) {
      targetNode.classList.remove('just-revealed');
      targetNode.classList.add('progression-pending');
    }

    // Dim static segment while the glowing animated trail draws itself forward
    const prevOpacity = baseRoad ? baseRoad.style.opacity : '';
    if (baseRoad) baseRoad.style.opacity = '0.18';

    // Build a 1:1 CSS-pixel SVG overlay so stroke-dashoffset & tangent angles are 100% distortion-free
    const svgNS = 'http://www.w3.org/2000/svg';
    const overlaySvg = document.createElementNS(svgNS, 'svg');
    overlaySvg.setAttribute('class', 'map-svg-layer');
    overlaySvg.style.zIndex = '3';
    overlaySvg.setAttribute('viewBox', `0 0 ${canvasW} ${canvasH}`);

    const x1Px = (fromLvl.mapX / 100) * canvasW;
    const x2Px = (toLvl.mapX / 100) * canvasW;
    const midY = (yFrom + yTo) * 0.5;
    const dPx = `M ${x1Px.toFixed(1)} ${yFrom} C ${x1Px.toFixed(1)} ${midY}, ${x2Px.toFixed(1)} ${midY}, ${x2Px.toFixed(1)} ${yTo}`;

    const animPath = document.createElementNS(svgNS, 'path');
    animPath.setAttribute('d', dPx);
    animPath.setAttribute('fill', 'none');
    animPath.setAttribute('stroke', '#ffe28a');
    animPath.setAttribute('stroke-width', '5');
    animPath.setAttribute('stroke-linecap', 'round');
    animPath.setAttribute('class', 'map-progress-trail');
    overlaySvg.appendChild(animPath);
    canvas.appendChild(overlaySvg);

    const totalLen = typeof animPath.getTotalLength === 'function' ? animPath.getTotalLength() : 0;
    if (totalLen <= 1) {
      overlaySvg.remove();
      if (baseRoad) baseRoad.style.opacity = prevOpacity;
      if (targetNode) targetNode.classList.remove('progression-pending');
      return;
    }

    animPath.style.strokeDasharray = `${totalLen}`;
    animPath.style.strokeDashoffset = `${totalLen}`;
    animPath.style.transition = 'stroke-dashoffset 1.35s cubic-bezier(0.35, 0, 0.25, 1)';

    // Kick off smooth SVG line draw on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        animPath.style.strokeDashoffset = '0';
      });
    });

    // Spawn tiny alternating left/right golden footsteps marching along the exact curve!
    const stepCount = 9;
    const footstepSvg = `
      <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
        <ellipse cx="8" cy="5.6" rx="3.1" ry="4.1" fill="currentColor"/>
        <ellipse cx="8" cy="12.2" rx="2.3" ry="2.2" fill="currentColor"/>
      </svg>
    `;

    for (let i = 0; i < stepCount; i++) {
      const t = 0.14 + (i / (stepCount - 1)) * 0.72;
      const dist = totalLen * t;
      const p = animPath.getPointAtLength(dist);
      const pNext = animPath.getPointAtLength(Math.min(totalLen, dist + 4));

      // Compute true screen-space tangent angle & perpendicular left/right stride offset
      const dxPx = pNext.x - p.x;
      const dyPx = pNext.y - p.y;
      const mag = Math.hypot(dxPx, dyPx) || 1;
      const angleDeg = (Math.atan2(dyPx, dxPx) * 180) / Math.PI + 90;

      const side = i % 2 === 0 ? 1 : -1;
      const offsetPx = 9.5 * side;
      const nx = -dyPx / mag;
      const ny = dxPx / mag;

      const stepEl = document.createElement('span');
      stepEl.className = 'map-footstep';
      stepEl.innerHTML = footstepSvg;
      stepEl.style.left = `calc(${((p.x / canvasW) * 100).toFixed(2)}% + ${(nx * offsetPx).toFixed(1)}px)`;
      stepEl.style.top = `${(p.y + ny * offsetPx).toFixed(1)}px`;
      stepEl.style.transform = `translate(-50%, -50%) rotate(${angleDeg.toFixed(1)}deg) scaleX(${side})`;
      const delayMs = Math.round(140 + i * 125);
      stepEl.style.animationDelay = `${delayMs}ms`;
      canvas.appendChild(stepEl);

      // Subtle rhythmic footstep tap sound on every other stride
      if (i % 2 === 0) {
        this._progressionTimers.push(
          setTimeout(() => {
            if (this.el.screenCampaign?.classList.contains('active')) {
              sound.playSelect();
            }
          }, delayMs)
        );
      }
    }

    // Arrival at next stronghold: reveal the glowing medallion & settle trail
    this._progressionTimers.push(
      setTimeout(() => {
        if (baseRoad) baseRoad.style.opacity = prevOpacity;
        overlaySvg.style.transition = 'opacity 0.55s ease';
        overlaySvg.style.opacity = '0';
        this._selectMapLevel(toId);

        if (targetNode) {
          targetNode.classList.remove('progression-pending');
          targetNode.classList.remove('just-revealed');
          void targetNode.offsetWidth;
          targetNode.classList.add('just-revealed');
        }
        if (newlyUnlocked && this.el.screenCampaign?.classList.contains('active')) {
          sound.playPlace();
        }
        this.justUnlockedLevelId = null;

        this._progressionTimers.push(
          setTimeout(() => {
            overlaySvg.remove();
          }, 600)
        );
      }, 1420)
    );
  }

  _selectMapLevel(levelId) {
    this.selectedMapLevelId = levelId;
    const nodes = this.el.campaignMapCanvas?.querySelectorAll('.map-node[data-level-id]') || [];
    for (const node of nodes) {
      node.classList.toggle('selected', Number(node.dataset.levelId) === levelId);
    }
    this._syncRealmIndicator(levelId);
  }

  _syncRealmIndicator(levelId) {
    const lvlId = levelId || 1;
    const ch = getChapterForLevel(lvlId);
    if (this.el.mapRealmIndicator) {
      this.el.mapRealmIndicator.textContent = `Chapter ${ch.roman} • ${ch.name}`;
    }
    if (this.el.btnPlayChapterStory) {
      this.el.btnPlayChapterStory.title = `Watch Level ${lvlId} Story`;
    }
  }

  _scrollToMapNode(levelId, smooth = true) {
    const vp = this.el.campaignMapViewport;
    const y = this._mapNodeY.get(levelId);
    if (!vp || y === undefined) return;
    const targetTop = Math.max(0, y - vp.clientHeight * 0.5);
    vp.scrollTo({ top: targetTop, behavior: smooth ? 'smooth' : 'auto' });
  }

  _openLevelBriefing(levelId) {
    const lvl = LEVELS.find((l) => l.id === levelId);
    if (!lvl) return;

    this._pendingBriefLevel = lvl;
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
    this.el.briefDesc.textContent = LEVEL_DISPATCHES[lvl.id] || lvl.description;
    this.el.modalBriefing.classList.remove('hidden');
    this._syncHistoryGuard();
  }

  _closeLevelBriefing() {
    this._pendingBriefLevel = null;
    this.el.modalBriefing.classList.add('hidden');
    this._syncHistoryGuard();
  }

  _startLevel(levelId, showBriefing = false, allowCutscene = true) {
    const lvl = LEVELS.find((l) => l.id === levelId);
    if (!lvl) return;

    if (showBriefing) {
      this._openLevelBriefing(lvl.id);
      return;
    }

    // Play each level's dedicated 30-second story when entering the board (if Story Cutscenes are enabled)
    if (allowCutscene && this.cutscenesEnabled) {
      const levelCutscene = getCutsceneIdForLevel(lvl.id);
      if (levelCutscene) {
        this._playCutscene(levelCutscene, () => {
          this._launchLevelBoard(lvl);
        });
        return;
      }
    }

    this._launchLevelBoard(lvl);
  }

  _openCampaignScreen() {
    this.el.screenHome.classList.remove('active');
    this.el.screenGame.classList.remove('active');
    this.el.screenCampaign.classList.add('active');
    this._renderCampaign(true);
    this._syncHistoryGuard();
  }

  _returnToHome() {
    this._clearProgressionTimers();
    this.engine?.stop();
    this.weather?.stop();
    this._pendingBriefLevel = null;
    this._pausedBySettings = false;
    this.el.modalBriefing.classList.add('hidden');
    this.el.modalResult.classList.add('hidden');
    this.el.modalSettings?.classList.add('hidden');
    this.el.screenGame.classList.remove('active');
    this.el.screenCampaign.classList.remove('active');
    this.el.screenHome.classList.add('active');
    this._renderCampaign(false);
    this._syncHistoryGuard();
  }

  _leaveBattle() {
    if (this.currentLevel?.isQuickMatch) {
      this._returnToHome();
    } else {
      this._returnToCampaign();
    }
  }

  _startQuickMatch() {
    // Procedurally generate a random 8x8 chessboard path + random battlefield backdrop
    const skirmishLevel = generateQuickMatchLevel(this._lastQuickMatchBgId);
    this._lastQuickMatchBgId = skirmishLevel.bgLevelId;
    this._launchLevelBoard(skirmishLevel);
  }

  _launchLevelBoard(lvl) {
    this._clearProgressionTimers();
    this.pendingProgression = null;
    this._pendingBriefLevel = null;
    this.currentLevel = lvl;
    if (!lvl.isQuickMatch) {
      this.selectedMapLevelId = lvl.id;
    }

    const bgId = lvl.bgLevelId || lvl.id;

    // Apply per-level painted battlefield backdrop at low opacity behind the 2.5D board
    if (this.el.gameBgArt) {
      const bgUrl = getLevelBgUrl(bgId);
      this.el.gameBgArt.style.backgroundImage = bgUrl ? `url("${bgUrl}")` : '';
    }

    this.el.modalBriefing.classList.add('hidden');
    this.el.modalQuickmatch?.classList.add('hidden');
    this.el.screenHome.classList.remove('active');
    this.el.screenCampaign.classList.remove('active');
    this.el.screenGame.classList.add('active');

    const diffPreset = DIFFICULTY_PRESETS[normalizeDifficulty(this.difficulty)] || DIFFICULTY_PRESETS.novice;
    if (lvl.isQuickMatch) {
      this.el.hudLevelNum.textContent = `QUICK MATCH • ${diffPreset.label.toUpperCase()}`;
    } else {
      const diffTag = diffPreset.shortTag ? ` • ${diffPreset.shortTag}` : '';
      this.el.hudLevelNum.textContent = `LEVEL ${lvl.id}${diffTag}`;
    }
    this.el.hudLevelName.textContent = lvl.name;

    this.engine.loadLevel(lvl, this.difficulty);
    if (this.weatherEnabled) {
      this.weather?.start(lvl.weather || 'sunrays', bgId);
    } else {
      this.weather?.stop();
    }
    requestAnimationFrame(() => {
      this.engine.resize();
      if (this.weatherEnabled) this.weather?.resize();
    });
    this._syncHistoryGuard();
  }

  _returnToCampaign() {
    this.engine?.stop();
    this.weather?.stop();
    this._pendingBriefLevel = null;
    this._pausedBySettings = false;
    this.el.modalBriefing.classList.add('hidden');
    this.el.modalResult.classList.add('hidden');
    this.el.modalSettings?.classList.add('hidden');
    this.el.screenGame.classList.remove('active');
    this.el.screenHome.classList.remove('active');
    this.el.screenCampaign.classList.add('active');
    this._renderCampaign(Boolean(this.justUnlockedLevelId || this.pendingProgression));
    this._syncHistoryGuard();
  }

  // ==================== REACTIVE GAMEPLAY HUD ====================

  _renderHud(state) {
    if (!this.currentLevel) return;

    this.el.hudGold.textContent = state.gold;
    this.el.hudLives.textContent = state.lives;
    this.el.hudWave.textContent = `${Math.max(0, state.waveIndex + 1)}/${state.totalWaves}`;

    if (this.el.speedBadge) {
      this.el.speedBadge.textContent = `${state.speedMult}x`;
    }
    this.el.btnSpeed.classList.toggle('active-toggle', state.speedMult > 1);
    const isPaused = state.gameState === 'paused';
    if (this.el.btnPauseIcon) {
      const nextIcon = getUiIconUrl(isPaused ? 'play' : 'pause');
      if (this.el.btnPauseIcon.getAttribute('src') !== nextIcon) {
        this.el.btnPauseIcon.setAttribute('src', nextIcon);
      }
    }
    this.el.btnPause.title = isPaused ? 'Resume Battle' : 'Pause Battle';
    this.el.btnPause.setAttribute('aria-label', isPaused ? 'Resume Battle' : 'Pause Battle');
    this.el.btnPause.classList.toggle('active-toggle', isPaused);

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
    const unlockedIds = new Set(
      getUnlockedPiecesForLevel(this.currentLevel.unlockAllPieces ? 99 : this.currentLevel.id)
    );
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

    const rankBadges = { 1: '▲ Rank I', 2: '▲▲ Rank II', 3: '♛ Rank III' };
    this.el.inspSprite.src = getSpriteUrl(stats.sprite);
    this.el.inspSprite.alt = stats.displayName;
    this.el.inspName.textContent = stats.displayName;
    this.el.inspTier.textContent = rankBadges[tower.tier] || `Rank ${tower.tier}`;
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
      const nextIcon = tower.tier === 2 ? '♛' : '▲▲';
      this.el.inspUpgradeDesc.textContent = `Promote → ${nextUpg.name}: ${nextUpg.desc}`;
      this.el.btnUpgradeTower.disabled = state.gold < nextUpg.cost;
      this.el.btnUpgradeTower.textContent = `${nextIcon} Promote (${nextUpg.cost}g)`;
    } else {
      this.el.inspUpgradeDesc.textContent = 'Maximum Promotion reached — Royal Masterpiece!';
      this.el.btnUpgradeTower.disabled = true;
      this.el.btnUpgradeTower.textContent = '♛ Max Rank';
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
    if (result.level?.isQuickMatch) {
      const modal = this.el.modalResult;
      modal.classList.remove('hidden');
      this.el.resultNextUnlock.classList.add('hidden');
      this.el.btnResultMenu.textContent = 'Main Menu';
      this.el.btnResultMenu.classList.remove('hidden');
      this.el.btnResultRetry.textContent = 'Replay';
      this.el.btnResultNext.textContent = 'New Quick Match →';
      this.el.btnResultNext.classList.remove('hidden');

      if (result.victory) {
        this.el.resultKicker.textContent = `QUICK MATCH VICTORY • ${result.level.name.toUpperCase()}`;
        this.el.resultTitle.textContent = 'Skirmish Won!';
        this.el.resultStars.textContent = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
        this.el.resultSummary.textContent = `You crushed the Warlord vanguard with ${result.livesLeft} Citadel lives intact. Final Score: ${result.score.toLocaleString()}.`;
      } else {
        this.el.resultKicker.textContent = `QUICK MATCH • ${result.level.name.toUpperCase()}`;
        this.el.resultTitle.textContent = 'Checkmate';
        this.el.resultStars.textContent = '☆☆☆';
        this.el.resultSummary.textContent =
          'The Obsidian Legion broke through! Try a fresh formation or deploy onto another random arena.';
      }
      return;
    }

    this.el.btnResultMenu.textContent = 'Campaign';
    this.el.btnResultRetry.textContent = 'Replay';

    const showResultModal = () => {
      const modal = this.el.modalResult;
      modal.classList.remove('hidden');

      if (result.victory) {
        this.el.resultKicker.textContent =
          result.level.id === LEVELS.length
            ? 'CAMPAIGN COMPLETE • THE ACCORD RESTORED'
            : `LEVEL ${result.level.id} CONQUERED`;
        this.el.resultTitle.textContent = result.level.id === LEVELS.length ? 'Grand Victory!' : 'Victory!';
        this.el.resultStars.textContent = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
        this.el.resultSummary.textContent =
          result.level.id === LEVELS.length
            ? `Malakor, the Unbound King has fallen! The Crimson Rift seals with ${result.livesLeft} Citadel lives intact. Final Score: ${result.score.toLocaleString()}.`
            : `The Obsidian Army has been repelled with ${result.livesLeft} Citadel lives intact. Final Score: ${result.score.toLocaleString()}.`;

        const nextLevel = LEVELS.find((l) => l.id === result.level.id + 1);
        this.el.btnResultMenu.classList.add('hidden');
        this.el.btnResultNext.classList.remove('hidden');
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
          this.el.btnResultNext.textContent = 'Continue on Map →';
        } else {
          this.el.resultNextUnlock.classList.add('hidden');
          this.el.btnResultNext.textContent = 'Return to Map →';
        }
      } else {
        this.el.resultKicker.textContent = 'THE CITADEL HAS FALLEN';
        this.el.resultTitle.textContent = 'Checkmate';
        this.el.resultStars.textContent = '☆☆☆';
        this.el.resultSummary.textContent =
          'The dark legion breached your sanctuary. Adjust your chess sightlines, promote key pieces, and hold the line!';
        this.el.resultNextUnlock.classList.add('hidden');
        this.el.btnResultMenu.classList.remove('hidden');
        this.el.btnResultNext.classList.add('hidden');
      }
    };

    if (result.victory) {
      const prevUnlocked = this.progress.highestUnlocked;
      this.progress = recordLevelVictory(this.progress, {
        levelId: result.level.id,
        stars: result.stars,
        score: result.score,
        difficulty: this.difficulty,
        totalLevels: LEVELS.length,
      });

      const newlyUnlocked = this.progress.highestUnlocked > prevUnlocked;
      const nextLevel = LEVELS.find((l) => l.id === result.level.id + 1);
      if (newlyUnlocked) {
        this.justUnlockedLevelId = this.progress.highestUnlocked;
        this.selectedMapLevelId = this.progress.highestUnlocked;
      } else if (nextLevel && nextLevel.id <= this.progress.highestUnlocked) {
        this.selectedMapLevelId = nextLevel.id;
      }

      this.pendingProgression =
        nextLevel && nextLevel.id <= this.progress.highestUnlocked
          ? { fromId: result.level.id, toId: nextLevel.id, newlyUnlocked }
          : null;

      if (result.level.id === LEVELS.length && this.cutscenesEnabled) {
        this._playCutscene('epilogue', showResultModal);
        return;
      }
    } else {
      this.pendingProgression = null;
    }

    showResultModal();
  }

  // ==================== ROYAL ARCHIVES (CODEX, BESTIARY, VILLAINS & CHRONICLES) ====================

  _openCodex(initialTab = 'defenders') {
    sound.unlock();
    sound.playSelect();
    this._renderCodexTab(initialTab);
    this.el.modalCodex.classList.remove('hidden');
    this._syncHistoryGuard();
  }

  _renderCodexTab(tab = 'defenders') {
    this.activeCodexTab = tab;
    const tabBtns = this.el.codexTabs?.querySelectorAll('.codex-tab[data-tab]') || [];
    for (const btn of tabBtns) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    }

    if (tab === 'enemies') {
      this._renderCodexEnemies();
    } else if (tab === 'villains') {
      this._renderCodexVillains();
    } else if (tab === 'chronicles') {
      this._renderCodexChronicles();
    } else {
      this._renderCodexDefenders();
    }
  }

  _renderCodexDefenders() {
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
  }

  _renderCodexEnemies() {
    const order = ['footman', 'lancer', 'bastion', 'cleric', 'warlord'];
    const cards = order
      .map((id) => {
        const e = ENEMY_TYPES[id];
        const lore = ENEMY_LORE[id];
        if (!e || !lore) return '';
        const armorPct = Math.round((e.armor || 0) * 100);
        return `
          <div class="enemy-lore-card ${e.isBoss ? 'is-boss' : ''}">
            <img src="${getSpriteUrl(e.sprite)}" alt="${e.name}" />
            <div class="codex-item-info">
              <h4>
                ${e.name}
                <span class="codex-badge">${e.isBoss ? 'BOSS CLASS' : `+${e.reward}g`}</span>
              </h4>
              <p class="enemy-lore-epithet">${lore.epithet}</p>
              <div class="enemy-stat-pills">
                <span class="enemy-stat-pill">HP ${e.baseHp}</span>
                <span class="enemy-stat-pill">SPD ${e.speed.toFixed(1)}</span>
                ${armorPct > 0 ? `<span class="enemy-stat-pill">ARMOR ${armorPct}%</span>` : ''}
                <span class="enemy-stat-pill trait">${e.trait}</span>
              </div>
              <p class="codex-item-tip">${lore.story}</p>
            </div>
          </div>
        `;
      })
      .join('');

    this.el.codexBody.innerHTML = `
      <div>
        <h3 class="codex-section-title">The Obsidian Legion — Bestiary</h3>
        <div class="codex-grid">${cards}</div>
      </div>
    `;
  }

  _renderCodexVillains() {
    const cards = VILLAINS.map(
      (v) => `
      <article class="villain-card chapter-${v.chapter}">
        <div class="villain-banner">
          <img class="villain-banner-img" src="${getSceneUrl(v.scene)}" alt="${v.name}" />
          <div class="villain-banner-content">
            <img class="villain-portrait" src="${getSpriteUrl(v.sprite)}" alt="${v.name}" />
            <div class="villain-title-block">
              <h4>${v.name}</h4>
              <p>Chapter ${v.chapter === 1 ? 'I' : v.chapter === 2 ? 'II' : 'III'} Boss • Level ${v.bossLevel} • ${v.title}</p>
            </div>
          </div>
        </div>
        <div class="villain-body">
          <blockquote class="villain-quote">${v.quote}</blockquote>
          <p class="villain-lore">${v.lore}</p>
          <p class="villain-tactic"><strong>Tactical Counter:</strong> ${v.tactic}</p>
        </div>
      </article>
    `
    ).join('');

    this.el.codexBody.innerHTML = `
      <div>
        <h3 class="codex-section-title">Commanders of the Shattered Crown</h3>
        <div class="villain-list">${cards}</div>
      </div>
    `;
  }

  _renderCodexChronicles() {
    const beatFinal =
      getStarsForLevel(this.progress, LEVELS.length, 'novice') > 0 ||
      getStarsForLevel(this.progress, LEVELS.length, 'master') > 0 ||
      getStarsForLevel(this.progress, LEVELS.length, 'grandmaster') > 0;

    const cards = CUTSCENE_ORDER.map((id) => {
      const c = CUTSCENES[id];
      const unlocked =
        this.progress.seenCutscenes?.includes(id) ||
        (id === 'epilogue' ? beatFinal : this.progress.highestUnlocked >= c.unlockLevel);

      return `
        <div class="chronicle-card ${unlocked ? '' : 'locked'}">
          <div class="chronicle-thumb-wrap">
            <img class="chronicle-thumb" src="${getSceneUrl(c.thumbScene)}" alt="${c.title}" />
            <span class="chronicle-badge">${c.chapterLabel}</span>
          </div>
          <div class="chronicle-meta">
            <h4>${c.title}</h4>
            <p>${c.summary}</p>
            <button
              class="btn ${unlocked ? 'btn-gold' : 'btn-secondary'} btn-sm"
              type="button"
              data-watch-cutscene="${c.id}"
              ${unlocked ? '' : 'disabled'}
            >
              ${unlocked ? '▶ Watch Cinematic' : id === 'epilogue' ? 'Conquer Level 18 to Unlock' : `Reach Level ${c.unlockLevel} to Unlock`}
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.el.codexBody.innerHTML = `
      <div>
        <h3 class="codex-section-title">Chronicles of Aethelgard — Replay Cinematics</h3>
        <div class="chronicle-grid">${cards}</div>
      </div>
    `;

    this.el.codexBody.querySelectorAll('[data-watch-cutscene]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const cid = btn.dataset.watchCutscene;
        sound.unlock();
        sound.playSelect();
        this.el.modalCodex.classList.add('hidden');
        this._playCutscene(cid);
      });
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new TowerDeChessApp();
});

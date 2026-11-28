/**
 * Rewarded Ad Service for TowerDeChess.
 *
 * - On Native Capacitor Android: uses `@capacitor-community/admob` (`window.Capacitor.Plugins.AdMob`)
 *   with Google's official Test Rewarded Ad Unit ID by default. Swap `ADMOB_CONFIG` below (and
 *   `com.google.android.gms.ads.APPLICATION_ID` in `android/app/src/main/AndroidManifest.xml`)
 *   with your production AdMob IDs before publishing to Google Play.
 * - On Web / PWA / Standalone: displays an interactive 5-second Royal Patron Rewarded Ad Preview
 *   modal so the complete between-level monetization loop is testable everywhere.
 */

import { sound } from './audio.js';

export const ADMOB_CONFIG = {
  // Official Google AdMob Test Rewarded Video Ad Unit ID (Android)
  // Replace with your live ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY unit ID for production.
  androidRewardedAdId: 'ca-app-pub-3940256099942544/5224354917',
  iosRewardedAdId: 'ca-app-pub-3940256099942544/1712485313',
  testingMode: true,
  webPreviewDurationSec: 5,
};

export const REWARDED_AD_BONUS_CHARGES = 2;

class AdService {
  constructor() {
    this._initialized = false;
    this._busy = false;
    this._prepared = false;
  }

  _getNativePlugin() {
    const cap = window.Capacitor;
    if (!cap?.isNativePlatform?.()) return null;
    return cap.Plugins?.AdMob || null;
  }

  isNativeAdMobAvailable() {
    return Boolean(this._getNativePlugin());
  }

  async init() {
    if (this._initialized) return;
    const admob = this._getNativePlugin();
    if (!admob) {
      this._initialized = true;
      return;
    }
    try {
      await admob.initialize({
        initializeForTesting: ADMOB_CONFIG.testingMode,
      });
      this._initialized = true;
      this.preloadRewarded().catch(() => {});
    } catch {
      // Fail softly if offline or plugin unavailable
    }
  }

  _getUnitId() {
    const platform = window.Capacitor?.getPlatform?.() || 'android';
    return platform === 'ios' ? ADMOB_CONFIG.iosRewardedAdId : ADMOB_CONFIG.androidRewardedAdId;
  }

  async preloadRewarded() {
    const admob = this._getNativePlugin();
    if (!admob) return false;
    try {
      await admob.prepareRewardVideoAd({
        adId: this._getUnitId(),
        isTesting: ADMOB_CONFIG.testingMode,
      });
      this._prepared = true;
      return true;
    } catch {
      this._prepared = false;
      return false;
    }
  }

  /**
   * Presents a rewarded video ad (native AdMob on Android, interactive 5s preview on Web).
   * Resolves to `{ rewarded: boolean, reason?: string }`.
   */
  async showRewardedAd({ rewardLabel = '+2 Tactic Charges', tacticName = 'Royal Tactics' } = {}) {
    if (this._busy) return { rewarded: false, reason: 'busy' };
    this._busy = true;

    const prevMusicIntensity = sound.musicIntensity;
    sound.setMusicDucked(true);

    try {
      const admob = this._getNativePlugin();
      if (admob) {
        return await this._showNativeAdMob(admob);
      }
      return await this._showWebPreviewModal({ rewardLabel, tacticName });
    } finally {
      this._busy = false;
      sound.setMusicDucked(false);
      if (prevMusicIntensity && sound.musicIntensity !== prevMusicIntensity) {
        sound.setMusicIntensity(prevMusicIntensity);
      }
    }
  }

  async _showNativeAdMob(admob) {
    try {
      if (!this._initialized) {
        await this.init();
      }
      if (!this._prepared) {
        const ok = await this.preloadRewarded();
        if (!ok) {
          return { rewarded: false, reason: 'load_failed' };
        }
      }

      let earned = false;
      const handles = [];

      const cleanup = async () => {
        for (const h of handles) {
          try {
            await h?.remove?.();
          } catch {
            // ignore
          }
        }
      };

      const rewardPromise = new Promise((resolve) => {
        let settled = false;
        const finish = (rewarded, reason = '') => {
          if (settled) return;
          settled = true;
          resolve({ rewarded, reason });
        };

        Promise.all([
          admob.addListener('onRewardedVideoAdReward', () => {
            earned = true;
          }),
          admob.addListener('onRewardedVideoAdDismissed', () => {
            finish(earned, earned ? 'completed' : 'dismissed_early');
          }),
          admob.addListener('onRewardedVideoAdFailedToShow', () => {
            finish(false, 'show_failed');
          }),
        ])
          .then((list) => {
            handles.push(...list);
            this._prepared = false;
            return admob.showRewardVideoAd();
          })
          .then((rewardItem) => {
            if (rewardItem && Number(rewardItem.amount) > 0) {
              earned = true;
            }
            // Some plugin versions resolve showRewardVideoAd directly after reward
            setTimeout(() => finish(earned, earned ? 'completed' : 'closed'), 350);
          })
          .catch(() => {
            finish(false, 'show_error');
          });
      });

      const result = await rewardPromise;
      await cleanup();
      // Preload next ad silently for the following level transition
      this.preloadRewarded().catch(() => {});
      return result;
    } catch {
      return { rewarded: false, reason: 'native_error' };
    }
  }

  _showWebPreviewModal({ rewardLabel, tacticName }) {
    const modal = document.getElementById('modal-reward-ad');
    const countdownEl = document.getElementById('reward-ad-countdown');
    const barEl = document.getElementById('reward-ad-progress-fill');
    const statusEl = document.getElementById('reward-ad-status');
    const rewardTitleEl = document.getElementById('reward-ad-prize');
    const btnClose = document.getElementById('btn-reward-ad-close');
    const btnClaim = document.getElementById('btn-reward-ad-claim');

    if (!modal || !countdownEl || !barEl || !btnClose || !btnClaim) {
      return Promise.resolve({ rewarded: true, reason: 'fallback' });
    }

    const totalMs = ADMOB_CONFIG.webPreviewDurationSec * 1000;

    return new Promise((resolve) => {
      let finished = false;
      let rewardReady = false;
      let rafId = null;
      const startTime = performance.now();

      if (rewardTitleEl) {
        rewardTitleEl.textContent = `${rewardLabel} (${tacticName})`;
      }
      if (statusEl) {
        statusEl.textContent = 'Sponsored Royal Dispatch • Watch until the timer finishes to claim';
      }
      btnClaim.classList.add('hidden');
      btnClose.textContent = 'Skip (No Reward)';
      barEl.style.width = '0%';
      countdownEl.textContent = `${ADMOB_CONFIG.webPreviewDurationSec}s`;
      modal.classList.remove('hidden');

      const cleanupAndResolve = (rewarded, reason) => {
        if (finished) return;
        finished = true;
        if (rafId) cancelAnimationFrame(rafId);
        btnClose.removeEventListener('click', onClose);
        btnClaim.removeEventListener('click', onClaim);
        modal.classList.add('hidden');
        resolve({ rewarded, reason });
      };

      const onClose = () => {
        sound.playSelect();
        cleanupAndResolve(rewardReady, rewardReady ? 'completed' : 'dismissed_early');
      };

      const onClaim = () => {
        sound.playPlace();
        cleanupAndResolve(true, 'completed');
      };

      btnClose.addEventListener('click', onClose);
      btnClaim.addEventListener('click', onClaim);

      const tick = (now) => {
        if (finished) return;
        const elapsed = now - startTime;
        const ratio = Math.min(1, elapsed / totalMs);
        const remainingSec = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));

        barEl.style.width = `${(ratio * 100).toFixed(1)}%`;
        countdownEl.textContent = remainingSec > 0 ? `${remainingSec}s` : '✓';

        if (ratio >= 1 && !rewardReady) {
          rewardReady = true;
          if (statusEl) {
            statusEl.textContent = 'Reward unlocked! Claim your bonus tactic charges below.';
          }
          btnClose.textContent = 'Close';
          btnClaim.classList.remove('hidden');
          sound.playSelect();
          return;
        }
        rafId = requestAnimationFrame(tick);
      };

      rafId = requestAnimationFrame(tick);
    });
  }
}

export const adService = new AdService();

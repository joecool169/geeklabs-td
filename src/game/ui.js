import { TOWER_DEFS } from "../constants.js";
import { round1 } from "./utils.js";
import { getNextUpgradeCost, getTargetModeLabel } from "./towers.js";

function showToast(msg, ms = 2400) {
  this.toast.setText(msg);
  this.toast.setVisible(true);
  if (this.toastTimer) this.toastTimer.remove(false);
  this.toastTimer = this.time.delayedCall(ms, () => {
    this.toast.setVisible(false);
  });
}

function clearTransitionBanner() {
  if (this._transitionBannerTimer) {
    this._transitionBannerTimer.remove(false);
    this._transitionBannerTimer = null;
  }
  if (this._transitionBannerTween) {
    this._transitionBannerTween.stop();
    this._transitionBannerTween.remove();
    this._transitionBannerTween = null;
  }
  if (this.transitionBanner) {
    this.transitionBanner.setVisible(false);
    this.transitionBanner.setAlpha(0);
  }
}

function showTransitionBanner(text, tone = "neutral", duration = 1100) {
  const banner = this.transitionBanner;
  if (!banner) return;

  clearTransitionBanner.call(this);
  const color = tone === "positive" ? "#a9ffc9" : "#dbe7ff";
  const backgroundColor =
    tone === "positive" ? "rgba(12, 42, 28, 0.88)" : "rgba(10, 23, 38, 0.88)";

  banner
    .setText(text)
    .setColor(color)
    .setBackgroundColor(backgroundColor)
    .setVisible(true)
    .setAlpha(0);

  this._transitionBannerTween = this.tweens.add({
    targets: banner,
    alpha: 1,
    duration: 120,
    ease: "Sine.easeOut",
    onComplete: () => {
      this._transitionBannerTween = null;
    },
  });

  this._transitionBannerTimer = this.time.delayedCall(Math.max(120, duration - 200), () => {
    this._transitionBannerTimer = null;
    this._transitionBannerTween = this.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 200,
      ease: "Sine.easeIn",
      onComplete: () => {
        banner.setVisible(false);
        this._transitionBannerTween = null;
      },
    });
  });
}

function updateWaveHint(text, visible) {
  const hint = this.waveHint;
  if (!hint) return;
  if (this._waveHintTween) {
    this._waveHintTween.stop();
    this._waveHintTween.remove();
    this._waveHintTween = null;
  }

  const prevText = this._waveHintText;
  const prevVisible = this._waveHintVisible;

  if (!visible) {
    if (prevVisible) {
      this._waveHintVisible = false;
      hint.setAlpha(1);
      this._waveHintTween = this.tweens.add({
        targets: hint,
        alpha: 0,
        duration: 140,
        ease: "Sine.easeOut",
        onComplete: () => {
          hint.setVisible(false);
          this._waveHintTween = null;
        },
      });
    } else {
      hint.setVisible(false);
    }
    return;
  }

  const shouldAnimate = !prevVisible || prevText !== text;
  hint.setVisible(true);

  if (shouldAnimate && prevVisible && prevText !== text) {
    this._waveHintTween = this.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 140,
      ease: "Sine.easeOut",
      onComplete: () => {
        hint.setText(text);
        hint.setAlpha(0);
        this._waveHintTween = this.tweens.add({
          targets: hint,
          alpha: 1,
          duration: 160,
          ease: "Sine.easeIn",
          onComplete: () => {
            this._waveHintTween = null;
          },
        });
      },
    });
  } else {
    if (shouldAnimate) hint.setAlpha(0);
    hint.setText(text);
    if (shouldAnimate) {
      this._waveHintTween = this.tweens.add({
        targets: hint,
        alpha: 1,
        duration: 160,
        ease: "Sine.easeIn",
        onComplete: () => {
          this._waveHintTween = null;
        },
      });
    } else {
      hint.setAlpha(1);
    }
  }

  this._waveHintVisible = true;
  this._waveHintText = text;
}

function updateUI() {
  if (this.waveState === "intermission") {
    const wait = Math.max(0, this.nextWaveAvailableAt - this.time.now);
    const ready = wait <= 0;
    const sec = Math.ceil(wait / 1000);

    if (!this.didStartFirstWave) {
      updateWaveHint.call(this, `WAVE ${this.wave} READY  •  SPACE to start`, true);
    } else if (ready) {
      updateWaveHint.call(
        this,
        this.autoStartWaves
          ? `WAVE ${this.wave}  •  Deploying`
          : `WAVE ${this.wave} READY  •  SPACE to start`
        ,
        true
      );
    } else {
      updateWaveHint.call(
        this,
        this.autoStartWaves
          ? `NEXT WAVE  •  ${sec}s  •  SPACE twice to deploy now`
          : `WAVE ${this.wave} READY IN ${sec}s  •  SPACE twice to deploy now`
        ,
        true
      );
    }
  } else {
    const spawners = this.activeWaves?.length ?? 0;
    const alive = this.enemies.countActive(true);
    updateWaveHint.call(
      this,
      `WAVE ${this.wave} ACTIVE  •  Groups: ${spawners}  •  On field: ${alive}`,
      true
    );
  }

  const label = this.difficultyLabel || "Easy";
  const uiSnapshot = {
    money: this.money,
    lives: this.lives,
    towers: this.towers.length,
    wave: this.wave,
    kills: this.killCount,
    score: this.score,
    diff: label,
  };
  const hudUnchanged =
    this._uiCache &&
    this._uiCache.money === uiSnapshot.money &&
    this._uiCache.lives === uiSnapshot.lives &&
    this._uiCache.towers === uiSnapshot.towers &&
    this._uiCache.wave === uiSnapshot.wave &&
    this._uiCache.kills === uiSnapshot.kills &&
    this._uiCache.score === uiSnapshot.score &&
    this._uiCache.diff === uiSnapshot.diff;
  if (!hudUnchanged) {
    this._uiCache = uiSnapshot;
    this.ui.setText(
      `Money: $${uiSnapshot.money}    Lives: ${uiSnapshot.lives}    Towers: ${uiSnapshot.towers}    Wave: ${uiSnapshot.wave}    Kills: ${uiSnapshot.kills}    Score: ${uiSnapshot.score}    Diff: ${uiSnapshot.diff}`
    );
  }

  if (this.placementContextEl) {
    this.placementContextEl.style.display = this.isPlacing ? "block" : "none";
  }
  if (this.isPlacing) {
    const def = TOWER_DEFS[this.placeType] || TOWER_DEFS.basic;
    const tier0 = def.tiers[0];
    if (this.placementTowerNameEl && this.placementTowerNameEl.textContent !== def.name) {
      this.placementTowerNameEl.textContent = def.name;
    }
    const costText = `$${tier0.cost}`;
    if (this.placementTowerCostEl && this.placementTowerCostEl.textContent !== costText) {
      this.placementTowerCostEl.textContent = costText;
    }
    const rangeText = `${tier0.range}`;
    if (this.placementTowerRangeEl && this.placementTowerRangeEl.textContent !== rangeText) {
      this.placementTowerRangeEl.textContent = rangeText;
    }
    if (this.placementValidityEl) {
      const validityText = this.ghostValid ? "Valid" : "Blocked";
      if (this.placementValidityEl.textContent !== validityText) {
        this.placementValidityEl.textContent = validityText;
      }
      this.placementValidityEl.classList.toggle("is-valid", this.ghostValid);
      this.placementValidityEl.classList.toggle("is-blocked", !this.ghostValid);
    }
  }
  if (this.towerStripSlots && this._towerStripWave !== uiSnapshot.wave) {
    this._towerStripWave = uiSnapshot.wave;
    const updateSlots = (slots) => {
      if (!slots) return;
      for (const slot of slots) {
        const unlockWave = slot.def?.unlockWave ?? 1;
        const locked = uiSnapshot.wave < unlockWave;
        slot.el.classList.toggle("is-locked", locked);
        slot.el.classList.toggle("locked", locked);
        slot.el.dataset.locked = locked ? "true" : "false";
        if (slot.metaEl) {
          slot.metaEl.textContent = locked ? `W${unlockWave}` : `$${slot.def.tiers[0].cost}`;
        }
        if (slot.keyEl) {
          slot.keyEl.style.display = locked ? "none" : "inline-flex";
        }
        if (slot.wasLocked === null || slot.wasLocked === undefined) {
          slot.wasLocked = locked;
        } else if (slot.wasLocked && !locked) {
          slot.el.classList.add("just-unlocked");
          window.setTimeout(() => {
            slot.el.classList.remove("just-unlocked");
          }, 1200);
          slot.wasLocked = locked;
        } else {
          slot.wasLocked = locked;
        }
      }
    };
    updateSlots(this.towerStripSlots);
  }

  if (!this.selectedTower || !this.towers.includes(this.selectedTower)) {
    const selectedGroup = this.controlsSelectedEl;
    if (selectedGroup) selectedGroup.classList.add("is-inactive");
    if (this.selectedTowerPanelEl) this.selectedTowerPanelEl.style.display = "none";
    if (this.selectedTowerUpgradeBtnEl) this.selectedTowerUpgradeBtnEl.disabled = true;
    if (this.selectedTowerSellBtnEl) this.selectedTowerSellBtnEl.disabled = true;
    if (this.selectedTowerTargetBtnEl) this.selectedTowerTargetBtnEl.disabled = true;
    return;
  }

  const selectedGroup = this.controlsSelectedEl;
  if (selectedGroup) selectedGroup.classList.remove("is-inactive");
  if (this.selectedTowerPanelEl) this.selectedTowerPanelEl.style.display = "block";

  const t = this.selectedTower;
  const def = TOWER_DEFS[t.type];
  const sps = 1000 / t.fireMs;
  const dps = t.damage * sps;
  const nextCost = getNextUpgradeCost(t);
  const nextText = nextCost === null ? "Max" : `$${nextCost}`;
  const refund = Math.floor((t.spent || 0) * 0.7);
  const targetLabel = getTargetModeLabel(t);
  if (this.selectedTowerNameEl) this.selectedTowerNameEl.textContent = `${def.name} (T${t.tier})`;
  if (this.selectedTowerTargetEl) this.selectedTowerTargetEl.textContent = targetLabel;
  if (this.selectedTowerDmgEl) this.selectedTowerDmgEl.textContent = `${t.damage}`;
  if (this.selectedTowerFireEl) this.selectedTowerFireEl.textContent = `${t.fireMs}ms (${round1(sps)}/s)`;
  if (this.selectedTowerRangeEl) this.selectedTowerRangeEl.textContent = `${t.range}`;
  if (this.selectedTowerDpsEl) this.selectedTowerDpsEl.textContent = `${round1(dps)}`;
  if (this.selectedTowerUpgradeEl) this.selectedTowerUpgradeEl.textContent = `${nextText}`;
  if (this.selectedTowerSellEl) this.selectedTowerSellEl.textContent = `$${refund}`;
  const canUpgrade = nextCost !== null && this.money >= nextCost;
  if (this.selectedTowerUpgradeBtnEl) this.selectedTowerUpgradeBtnEl.disabled = !canUpgrade;
  if (this.selectedTowerSellBtnEl) this.selectedTowerSellBtnEl.disabled = false;
  if (this.selectedTowerTargetBtnEl) this.selectedTowerTargetBtnEl.disabled = false;
}

export { clearTransitionBanner, showToast, showTransitionBanner, updateUI };

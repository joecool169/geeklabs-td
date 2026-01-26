import { TOWER_DEFS } from "../constants.js";
import { round1 } from "./utils.js";
import { getNextUpgradeCost } from "./towers.js";

function showToast(msg, ms = 2400) {
  this.toast.setText(msg);
  this.toast.setVisible(true);
  if (this.toastTimer) this.toastTimer.remove(false);
  this.toastTimer = this.time.delayedCall(ms, () => {
    this.toast.setVisible(false);
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
      updateWaveHint.call(this, `Wave ${this.wave} ready. Press SPACE to start.`, true);
    } else if (ready) {
      updateWaveHint.call(
        this,
        this.autoStartWaves
          ? `Wave ${this.wave} starting...`
          : `Wave ${this.wave} ready. Press SPACE to start.`
        ,
        true
      );
    } else {
      updateWaveHint.call(
        this,
        this.autoStartWaves
          ? `Next wave in ${sec}s... (SPACE twice to start now)`
          : `Wave ${this.wave} ready in ${sec}s... (SPACE twice to start now)`
        ,
        true
      );
    }
  } else {
    const spawners = this.activeWaves?.length ?? 0;
    const alive = this.enemies.countActive(true);
    updateWaveHint.call(
      this,
      `Wave ${this.wave} running | Spawners: ${spawners} | Alive: ${alive}`,
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

  if (this.buildMenuSectionEl) {
    this.buildMenuSectionEl.style.display = this.isPlacing ? "block" : "none";
  }
  if (this.buildMenuSlots && this._buildMenuWave !== uiSnapshot.wave) {
    this._buildMenuWave = uiSnapshot.wave;
    for (const slot of this.buildMenuSlots) {
      const unlockWave = slot.def?.unlockWave ?? 1;
      const locked = uiSnapshot.wave < unlockWave;
      slot.el.classList.toggle("is-locked", locked);
      slot.el.dataset.locked = locked ? "true" : "false";
      if (slot.metaEl) {
        slot.metaEl.textContent = locked ? `W${unlockWave}` : `$${slot.def.tiers[0].cost}`;
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
  const targetLabel =
    t.targetMode === "close"
      ? "Close"
      : t.targetMode === "strong"
        ? "Strong"
        : t.targetMode === "armored"
          ? "Armored"
          : "First";
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

export { showToast, updateUI };

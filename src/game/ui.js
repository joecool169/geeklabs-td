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

function updateUI() {
  if (this.waveState === "intermission") {
    const wait = Math.max(0, this.nextWaveAvailableAt - this.time.now);
    const ready = wait <= 0;
    const sec = Math.ceil(wait / 1000);
    this.waveHint.setVisible(true);

    if (!this.didStartFirstWave) {
      this.waveHint.setText(`Wave ${this.wave} ready. Press SPACE to start.`);
    } else if (ready) {
      this.waveHint.setText(
        this.autoStartWaves
          ? `Wave ${this.wave} starting...`
          : `Wave ${this.wave} ready. Press SPACE to start.`
      );
    } else {
      this.waveHint.setText(
        this.autoStartWaves
          ? `Next wave in ${sec}s... (SPACE to start now)`
          : `Wave ${this.wave} ready in ${sec}s... (SPACE to start when ready)`
      );
    }
  } else {
    this.waveHint.setVisible(true);
    this.waveHint.setText(
      `Wave ${this.wave} running: ${this.waveEnemiesSpawned}/${this.waveEnemiesTotal}`
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
  if (
    this._uiCache &&
    this._uiCache.money === uiSnapshot.money &&
    this._uiCache.lives === uiSnapshot.lives &&
    this._uiCache.towers === uiSnapshot.towers &&
    this._uiCache.wave === uiSnapshot.wave &&
    this._uiCache.kills === uiSnapshot.kills &&
    this._uiCache.score === uiSnapshot.score &&
    this._uiCache.diff === uiSnapshot.diff
  ) {
    return;
  }
  this._uiCache = uiSnapshot;
  this.ui.setText(
    `Money: $${uiSnapshot.money}    Lives: ${uiSnapshot.lives}    Towers: ${uiSnapshot.towers}    Wave: ${uiSnapshot.wave}    Kills: ${uiSnapshot.kills}    Score: ${uiSnapshot.score}    Diff: ${uiSnapshot.diff}`
  );

  if (!this.selectedTower || !this.towers.includes(this.selectedTower)) {
    this.setInspectorVisible(false);
    this.panel.setText("");
    return;
  }

  this.setInspectorVisible(true);
  this.drawInspectorBg(true);
  const t = this.selectedTower;
  const def = TOWER_DEFS[t.type];
  const sps = 1000 / t.fireMs;
  const dps = t.damage * sps;
  const nextCost = getNextUpgradeCost(t);
  const nextText = nextCost === null ? "Max" : `$${nextCost}`;
  const refund = Math.floor((t.spent || 0) * 0.7);
  const targetLabel = t.targetMode === "close" ? "Close" : t.targetMode === "strong" ? "Strong" : "First";
  this.panel.setText(
    `${def.name} Tower (Tier ${t.tier})
Target: ${targetLabel}
Damage: ${t.damage}
Fire: ${t.fireMs}ms (${round1(sps)}/s)
Range: ${t.range}
DPS: ${round1(dps)}
Upgrade: ${nextText}
Sell: $${refund}`
  );
  const canUpgrade = nextCost !== null && this.money >= nextCost;
  this.upgradeBtn.hit.enabled = !!canUpgrade;
  this.upgradeBtn.draw(!!canUpgrade, false, false);
  this.sellBtn.hit.enabled = true;
  this.sellBtn.draw(true, false, false);
  this.targetBtn.hit.enabled = true;
  this.targetBtn.draw(true, false, false);
}

export { showToast, updateUI };

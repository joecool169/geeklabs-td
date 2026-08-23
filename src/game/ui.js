import { TOWER_DEFS } from "../constants.js";
import { round1 } from "./utils.js";
import { getNextUpgradeCost, getTargetModeLabel } from "./towers.js";

function formatHudNumber(value) {
  return Math.max(0, Number(value) || 0).toLocaleString("en-US");
}

function formatHudText(snapshot) {
  return [
    `MONEY $${formatHudNumber(snapshot.money)}`,
    `LIVES ${formatHudNumber(snapshot.lives)}`,
    `TOWERS ${formatHudNumber(snapshot.towers)}`,
    `WAVE ${formatHudNumber(snapshot.wave)}`,
    `KILLS ${formatHudNumber(snapshot.kills)}`,
    `SCORE ${formatHudNumber(snapshot.score)}`,
    String(snapshot.diff || "Easy").toUpperCase(),
  ].join("   •   ");
}

function formatTouchTowerStats(tower) {
  const shotsPerSecond = 1000 / tower.fireMs;
  const dps = tower.damage * shotsPerSecond;
  return `DMG ${tower.damage}  •  RNG ${tower.range}  •  RATE ${round1(shotsPerSecond)}/s  •  DPS ${round1(dps)}`;
}

function showToast(scene, msg, ms = 2400) {
  scene.toast.setText(msg);
  scene.toast.setVisible(true);
  if (scene.toastTimer) scene.toastTimer.remove(false);
  scene.toastTimer = scene.time.delayedCall(ms, () => {
    scene.toast.setVisible(false);
  });
}

function clearTransitionBanner(scene) {
  if (scene._transitionBannerTimer) {
    scene._transitionBannerTimer.remove(false);
    scene._transitionBannerTimer = null;
  }
  if (scene._transitionBannerTween) {
    scene._transitionBannerTween.stop();
    scene._transitionBannerTween.remove();
    scene._transitionBannerTween = null;
  }
  if (scene.transitionBanner) {
    scene.transitionBanner.setVisible(false);
    scene.transitionBanner.setAlpha(0);
  }
}

function showTransitionBanner(scene, text, tone = "neutral", duration = 1100) {
  const banner = scene.transitionBanner;
  if (!banner) return;

  clearTransitionBanner(scene);
  const color = tone === "positive" ? "#a9ffc9" : "#dbe7ff";
  const backgroundColor =
    tone === "positive" ? "rgba(12, 42, 28, 0.88)" : "rgba(10, 23, 38, 0.88)";

  banner
    .setText(text)
    .setColor(color)
    .setBackgroundColor(backgroundColor)
    .setVisible(true)
    .setAlpha(0);

  scene._transitionBannerTween = scene.tweens.add({
    targets: banner,
    alpha: 1,
    duration: 120,
    ease: "Sine.easeOut",
    onComplete: () => {
      scene._transitionBannerTween = null;
    },
  });

  scene._transitionBannerTimer = scene.time.delayedCall(Math.max(120, duration - 200), () => {
    scene._transitionBannerTimer = null;
    scene._transitionBannerTween = scene.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 200,
      ease: "Sine.easeIn",
      onComplete: () => {
        banner.setVisible(false);
        scene._transitionBannerTween = null;
      },
    });
  });
}

function updateWaveHint(scene, text, visible) {
  const hint = scene.waveHint;
  if (!hint) return;
  if (scene._waveHintTween) {
    scene._waveHintTween.stop();
    scene._waveHintTween.remove();
    scene._waveHintTween = null;
  }

  const prevText = scene._waveHintText;
  const prevVisible = scene._waveHintVisible;

  if (!visible) {
    if (prevVisible) {
      scene._waveHintVisible = false;
      hint.setAlpha(1);
      scene._waveHintTween = scene.tweens.add({
        targets: hint,
        alpha: 0,
        duration: 140,
        ease: "Sine.easeOut",
        onComplete: () => {
          hint.setVisible(false);
          scene._waveHintTween = null;
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
    scene._waveHintTween = scene.tweens.add({
      targets: hint,
      alpha: 0,
      duration: 140,
      ease: "Sine.easeOut",
      onComplete: () => {
        hint.setText(text);
        hint.setAlpha(0);
        scene._waveHintTween = scene.tweens.add({
          targets: hint,
          alpha: 1,
          duration: 160,
          ease: "Sine.easeIn",
          onComplete: () => {
            scene._waveHintTween = null;
          },
        });
      },
    });
  } else {
    if (shouldAnimate) hint.setAlpha(0);
    hint.setText(text);
    if (shouldAnimate) {
      scene._waveHintTween = scene.tweens.add({
        targets: hint,
        alpha: 1,
        duration: 160,
        ease: "Sine.easeIn",
        onComplete: () => {
          scene._waveHintTween = null;
        },
      });
    } else {
      hint.setAlpha(1);
    }
  }

  scene._waveHintVisible = true;
  scene._waveHintText = text;
}

function updateUI(scene) {
  if (scene.touchStartWaveBtnEl) {
    scene.touchStartWaveBtnEl.textContent =
      scene.waveState === "running" ? "Add Wave" : "Start Wave";
    scene.touchStartWaveBtnEl.disabled =
      scene.isPaused || scene.isStartScreenActive || scene.isGameOver;
    scene.touchStartWaveBtnEl.classList.toggle(
      "is-wave-live",
      scene.waveState === "running"
    );
    scene.touchStartWaveBtnEl.classList.toggle(
      "is-wave-ready",
      scene.waveState === "intermission"
    );
  }
  if (scene.touchPauseBtnEl) {
    scene.touchPauseBtnEl.textContent = scene.isPaused ? "Resume" : "Pause";
    scene.touchPauseBtnEl.disabled =
      scene.isStartScreenActive || scene.isGameOver;
    scene.touchPauseBtnEl.classList.toggle("is-paused", scene.isPaused);
  }
  if (scene.touchPlaceBtnEl) {
    scene.touchPlaceBtnEl.disabled =
      !scene.isPlacing || !scene.ghostValid || scene.isPaused || scene.isGameOver;
    scene.touchPlaceBtnEl.classList.toggle(
      "is-confirm-ready",
      scene.isPlacing && scene.ghostValid && !scene.isPaused && !scene.isGameOver
    );
  }
  if (scene.touchCancelBtnEl) {
    scene.touchCancelBtnEl.disabled =
      !scene.isPaused && !scene.isPlacing && !scene.selectedTower;
    scene.touchCancelBtnEl.classList.toggle(
      "has-context",
      scene.isPaused || scene.isPlacing || !!scene.selectedTower
    );
  }

  if (scene.waveState === "intermission") {
    const wait = Math.max(0, scene.nextWaveAvailableAt - scene.time.now);
    const ready = wait <= 0;
    const sec = Math.ceil(wait / 1000);

    if (!scene.didStartFirstWave) {
      updateWaveHint(scene, `WAVE ${scene.wave} READY  •  SPACE to start`, true);
    } else if (ready) {
      updateWaveHint(
        scene,
        scene.autoStartWaves
          ? `WAVE ${scene.wave}  •  Deploying`
          : `WAVE ${scene.wave} READY  •  SPACE to start`
        ,
        true
      );
    } else {
      updateWaveHint(
        scene,
        scene.autoStartWaves
          ? `NEXT WAVE  •  ${sec}s  •  SPACE twice to deploy now`
          : `WAVE ${scene.wave} READY IN ${sec}s  •  SPACE twice to deploy now`
        ,
        true
      );
    }
  } else {
    const spawners = scene.activeWaves?.length ?? 0;
    const alive = scene.enemies.countActive(true);
    updateWaveHint(
      scene,
      `WAVE ${scene.wave} ACTIVE  •  Groups: ${spawners}  •  On field: ${alive}`,
      true
    );
  }

  const label = scene.difficultyLabel || "Easy";
  const uiSnapshot = {
    money: scene.money,
    lives: scene.lives,
    towers: scene.towers.length,
    wave: scene.wave,
    kills: scene.killCount,
    score: scene.score,
    diff: label,
  };
  const hudUnchanged =
    scene._uiCache &&
    scene._uiCache.money === uiSnapshot.money &&
    scene._uiCache.lives === uiSnapshot.lives &&
    scene._uiCache.towers === uiSnapshot.towers &&
    scene._uiCache.wave === uiSnapshot.wave &&
    scene._uiCache.kills === uiSnapshot.kills &&
    scene._uiCache.score === uiSnapshot.score &&
    scene._uiCache.diff === uiSnapshot.diff;
  if (!hudUnchanged) {
    scene._uiCache = uiSnapshot;
    scene.ui.setText(formatHudText(uiSnapshot));
    scene.ui.setColor(uiSnapshot.lives <= 5 ? "#ff9bad" : "#e8f2ff");
  }

  if (scene.placementContextEl) {
    scene.placementContextEl.style.display = scene.isPlacing ? "block" : "none";
  }
  if (scene.isPlacing) {
    const def = TOWER_DEFS[scene.placeType] || TOWER_DEFS.basic;
    const tier0 = def.tiers[0];
    if (scene.placementTowerNameEl && scene.placementTowerNameEl.textContent !== def.name) {
      scene.placementTowerNameEl.textContent = def.name;
    }
    const costText = `$${tier0.cost}`;
    if (scene.placementTowerCostEl && scene.placementTowerCostEl.textContent !== costText) {
      scene.placementTowerCostEl.textContent = costText;
    }
    const rangeText = `${tier0.range}`;
    if (scene.placementTowerRangeEl && scene.placementTowerRangeEl.textContent !== rangeText) {
      scene.placementTowerRangeEl.textContent = rangeText;
    }
    if (scene.placementValidityEl) {
      const validityText = scene.ghostValid ? "Valid" : "Blocked";
      if (scene.placementValidityEl.textContent !== validityText) {
        scene.placementValidityEl.textContent = validityText;
      }
      scene.placementValidityEl.classList.toggle("is-valid", scene.ghostValid);
      scene.placementValidityEl.classList.toggle("is-blocked", !scene.ghostValid);
    }
  }
  const towerStripState = `${uiSnapshot.wave}:${uiSnapshot.money}`;
  if (scene.towerStripSlots && scene._towerStripState !== towerStripState) {
    scene._towerStripState = towerStripState;
    const updateSlots = (slots) => {
      if (!slots) return;
      for (const slot of slots) {
        const unlockWave = slot.def?.unlockWave ?? 1;
        const locked = uiSnapshot.wave < unlockWave;
        const cost = slot.def?.tiers?.[0]?.cost ?? 0;
        const affordable = !locked && uiSnapshot.money >= cost;
        slot.el.classList.toggle("is-locked", locked);
        slot.el.classList.toggle("locked", locked);
        slot.el.classList.toggle("is-affordable", affordable);
        slot.el.classList.toggle("is-unaffordable", !locked && !affordable);
        slot.el.dataset.locked = locked ? "true" : "false";
        slot.el.setAttribute("aria-disabled", String(locked || !affordable));
        if (slot.metaEl) {
          slot.metaEl.textContent = locked ? `W${unlockWave}` : `$${cost}`;
        }
        if (slot.keyEl) {
          slot.keyEl.style.display = locked ? "none" : "inline-flex";
        }
        if (slot.wasLocked === null || slot.wasLocked === undefined) {
          slot.wasLocked = locked;
        } else if (slot.wasLocked && !locked) {
          slot.el.classList.add("just-unlocked");
          scene.showToast(`${slot.def.name} tower unlocked.`, 1800);
          scene.playSfx("upgrade");
          window.setTimeout(() => {
            slot.el.classList.remove("just-unlocked");
          }, 1200);
          slot.wasLocked = locked;
        } else {
          slot.wasLocked = locked;
        }
      }
    };
    updateSlots(scene.towerStripSlots);
  }

  if (!scene.selectedTower || !scene.towers.includes(scene.selectedTower)) {
    scene.domView?.setTouchSelectedTower(null);
    if (scene.touchTowerActionsEl) scene.touchTowerActionsEl.hidden = true;
    const selectedGroup = scene.controlsSelectedEl;
    if (selectedGroup) selectedGroup.classList.add("is-inactive");
    if (scene.selectedTowerPanelEl) scene.selectedTowerPanelEl.style.display = "none";
    if (scene.selectedTowerUpgradeBtnEl) scene.selectedTowerUpgradeBtnEl.disabled = true;
    if (scene.selectedTowerSellBtnEl) scene.selectedTowerSellBtnEl.disabled = true;
    if (scene.selectedTowerTargetBtnEl) scene.selectedTowerTargetBtnEl.disabled = true;
    return;
  }

  const selectedGroup = scene.controlsSelectedEl;
  if (selectedGroup) selectedGroup.classList.remove("is-inactive");
  if (scene.selectedTowerPanelEl) scene.selectedTowerPanelEl.style.display = "block";

  const t = scene.selectedTower;
  const def = TOWER_DEFS[t.type];
  const sps = 1000 / t.fireMs;
  const dps = t.damage * sps;
  const nextCost = getNextUpgradeCost(t);
  const nextText = nextCost === null ? "Max" : `$${nextCost}`;
  const refund = Math.floor((t.spent || 0) * 0.7);
  const targetLabel = getTargetModeLabel(t);
  scene.domView?.setTouchSelectedTower(t);
  if (scene.touchTowerActionsEl) scene.touchTowerActionsEl.hidden = false;
  if (scene.touchTowerNameEl) {
    scene.touchTowerNameEl.textContent = `${def.name} T${t.tier}`;
  }
  if (scene.touchTowerStatsEl) {
    scene.touchTowerStatsEl.textContent = formatTouchTowerStats(t);
  }
  if (scene.touchTargetValueEl) scene.touchTargetValueEl.textContent = targetLabel;
  if (scene.touchUpgradeValueEl) scene.touchUpgradeValueEl.textContent = nextText;
  if (scene.touchSellValueEl) scene.touchSellValueEl.textContent = `$${refund}`;
  scene.touchTargetBtnEl?.setAttribute("aria-label", `Target mode: ${targetLabel}`);
  scene.touchUpgradeBtnEl?.setAttribute(
    "aria-label",
    nextCost === null ? "Tower at maximum tier" : `Upgrade tower for ${nextCost}`
  );
  if (!scene.domView?.touchSellGuard?.armed) {
    scene.touchSellBtnEl?.setAttribute(
      "aria-label",
      `Sell tower for ${refund}; requires confirmation`
    );
  }
  if (scene.selectedTowerNameEl) scene.selectedTowerNameEl.textContent = `${def.name} (T${t.tier})`;
  if (scene.selectedTowerTargetEl) scene.selectedTowerTargetEl.textContent = targetLabel;
  if (scene.selectedTowerDmgEl) scene.selectedTowerDmgEl.textContent = `${t.damage}`;
  if (scene.selectedTowerFireEl) scene.selectedTowerFireEl.textContent = `${t.fireMs}ms (${round1(sps)}/s)`;
  if (scene.selectedTowerRangeEl) scene.selectedTowerRangeEl.textContent = `${t.range}`;
  if (scene.selectedTowerDpsEl) scene.selectedTowerDpsEl.textContent = `${round1(dps)}`;
  if (scene.selectedTowerUpgradeEl) scene.selectedTowerUpgradeEl.textContent = `${nextText}`;
  if (scene.selectedTowerSellEl) scene.selectedTowerSellEl.textContent = `$${refund}`;
  const canUpgrade = nextCost !== null && scene.money >= nextCost;
  if (scene.selectedTowerUpgradeBtnEl) scene.selectedTowerUpgradeBtnEl.disabled = !canUpgrade;
  if (scene.selectedTowerSellBtnEl) scene.selectedTowerSellBtnEl.disabled = false;
  if (scene.selectedTowerTargetBtnEl) scene.selectedTowerTargetBtnEl.disabled = false;
  if (scene.touchUpgradeBtnEl) scene.touchUpgradeBtnEl.disabled = !canUpgrade;
  scene.touchUpgradeBtnEl?.classList.toggle("is-affordable", canUpgrade);
  scene.touchUpgradeBtnEl?.classList.toggle("is-maxed", nextCost === null);
  if (scene.touchTargetBtnEl) scene.touchTargetBtnEl.disabled = false;
  if (scene.touchSellBtnEl) scene.touchSellBtnEl.disabled = false;
}

class HudController {
  constructor(scene) {
    this.scene = scene;
  }

  showToast(message, duration) {
    showToast(this.scene, message, duration);
  }

  update() {
    updateUI(this.scene);
  }

  showTransition(text, tone, duration) {
    showTransitionBanner(this.scene, text, tone, duration);
  }

  clearTransition() {
    clearTransitionBanner(this.scene);
  }

  destroy() {
    this.clearTransition();
  }
}

export { HudController, formatHudText, formatTouchTowerStats };

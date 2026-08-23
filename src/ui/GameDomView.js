import { TouchSellGuard } from "./TouchSellGuard.js";

class GameDomView {
  constructor(root = document) {
    this.root = root;
    this.listeners = [];
    this.emphasisTimer = null;
    this.touchSelectedTower = null;
    this.touchSellGuard = null;
    this.refs = {
      controlsSelectedEl: root.getElementById("controls-selected"),
      controlsPlacementEl: root.getElementById("controls-placement"),
      selectedTowerPanelEl: root.getElementById("selected-tower-panel"),
      selectedTowerNameEl: root.getElementById("tower-name"),
      selectedTowerTargetEl: root.getElementById("tower-target"),
      selectedTowerDmgEl: root.getElementById("tower-dmg"),
      selectedTowerFireEl: root.getElementById("tower-fire"),
      selectedTowerRangeEl: root.getElementById("tower-range"),
      selectedTowerDpsEl: root.getElementById("tower-dps"),
      selectedTowerUpgradeEl: root.getElementById("tower-upgrade"),
      selectedTowerSellEl: root.getElementById("tower-sell"),
      selectedTowerUpgradeBtnEl: root.getElementById("tower-upgrade-btn"),
      selectedTowerSellBtnEl: root.getElementById("tower-sell-btn"),
      selectedTowerTargetBtnEl: root.getElementById("tower-target-btn"),
      placementContextEl: root.getElementById("placement-context"),
      placementTowerNameEl: root.getElementById("placement-tower-name"),
      placementTowerCostEl: root.getElementById("placement-tower-cost"),
      placementTowerRangeEl: root.getElementById("placement-tower-range"),
      placementValidityEl: root.getElementById("placement-validity"),
      towerStripEl: root.getElementById("tower-strip"),
      touchControlsEl: root.getElementById("touch-controls"),
      touchStartWaveBtnEl: root.getElementById("touch-start-wave"),
      touchPlaceBtnEl: root.getElementById("touch-place"),
      touchCancelBtnEl: root.getElementById("touch-cancel"),
      touchPauseBtnEl: root.getElementById("touch-pause"),
      touchTowerActionsEl: root.getElementById("touch-tower-actions"),
      touchTowerNameEl: root.getElementById("touch-tower-name"),
      touchTowerStatsEl: root.getElementById("touch-tower-stats"),
      touchTargetBtnEl: root.getElementById("touch-target"),
      touchTargetValueEl: root.getElementById("touch-target-value"),
      touchUpgradeBtnEl: root.getElementById("touch-upgrade"),
      touchUpgradeValueEl: root.getElementById("touch-upgrade-value"),
      touchSellBtnEl: root.getElementById("touch-sell"),
      touchSellLabelEl: root.getElementById("touch-sell-label"),
      touchSellValueEl: root.getElementById("touch-sell-value"),
    };
    this.towerStripSlots = [];
  }

  listen(target, eventName, handler) {
    if (!target) return;
    target.addEventListener(eventName, handler);
    this.listeners.push(() => target.removeEventListener(eventName, handler));
  }

  bind({
    towerDefs,
    onSelectTowerType,
    onUpgrade,
    onSell,
    onTarget,
    onStartWave,
    onPlace,
    onCancel,
    onPause,
  }) {
    const towerStrip = this.refs.towerStripEl;
    if (towerStrip) {
      towerStrip.replaceChildren();
      for (const def of towerDefs) {
        const card = this.root.createElement("button");
        card.type = "button";
        card.className = "tower-card";
        card.dataset.towerKey = def.key;
        card.setAttribute("aria-label", `${def.name} tower`);
        const title = this.root.createElement("div");
        title.className = "tower-card-title";
        title.textContent = def.name;
        const description = this.root.createElement("div");
        description.className = "tower-card-desc";
        description.textContent = def.desc || "";
        const meta = this.root.createElement("div");
        meta.className = "tower-card-meta";
        const metaText = this.root.createElement("span");
        const keycap = this.root.createElement("span");
        keycap.className = "keycap";
        keycap.textContent = def.hotkey;
        meta.append(metaText, keycap);
        card.append(title, description, meta);
        this.listen(card, "click", () => onSelectTowerType(def.key));
        towerStrip.append(card);
        this.towerStripSlots.push({
          def,
          el: card,
          metaEl: metaText,
          keyEl: keycap,
          wasLocked: null,
        });
      }
    }
    this.listen(this.refs.selectedTowerUpgradeBtnEl, "click", onUpgrade);
    this.listen(this.refs.selectedTowerSellBtnEl, "click", onSell);
    this.listen(this.refs.selectedTowerTargetBtnEl, "click", onTarget);
    this.listen(this.refs.touchStartWaveBtnEl, "click", onStartWave);
    this.listen(this.refs.touchPlaceBtnEl, "click", onPlace);
    this.listen(this.refs.touchCancelBtnEl, "click", onCancel);
    this.listen(this.refs.touchPauseBtnEl, "click", onPause);
    this.listen(this.refs.touchTargetBtnEl, "click", onTarget);
    this.listen(this.refs.touchUpgradeBtnEl, "click", onUpgrade);
    this.touchSellGuard = new TouchSellGuard({
      button: this.refs.touchSellBtnEl,
      label: this.refs.touchSellLabelEl,
      onConfirm: onSell,
    });
    this.listen(this.refs.touchSellBtnEl, "click", () =>
      this.touchSellGuard.handle()
    );
  }

  setTouchSelectedTower(tower) {
    if (tower === this.touchSelectedTower) return;
    this.touchSelectedTower = tower;
    this.touchSellGuard?.reset();
  }

  emphasizeControls(duration = 1600) {
    const controls = this.root.getElementById("controls");
    if (!controls) return;
    controls.classList.remove("controls-emphasis");
    void controls.offsetWidth;
    controls.classList.add("controls-emphasis");
    if (this.emphasisTimer) clearTimeout(this.emphasisTimer);
    this.emphasisTimer = setTimeout(() => {
      controls.classList.remove("controls-emphasis");
      this.emphasisTimer = null;
    }, duration);
  }

  destroy() {
    this.listeners.splice(0).forEach((remove) => remove());
    if (this.emphasisTimer) clearTimeout(this.emphasisTimer);
    this.emphasisTimer = null;
    this.touchSellGuard?.destroy();
    this.touchSellGuard = null;
    this.touchSelectedTower = null;
    this.towerStripSlots = [];
  }
}

export { GameDomView };

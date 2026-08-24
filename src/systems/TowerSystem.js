import { TOWER_DEFS } from "../constants.js";
import { GRID, TOP_UI } from "../game/config.js";
import { snapX, snapY } from "../game/utils.js";
import {
  applyTowerTier,
  cycleTargetMode,
  getNextUpgradeCost,
} from "../game/towers.js";
import {
  getTowerBaseTextureKey,
  getTowerHeadTextureKey,
  getTowerTextureKey,
} from "../presentation/WorldRenderer.js";
import { showTowerPulse } from "../game/bullets.js";

const TOWER_SYSTEM_FIELDS = Object.freeze([
  "towers",
  "selectedTower",
  "isPlacing",
  "placeType",
  "ghost",
  "ghostValid",
  "ghostX",
  "ghostY",
]);
const TOUCH_TOWER_SELECT_RADIUS = 34;
const BASIC_ART_SIZE = Object.freeze({ 1: 40, 2: 42, 3: 46 });
const BASIC_BASE_SIZE = Object.freeze({ 1: 64, 2: 67, 3: 70 });
const BASIC_HEAD_SIZE = 128;
const PLACEMENT_GHOST_ALPHA = 0.44;

class TowerSystem {
  constructor({ scene, world, runController }) {
    this.scene = scene;
    this.world = world;
    this.runController = runController;
    this.towers = [];
    this.selectedTower = null;
    this.isPlacing = false;
    this.placeType = "basic";
    this.ghost = null;
    this.ghostValid = false;
    this.ghostX = 0;
    this.ghostY = 0;
    this.didShowPlaceToast = false;
  }

  getTowerUnlockWave(type) {
    return TOWER_DEFS[type]?.unlockWave ?? 1;
  }

  isTowerUnlocked(type) {
    return this.scene.wave >= this.getTowerUnlockWave(type);
  }

  getPlacementKeyHint() {
    const def = this.getPlaceDef();
    return def.hotkey || "1 / 2 / 3 / 4";
  }

  trySetPlaceType(type) {
    if (!TOWER_DEFS[type]) return;
    if (!this.isTowerUnlocked(type)) {
      this.scene.showToast(
        `${TOWER_DEFS[type].name} unlocks at Wave ${this.getTowerUnlockWave(type)}.`,
        1700
      );
      return;
    }
    this.setPlaceType(type);
    if (!this.isPlacing) this.setPlacement(true);
  }

  getPlaceDef() {
    return TOWER_DEFS[this.placeType] || TOWER_DEFS.basic;
  }

  setPlaceType(type) {
    if (!TOWER_DEFS[type] || !this.isTowerUnlocked(type)) return;
    this.placeType = type;
    this.syncTowerStripSelection();
    if (this.ghost) {
      this.ghost.setTexture(getTowerTextureKey(type));
      this.refreshGhostVisual();
    }
  }

  syncTowerStripSelection() {
    for (const slot of this.scene.towerStripSlots || []) {
      slot.el.classList.toggle(
        "is-selected",
        this.isPlacing && slot.def.key === this.placeType
      );
    }
  }

  enterPlacementModeIfNeeded() {
    if (!this.isPlacing) this.setPlacement(true);
  }

  togglePlacement() {
    this.setPlacement(!this.isPlacing);
  }

  setPlacement(on) {
    if (on === this.isPlacing) return;
    this.isPlacing = on;
    this.scene.controlsPlacementEl?.classList.toggle("is-active", on);
    if (on) {
      this.clearSelection();
      if (!this.didShowPlaceToast) {
        this.didShowPlaceToast = true;
        const touchUi = globalThis.document?.documentElement?.classList.contains("touch-ui") ?? false;
        this.scene.showToast(
          touchUi
            ? "Placement active. Drag to aim, then tap Place."
            : `Placement: press ${this.getPlacementKeyHint()} to switch tower type.`,
          2600
        );
      }
      this.ghost = this.scene.add.image(
        0,
        0,
        getTowerTextureKey(this.placeType)
      );
      this.ghost.setDepth(9000).setAlpha(PLACEMENT_GHOST_ALPHA);
      const pointer = this.scene.input.activePointer;
      if (pointer) {
        this.ghostX = Number.NaN;
        this.ghostY = Number.NaN;
        this.updateGhost(pointer.worldX, pointer.worldY);
      }
      this.world.hideRange();
      this.syncTowerStripSelection();
      return;
    }
    this.ghost?.destroy();
    this.ghost = null;
    this.scene.placeHint.setText("");
    this.world.hideRange();
    this.syncTowerStripSelection();
  }

  selectTower(tower) {
    this.selectedTower = tower;
    this.world.showTowerRange(tower, 0x00ffff);
  }

  emphasizeTower(tower) {
    const tierIndex = Math.max(0, (tower?.tier ?? 1) - 1);
    showTowerPulse(
      this.scene,
      tower,
      TOWER_DEFS[tower?.type]?.tiers?.[tierIndex]?.tint ?? 0x39ff8f
    );
  }

  clearSelection() {
    this.selectedTower = null;
    this.world.hideRange();
  }

  updateGhost(worldX, worldY) {
    const x = snapX(worldX);
    const y = snapY(worldY);
    if (x === this.ghostX && y === this.ghostY) return;
    this.ghostX = x;
    this.ghostY = y;
    this.ghostValid = this.canPlaceTowerAt(x, y);
    this.refreshGhostVisual();
  }

  refreshGhostVisual() {
    if (!this.ghost) return;
    const def = this.getPlaceDef();
    const tier0 = def.tiers[0];
    this.ghost.setPosition(this.ghostX, this.ghostY);
    const color = this.ghostValid ? tier0.tint : 0xff4d6d;
    if (this.placeType === "basic" && (this.ghost.width ?? 34) > 34) {
      if (this.ghostValid) this.ghost.clearTint();
      else this.ghost.setTint(color);
      this.ghost.setDisplaySize(BASIC_ART_SIZE[1], BASIC_ART_SIZE[1]);
    } else {
      this.ghost.setTint(color);
      this.ghost.setScale(tier0.scale ?? 1);
    }
    this.world.showGhostRing(
      this.ghostX,
      this.ghostY,
      tier0.range,
      this.ghostValid ? 0x39ff8f : 0xff4d6d
    );
    this.updatePlaceHint();
  }

  updatePlaceHint() {
    if (!this.isPlacing) return;
    const touchUi = globalThis.document?.documentElement?.classList.contains("touch-ui") ?? false;
    if (touchUi) {
      this.scene.placeHint.setText("");
      return;
    }
    const def = this.getPlaceDef();
    const tier0 = def.tiers[0];
    const validity = this.ghostValid ? "OK" : "BLOCKED";
    const funds = this.scene.money < tier0.cost ? " (not enough $)" : "";
    this.scene.placeHint.setText(
      `Placing: ${def.name} [${def.hotkey}]  Cost: $${tier0.cost}  Range: ${tier0.range}  ${validity}${funds}   (${this.getPlacementKeyHint()}: switch)`
    );
  }

  getTowerAt(worldX, worldY, { touch = false } = {}) {
    const x = snapX(worldX);
    const y = snapY(worldY);
    const exact = this.towers.find((tower) => tower.x === x && tower.y === y);
    if (exact || !touch) return exact;
    let nearest = null;
    let nearestDistanceSq = TOUCH_TOWER_SELECT_RADIUS ** 2;
    for (const tower of this.towers) {
      const distanceSq = (tower.x - worldX) ** 2 + (tower.y - worldY) ** 2;
      if (distanceSq > nearestDistanceSq) continue;
      nearest = tower;
      nearestDistanceSq = distanceSq;
    }
    return nearest;
  }

  getPlacementStatusAt(x, y) {
    const tier0 = this.getPlaceDef().tiers[0];
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return { valid: false, reason: "Aim on grid" };
    }
    if (this.scene.money < tier0.cost) {
      return { valid: false, reason: `Need $${tier0.cost}` };
    }
    if (
      x < GRID / 2 ||
      y < TOP_UI + GRID / 2 ||
      x > this.scene.scale.width - GRID / 2 ||
      y > this.scene.scale.height - GRID / 2
    ) {
      return { valid: false, reason: "Outside grid" };
    }
    if (this.world.isOnPath(x, y)) return { valid: false, reason: "Path blocked" };
    if (this.towers.some((tower) => tower.x === x && tower.y === y)) {
      return { valid: false, reason: "Occupied" };
    }
    return { valid: true, reason: "Ready" };
  }

  canPlaceTowerAt(x, y) {
    return this.getPlacementStatusAt(x, y).valid;
  }

  getNextUpgradeCost(tower) {
    return getNextUpgradeCost(tower);
  }

  applyTowerTier(tower, tierIndex) {
    applyTowerTier(tower, tierIndex);
    this.refreshTowerArt(tower);
  }

  refreshTowerArt(tower) {
    const tier = TOWER_DEFS[tower.type]?.tiers?.[tower.tier - 1];
    tower.visualTint = tier?.tint ?? 0xffffff;
    if (tower.type !== "basic") return;
    const baseKey = getTowerBaseTextureKey(tower.type);
    const headKey = getTowerHeadTextureKey(tower.type, tower.tier);
    if (
      this.scene.textures?.exists?.(baseKey) &&
      this.scene.textures?.exists?.(headKey)
    ) {
      const baseSize = BASIC_BASE_SIZE[tower.tier] ?? BASIC_BASE_SIZE[1];
      tower.sprite
        .setTexture(baseKey)
        .clearTint()
        .setDisplaySize(baseSize, baseSize)
        .setDepth(12);
      if (!tower.head) {
        tower.head = this.scene.add.image(tower.x, tower.y, headKey);
      }
      tower.head
        .setTexture(headKey)
        .clearTint()
        .setPosition(tower.x, tower.y)
        .setDisplaySize(BASIC_HEAD_SIZE, BASIC_HEAD_SIZE)
        .setDepth(13);
      return;
    }
    const textureKey = getTowerTextureKey(tower.type, tower.tier);
    if (!this.scene.textures?.exists?.(textureKey)) return;
    tower.sprite.setTexture(textureKey);
    if ((tower.sprite.width ?? 34) <= 34) return;
    const size = BASIC_ART_SIZE[tower.tier] ?? BASIC_ART_SIZE[1];
    tower.sprite.clearTint().setDisplaySize(size, size);
  }

  tryUpgradeTower(tower) {
    const nextCost = getNextUpgradeCost(tower);
    if (nextCost === null || !this.runController.spend(nextCost)) return false;
    tower.spent += nextCost;
    this.applyTowerTier(tower, tower.tier);
    if (this.selectedTower === tower) {
      this.world.showTowerRange(tower, 0x00ffff);
    }
    showTowerPulse(
      this.scene,
      tower,
      TOWER_DEFS[tower.type]?.tiers?.[tower.tier - 1]?.tint ?? 0x39ff8f
    );
    this.scene.playSfx("upgrade");
    return true;
  }

  tryPlaceTowerAt(x, y) {
    if (!this.canPlaceTowerAt(x, y)) return null;
    const def = this.getPlaceDef();
    const tier0 = def.tiers[0];
    if (!this.runController.spend(tier0.cost)) return null;
    const initialTexture =
      def.key === "basic"
        ? getTowerBaseTextureKey(def.key)
        : getTowerTextureKey(def.key, 1);
    const sprite = this.scene.add.image(
      x,
      y,
      initialTexture
    );
    const tower = {
      x,
      y,
      type: def.key,
      tier: 1,
      damage: tier0.damage,
      range: tier0.range,
      fireMs: tier0.fireMs,
      nextShotAt: 0,
      spent: tier0.cost,
      targetMode: def.defaultTargetMode ?? "first",
      sprite,
      head: null,
      badge: null,
    };
    if (def.key === "laser") {
      tower.beamTickMs = tier0.fireMs;
      tower.beamAcc = 0;
      tower.lockTarget = null;
      tower.lockMs = 0;
      tower.beam = this.scene.add.graphics();
      tower.beam.setDepth(70).setVisible(false);
    }
    sprite.setTint(tier0.tint).setScale(tier0.scale ?? 1);
    this.refreshTowerArt(tower);
    this.towers.push(tower);
    this.selectTower(tower);
    showTowerPulse(this.scene, tower, tier0.tint);
    this.scene.playSfx("place");
    if (this.isPlacing) this.setPlacement(false);
    return tower;
  }

  trySellTower(tower) {
    if (!tower) return false;
    const index = this.towers.indexOf(tower);
    if (index === -1) return false;
    const refund = Math.floor((tower.spent || 0) * 0.7);
    tower.badge?.destroy();
    tower.beam?.destroy();
    tower.head?.destroy();
    tower.sprite.destroy();
    this.towers.splice(index, 1);
    this.runController.earn(refund);
    if (this.selectedTower === tower) this.clearSelection();
    this.scene.playSfx("sell");
    return true;
  }

  cycleTargetMode(tower) {
    cycleTargetMode(tower);
  }

  destroy() {
    this.ghost?.destroy();
    for (const tower of this.towers) {
      tower.beam?.destroy();
      tower.badge?.destroy();
      tower.head?.destroy();
      tower.sprite?.destroy();
    }
    this.towers = [];
    this.selectedTower = null;
    this.scene = null;
    this.world = null;
  }
}

function attachTowerSystem(owner, towerSystem) {
  owner.towerSystem = towerSystem;
  for (const field of TOWER_SYSTEM_FIELDS) {
    Object.defineProperty(owner, field, {
      configurable: true,
      enumerable: true,
      get() {
        return this.towerSystem[field];
      },
      set(value) {
        this.towerSystem[field] = value;
      },
    });
  }
}

export { TOWER_SYSTEM_FIELDS, TowerSystem, attachTowerSystem };

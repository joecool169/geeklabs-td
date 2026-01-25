import { TOWER_DEFS } from '../constants';
import { dist2, segCircleHit } from './utils';

function getNextUpgradeCost(t) {
  const def = TOWER_DEFS[t.type];
  if (!def) return null;
  if (t.tier >= def.tiers.length) return null;
  return def.tiers[t.tier]?.cost ?? null;
}

function applyTowerTier(t, tierIdx) {
  const def = TOWER_DEFS[t.type];
  const tier = def.tiers[tierIdx];
  t.tier = tierIdx + 1;
  t.damage = tier.damage;
  t.range = tier.range;
  t.fireMs = tier.fireMs;
  t.sprite.setTint(tier.tint);
  t.sprite.setScale(tier.scale ?? 1);
  if (t.badge) t.badge.setDepth(t.sprite.depth + 1);
}

function tryUpgradeTower(t) {
  const nextCost = getNextUpgradeCost(t);
  if (nextCost === null) return;
  if (this.money < nextCost) return;
  this.money -= nextCost;
  t.spent += nextCost;
  applyTowerTier(t, t.tier);
  if (this.selectedTower === t) showRangeRing(t, 0x00ffff);
}

function tryPlaceTowerAt(x, y) {
  if (!canPlaceTowerAt(x, y)) return;
  const def = getPlaceDef();
  const tier0 = def.tiers[0];
  this.money -= tier0.cost;
  const img = this.add.image(x, y, getTowerTextureKey(def.key));
  let badge = null;
  if (def.key === "sniper") {
    badge = this.add.text(x, y, "S", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#0b0f14",
      backgroundColor: "#ffc857",
      padding: { x: 4, y: 2 },
    });
    badge.setOrigin(0.5, 0.5);
    badge.setDepth(img.depth + 1);
  }
  const t = {
    x,
    y,
    type: def.key,
    tier: 1,
    damage: tier0.damage,
    range: tier0.range,
    fireMs: tier0.fireMs,
    nextShotAt: 0,
    spent: tier0.cost,
    targetMode: "close",
    sprite: img,
    badge,
  };
  img.setTint(tier0.tint);
  img.setScale(tier0.scale ?? 1);
  this.towers.push(t);
  selectTower(t);
}

function trySellTower(t) {
  if (!t) return;
  const idx = this.towers.indexOf(t);
  if (idx === -1) return;
  const refund = Math.floor((t.spent || 0) * 0.7);
  if (t.badge) t.badge.destroy();
  t.sprite.destroy();
  this.towers.splice(idx, 1);
  this.money += refund;
  if (this.selectedTower === t) clearSelection();
}

function cycleTargetMode(t) {
  t.targetMode = nextInCycle(TARGET_MODES, t.targetMode);
}

export { getNextUpgradeCost, applyTowerTier, tryUpgradeTower, tryPlaceTowerAt, trySellTower, cycleTargetMode };

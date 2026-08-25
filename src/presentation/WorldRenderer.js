import { ENEMY_DEFS, TOWER_DEFS } from "../constants.js";
import { GRID, TOP_UI } from "../game/config.js";
import {
  drawEnemyTexture,
  getEnemyTextureKey,
} from "../game/enemies.js";
import { getTowerArtStandard } from "./artStandards.js";

const RANGE_FILL_ALPHA = Object.freeze({
  selected: 0.035,
  valid: 0.04,
  blocked: 0.045,
});
const RANGE_LINE_ALPHA = Object.freeze({
  selected: 0.55,
  valid: 0.55,
  blocked: 0.6,
});
const PLAYFIELD_TEXTURE_KEY = "playfield_floor";
const COMMAND_CORE_TEXTURE_KEY = "command_core";
const DEPLOYMENT_GATE_TEXTURE_KEY = "deployment_gate";

function createDefaultPath() {
  return [
    { x: -120, y: 120 + TOP_UI - GRID / 2 },
    { x: 980, y: 120 + TOP_UI - GRID / 2 },
    { x: 980, y: 520 + TOP_UI - GRID / 2 },
    { x: 140, y: 520 + TOP_UI - GRID / 2 },
    { x: 140, y: 320 + TOP_UI - GRID / 2 },
    { x: 860, y: 320 + TOP_UI - GRID / 2 },
  ];
}

function pointToSegmentDistance(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const ab2 = abx * abx + aby * aby;
  const t =
    ab2 === 0
      ? 0
      : Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
  const cx = ax + t * abx;
  const cy = ay + t * aby;
  return Math.hypot(px - cx, py - cy);
}

function getCommandCorePosition(path, offset = 0) {
  const end = path[path.length - 1] ?? { x: 0, y: 0 };
  const previous = path[path.length - 2] ?? end;
  const dx = end.x - previous.x;
  const dy = end.y - previous.y;
  const length = Math.hypot(dx, dy) || 1;
  return {
    x: end.x + (dx / length) * offset,
    y: end.y + (dy / length) * offset,
  };
}

function getPathPointAtDistance(path, distance) {
  let remaining = Math.max(0, distance);
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const length = Math.hypot(end.x - start.x, end.y - start.y) || 1;
    if (remaining <= length) {
      const ratio = remaining / length;
      return {
        x: start.x + (end.x - start.x) * ratio,
        y: start.y + (end.y - start.y) * ratio,
      };
    }
    remaining -= length;
  }
  return path[path.length - 1] ?? { x: 0, y: 0 };
}

const getDeploymentGatePosition = (path) => getPathPointAtDistance(path, 160);

function getPathHardwareMarkers(path, spacing = 96) {
  const markers = [];
  for (let index = 0; index < path.length - 1; index += 1) {
    const start = path[index];
    const end = path[index + 1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    for (let distance = spacing / 2; distance < length; distance += spacing) {
      markers.push({
        x: start.x + (dx / length) * distance,
        y: start.y + (dy / length) * distance,
        nx: -dy / length,
        ny: dx / length,
      });
    }
  }
  return markers;
}

function getBasicTowerArtOrigins(tier = 1) {
  const headOrigins = {
    1: { x: 0.485, y: 0.492 },
    2: { x: 0.455, y: 0.492 },
    3: { x: 0.49, y: 0.49 },
  };
  return {
    base: { x: 0.5, y: 0.344 },
    head: headOrigins[tier] ?? headOrigins[1],
  };
}

function getTowerArtOrigins(type, tier = 1) {
  if (type === "basic") return getBasicTowerArtOrigins(tier);
  return {
    base: getTowerArtStandard(type).baseOrigin,
    head: { x: 0.5, y: 0.5 },
  };
}

const getTowerTextureKey = (type, tier = 1) =>
  type === "basic" ? `tower_basic_t${tier}` : `tower_${type}`;
const getTowerBaseTextureKey = (type) => `tower_${type}_base`;
const getTowerHeadTextureKey = (type, tier = 1) =>
  `tower_${type}_head_t${tier}`;

function drawBasicBaseTexture(graphics) {
  graphics.clear();
  graphics.fillStyle(0x263448, 1);
  graphics.fillCircle(32, 36, 22);
  graphics.lineStyle(3, 0x3bd3ff, 0.75);
  graphics.strokeCircle(32, 22, 12);
  graphics.fillStyle(0x0b0f14, 1);
  graphics.fillCircle(32, 22, 7);
}

function drawBasicHeadTexture(graphics, tier = 1) {
  const length = 30 + tier * 5;
  const { head } = getBasicTowerArtOrigins(tier);
  const pivotX = head.x * 128;
  const pivotY = head.y * 128;
  graphics.clear();
  graphics.fillStyle(0x34465d, 1);
  graphics.fillRoundedRect(pivotX - 16, pivotY - 12, length, 24, 6);
  graphics.lineStyle(2, 0x3bd3ff, 0.85);
  graphics.strokeCircle(pivotX, pivotY, 12 + tier);
  graphics.fillStyle(0x8deeff, 1);
  graphics.fillRoundedRect(pivotX, pivotY - 5, length, 10, 4);
}

function drawTowerTexture(graphics, type) {
  const dark = 0x0b0f14;
  graphics.clear();
  graphics.fillStyle(0xffffff, 1);
  graphics.lineStyle(2, dark, 1);

  if (type === "rapid") {
    graphics.fillRect(9, 3, 6, 13);
    graphics.strokeRect(9, 3, 6, 13);
    graphics.fillRect(19, 3, 6, 13);
    graphics.strokeRect(19, 3, 6, 13);
    graphics.fillCircle(17, 20, 11);
    graphics.strokeCircle(17, 20, 11);
    graphics.fillStyle(dark, 1);
    graphics.fillRect(11, 5, 2, 8);
    graphics.fillRect(21, 5, 2, 8);
    graphics.fillCircle(17, 20, 3);
    return;
  }
  if (type === "sniper") {
    graphics.fillRect(15, 1, 4, 19);
    graphics.strokeRect(15, 1, 4, 19);
    graphics.fillRect(10, 5, 14, 4);
    graphics.strokeRect(10, 5, 14, 4);
    graphics.fillCircle(17, 22, 9);
    graphics.strokeCircle(17, 22, 9);
    graphics.fillStyle(dark, 1);
    graphics.fillCircle(17, 22, 3);
    return;
  }
  if (type === "laser") {
    graphics.fillTriangle(17, 2, 5, 17, 17, 32);
    graphics.fillTriangle(17, 2, 29, 17, 17, 32);
    graphics.lineBetween(17, 2, 5, 17);
    graphics.lineBetween(5, 17, 17, 32);
    graphics.lineBetween(17, 32, 29, 17);
    graphics.lineBetween(29, 17, 17, 2);
    graphics.fillStyle(dark, 1);
    graphics.fillTriangle(17, 8, 11, 17, 17, 26);
    graphics.fillTriangle(17, 8, 23, 17, 17, 26);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(17, 17, 3);
    return;
  }
  graphics.fillRect(12, 3, 10, 8);
  graphics.strokeRect(12, 3, 10, 8);
  graphics.fillRect(5, 9, 24, 22);
  graphics.strokeRect(5, 9, 24, 22);
  graphics.fillStyle(dark, 1);
  graphics.fillRect(10, 14, 14, 12);
  graphics.fillStyle(0xffffff, 1);
  graphics.fillCircle(17, 20, 4);
}

class WorldRenderer {
  constructor(scene, path = createDefaultPath()) {
    this.scene = scene;
    this.path = path;
    this.graphics = null;
    this.floor = null;
    this.rangeFill = null;
    this.rangeRing = null;
    this.commandCore = null;
    this.deploymentGate = null;
  }

  create() {
    this.makeTextures();
    this.drawFloor();
    this.graphics = this.scene.add.graphics();
    this.drawGrid();
    this.drawPath();
    this.drawDeploymentGate();
    this.drawCommandCore();
    this.rangeFill = this.scene.add.graphics().setDepth(-1).setVisible(false);
    this.rangeRing = this.scene.add.graphics().setDepth(10).setVisible(false);
  }

  drawFloor() {
    if (!this.scene.textures.exists(PLAYFIELD_TEXTURE_KEY)) return;
    const width = this.scene.scale.width;
    const height = this.scene.scale.height - TOP_UI;
    this.floor = this.scene.add
      .tileSprite(0, TOP_UI, width, height, PLAYFIELD_TEXTURE_KEY)
      .setOrigin(0)
      .setDepth(-20)
      .setAlpha(0.38);
    this.floor.setTileScale(0.72);
  }

  makeTextures() {
    const graphics = this.scene.add.graphics();
    for (const type of Object.keys(TOWER_DEFS)) {
      const tiers = type === "basic" ? [1, 2, 3] : [1];
      for (const tier of tiers) {
        const key = getTowerTextureKey(type, tier);
        if (this.scene.textures.exists(key)) continue;
        drawTowerTexture(graphics, type);
        graphics.generateTexture(key, 34, 34);
      }
    }
    if (!this.scene.textures.exists(getTowerBaseTextureKey("basic"))) {
      drawBasicBaseTexture(graphics);
      graphics.generateTexture(getTowerBaseTextureKey("basic"), 64, 64);
    }
    for (const tier of [1, 2, 3]) {
      const headKey = getTowerHeadTextureKey("basic", tier);
      if (this.scene.textures.exists(headKey)) continue;
      drawBasicHeadTexture(graphics, tier);
      graphics.generateTexture(headKey, 128, 128);
    }
    for (const type of Object.keys(ENEMY_DEFS)) {
      const key = getEnemyTextureKey(type);
      if (this.scene.textures.exists(key)) continue;
      drawEnemyTexture(graphics, type);
      graphics.generateTexture(key, 24, 24);
    }
    const textureDefinitions = [
      ["projectile_basic", 10, 6, () => {
        graphics.clear(); graphics.fillStyle(0xffffff, 1); graphics.fillRoundedRect(0, 1, 10, 4, 2);
      }],
      ["projectile_rapid", 6, 4, () => {
        graphics.clear(); graphics.fillStyle(0xffffff, 1); graphics.fillRect(0, 1, 6, 2);
      }],
      ["impact_basic", 12, 12, () => {
        graphics.clear(); graphics.lineStyle(2, 0xffffff, 0.9); graphics.strokeCircle(6, 6, 4);
      }],
      ["impact_rapid", 6, 6, () => {
        graphics.clear(); graphics.fillStyle(0xffffff, 1); graphics.fillRect(2, 0, 2, 6);
      }],
      ["impact_sniper", 14, 14, () => {
        graphics.clear(); graphics.lineStyle(1, 0xffffff, 1); graphics.lineBetween(1, 7, 13, 7); graphics.lineBetween(7, 1, 7, 13); graphics.strokeCircle(7, 7, 3);
      }],
      ["impact_laser", 10, 10, () => {
        graphics.clear(); graphics.lineStyle(1, 0xffffff, 1); graphics.lineBetween(5, 1, 9, 5); graphics.lineBetween(9, 5, 5, 9); graphics.lineBetween(5, 9, 1, 5); graphics.lineBetween(1, 5, 5, 1); graphics.fillStyle(0xffffff, 1); graphics.fillCircle(5, 5, 1);
      }],
    ];
    for (const [key, width, height, draw] of textureDefinitions) {
      if (this.scene.textures.exists(key)) continue;
      draw();
      graphics.generateTexture(key, width, height);
    }
    if (!this.scene.textures.exists(COMMAND_CORE_TEXTURE_KEY)) {
      graphics.clear();
      graphics.fillStyle(0x263448, 1);
      graphics.fillCircle(32, 32, 28);
      graphics.lineStyle(3, 0x3bd3ff, 0.9);
      graphics.strokeCircle(32, 32, 19);
      graphics.fillStyle(0x3bd3ff, 1);
      graphics.fillCircle(32, 32, 8);
      graphics.generateTexture(COMMAND_CORE_TEXTURE_KEY, 64, 64);
    }
    graphics.destroy();
  }

  drawCommandCore() {
    if (!this.scene.textures.exists(COMMAND_CORE_TEXTURE_KEY)) return;
    const position = getCommandCorePosition(this.path);
    this.commandCore = this.scene.add
      .image(position.x, position.y, COMMAND_CORE_TEXTURE_KEY)
      .setDepth(8)
      .setDisplaySize(70, 70);
  }

  drawDeploymentGate() {
    if (!this.scene.textures.exists(DEPLOYMENT_GATE_TEXTURE_KEY)) return;
    const position = getDeploymentGatePosition(this.path);
    this.deploymentGate = this.scene.add
      .image(position.x, position.y, DEPLOYMENT_GATE_TEXTURE_KEY)
      .setDepth(7)
      .setDisplaySize(104, 52);
  }

  setCoreIntegrity(lives, startingLives = 20) {
    if (!this.commandCore) return;
    const ratio = Math.max(0, Number(lives) || 0) / Math.max(1, startingLives);
    if (ratio <= 0) this.commandCore.setTint(0xff4d6d).setAlpha(0.62);
    else if (ratio <= 0.25) this.commandCore.setTint(0xff6b74).setAlpha(0.9);
    else if (ratio <= 0.5) this.commandCore.setTint(0xffc857).setAlpha(1);
    else this.commandCore.clearTint().setAlpha(1);
  }

  showCoreImpact(lives, startingLives = 20) {
    this.setCoreIntegrity(lives, startingLives);
    if (!this.commandCore || !this.scene.textures.exists("impact_basic")) return;
    const impact = this.scene.add
      .image(this.commandCore.x, this.commandCore.y, "impact_basic")
      .setDepth(30)
      .setTint(0xff6b74)
      .setScale(1.5)
      .setAlpha(0.95);
    this.scene.tweens.add({
      targets: impact,
      alpha: 0,
      scale: 4.2,
      duration: 180,
      onComplete: () => impact.destroy(),
    });
  }

  drawGrid() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const gridWidth = Math.floor(width / GRID) * GRID;
    const gridX = Math.floor((width - gridWidth) / 2);
    const gridRight = gridX + gridWidth - 1;
    this.graphics.lineStyle(1, 0x142033, 1);
    for (let x = 0; x < gridWidth; x += GRID) {
      this.graphics.lineBetween(gridX + x + 0.5, TOP_UI, gridX + x + 0.5, height);
    }
    this.graphics.lineStyle(2, 0x142033, 1);
    this.graphics.lineBetween(gridRight + 0.5, TOP_UI, gridRight + 0.5, height);
    this.graphics.lineStyle(1, 0x142033, 1);
    for (let y = TOP_UI; y <= height; y += GRID) {
      this.graphics.lineBetween(gridX, y + 0.5, gridRight, y + 0.5);
    }
    this.graphics.lineStyle(2, 0x294a6a, 1);
    this.graphics.lineBetween(0, TOP_UI, width, TOP_UI);
  }

  drawPath() {
    this.graphics.lineStyle(18, 0x080d13, 0.96);
    for (let i = 0; i < this.path.length - 1; i += 1) {
      const a = this.path[i];
      const b = this.path[i + 1];
      this.graphics.lineBetween(a.x, a.y, b.x, b.y);
    }
    this.graphics.lineStyle(12, 0x243142, 1);
    for (let i = 0; i < this.path.length - 1; i += 1) {
      const a = this.path[i];
      const b = this.path[i + 1];
      this.graphics.lineBetween(a.x, a.y, b.x, b.y);
    }
    this.graphics.lineStyle(1, 0x3bd3ff, 0.18);
    for (let i = 0; i < this.path.length - 1; i += 1) {
      const a = this.path[i];
      const b = this.path[i + 1];
      this.graphics.lineBetween(a.x, a.y, b.x, b.y);
    }
    this.graphics.fillStyle(0x34465d, 1);
    for (const point of this.path) this.graphics.fillCircle(point.x, point.y, 8);
    this.graphics.fillStyle(0x0b121b, 1);
    for (const point of this.path) this.graphics.fillCircle(point.x, point.y, 3);

    this.graphics.lineStyle(2, 0xd8a96a, 0.64);
    for (const point of this.path.slice(1, -1)) {
      this.graphics.lineBetween(point.x - 7, point.y - 7, point.x - 2, point.y - 2);
      this.graphics.lineBetween(point.x + 2, point.y + 2, point.x + 7, point.y + 7);
    }

    this.graphics.lineStyle(2, 0x64748b, 0.26);
    for (const marker of getPathHardwareMarkers(this.path)) {
      this.graphics.lineBetween(
        marker.x - marker.nx * 6,
        marker.y - marker.ny * 6,
        marker.x + marker.nx * 6,
        marker.y + marker.ny * 6
      );
    }
  }

  isOnPath(x, y, radius = 24) {
    for (let i = 0; i < this.path.length - 1; i += 1) {
      const a = this.path[i];
      const b = this.path[i + 1];
      if (pointToSegmentDistance(x, y, a.x, a.y, b.x, b.y) <= radius) {
        return true;
      }
    }
    return false;
  }

  showGhostRing(x, y, range, color) {
    const blocked = color === 0xff4d6d;
    this.rangeFill.clear();
    this.rangeFill.fillStyle(
      color,
      blocked ? RANGE_FILL_ALPHA.blocked : RANGE_FILL_ALPHA.valid
    );
    this.rangeFill.fillCircle(x, y, range).setVisible(true);
    this.rangeRing.clear();
    this.rangeRing.lineStyle(
      1,
      color,
      blocked ? RANGE_LINE_ALPHA.blocked : RANGE_LINE_ALPHA.valid
    );
    this.rangeRing.strokeCircle(x, y, range);
    this.rangeRing.lineStyle(2, color, 0.9);
    this.rangeRing.lineBetween(x - 8, y, x - 3, y);
    this.rangeRing.lineBetween(x + 3, y, x + 8, y);
    this.rangeRing.lineBetween(x, y - 8, x, y - 3);
    this.rangeRing.lineBetween(x, y + 3, x, y + 8);
    this.rangeRing.strokeCircle(x, y, 2).setVisible(true);
  }

  showTowerRange(tower, color) {
    this.rangeFill.clear();
    this.rangeFill.fillStyle(color, RANGE_FILL_ALPHA.selected);
    this.rangeFill.fillCircle(tower.x, tower.y, tower.range).setVisible(true);
    this.rangeRing.clear();
    this.rangeRing.lineStyle(1, color, RANGE_LINE_ALPHA.selected);
    this.rangeRing.strokeCircle(tower.x, tower.y, tower.range);
    this.drawSelectionAccent(
      tower.x,
      tower.y,
      color,
      getTowerArtStandard(tower.type).selectionRadius
    );
    this.rangeRing.setVisible(true);
  }

  drawSelectionAccent(x, y, color, radius = 20) {
    const outer = radius;
    const inner = radius - 6;
    this.rangeRing.lineStyle(2, color, 0.95);
    this.rangeRing.lineBetween(x - outer, y - outer, x - inner, y - outer);
    this.rangeRing.lineBetween(x - outer, y - outer, x - outer, y - inner);
    this.rangeRing.lineBetween(x + inner, y - outer, x + outer, y - outer);
    this.rangeRing.lineBetween(x + outer, y - outer, x + outer, y - inner);
    this.rangeRing.lineBetween(x - outer, y + outer, x - inner, y + outer);
    this.rangeRing.lineBetween(x - outer, y + inner, x - outer, y + outer);
    this.rangeRing.lineBetween(x + inner, y + outer, x + outer, y + outer);
    this.rangeRing.lineBetween(x + outer, y + inner, x + outer, y + outer);
  }

  hideRange() {
    this.rangeFill.setVisible(false).clear();
    this.rangeRing.setVisible(false).clear();
  }

  destroy() {
    this.commandCore?.destroy();
    this.deploymentGate?.destroy();
    this.floor?.destroy();
    this.graphics?.destroy();
    this.rangeFill?.destroy();
    this.rangeRing?.destroy();
    this.scene = null;
  }
}

export {
  COMMAND_CORE_TEXTURE_KEY,
  DEPLOYMENT_GATE_TEXTURE_KEY,
  PLAYFIELD_TEXTURE_KEY,
  WorldRenderer,
  createDefaultPath,
  drawTowerTexture,
  getTowerTextureKey,
  getTowerBaseTextureKey,
  getTowerHeadTextureKey,
  getBasicTowerArtOrigins,
  getTowerArtOrigins,
  getCommandCorePosition,
  getDeploymentGatePosition,
  getPathHardwareMarkers,
  getPathPointAtDistance,
  pointToSegmentDistance,
};

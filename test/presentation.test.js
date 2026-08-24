import test from "node:test";
import assert from "node:assert/strict";

import {
  PLAYFIELD_TEXTURE_KEY,
  COMMAND_CORE_TEXTURE_KEY,
  DEPLOYMENT_GATE_TEXTURE_KEY,
  createDefaultPath,
  getBasicTowerArtOrigins,
  getTowerArtOrigins,
  getCommandCorePosition,
  getDeploymentGatePosition,
  getPathHardwareMarkers,
  getPathPointAtDistance,
  getTowerTextureKey,
  getTowerBaseTextureKey,
  getTowerHeadTextureKey,
  pointToSegmentDistance,
} from "../src/presentation/WorldRenderer.js";
import {
  getEnemyDamagePresentation,
  getEnemyMotionRotation,
  shouldShowEnemyHealth,
} from "../src/game/enemies.js";
import {
  getMuzzlePoint,
  hasTransientEffectBudget,
} from "../src/game/bullets.js";
import { getProjectileOrigin } from "../src/systems/ProjectileSystem.js";
import {
  ART_DEPTHS,
  TRANSIENT_EFFECT_ENEMY_LIMIT,
  getEnemyArtStandard,
  getTowerArtStandard,
} from "../src/presentation/artStandards.js";

test("world renderer preserves map path and texture identities", () => {
  assert.deepEqual(createDefaultPath(), [
    { x: -120, y: 220 },
    { x: 980, y: 220 },
    { x: 980, y: 620 },
    { x: 140, y: 620 },
    { x: 140, y: 420 },
    { x: 860, y: 420 },
  ]);
  assert.equal(getTowerTextureKey("rapid"), "tower_rapid");
  assert.equal(getTowerTextureKey("basic", 3), "tower_basic_t3");
  assert.equal(getTowerBaseTextureKey("basic"), "tower_basic_base");
  assert.equal(getTowerHeadTextureKey("basic", 2), "tower_basic_head_t2");
  assert.equal(getTowerBaseTextureKey("rapid"), "tower_rapid_base");
  assert.equal(getTowerHeadTextureKey("rapid", 3), "tower_rapid_head_t3");
  assert.equal(PLAYFIELD_TEXTURE_KEY, "playfield_floor");
  assert.equal(COMMAND_CORE_TEXTURE_KEY, "command_core");
  assert.equal(DEPLOYMENT_GATE_TEXTURE_KEY, "deployment_gate");
  assert.deepEqual(getCommandCorePosition(createDefaultPath()), { x: 860, y: 420 });
  assert.deepEqual(getDeploymentGatePosition(createDefaultPath()), { x: 40, y: 220 });
  assert.deepEqual(getPathPointAtDistance(createDefaultPath(), 1100), {
    x: 980,
    y: 220,
  });
  assert.ok(getPathHardwareMarkers(createDefaultPath()).length > 20);
  assert.deepEqual(getBasicTowerArtOrigins(1), {
    base: { x: 0.5, y: 0.344 },
    head: { x: 0.485, y: 0.492 },
  });
  assert.deepEqual(getBasicTowerArtOrigins(2).head, { x: 0.455, y: 0.492 });
  assert.deepEqual(getTowerArtOrigins("rapid", 2), {
    base: { x: 0.5, y: 0.36 },
    head: { x: 0.5, y: 0.5 },
  });
});

test("production art standards preserve mobile footprints and depth order", () => {
  assert.equal(getTowerArtStandard("rapid").headSize, 128);
  assert.equal(getTowerArtStandard("sniper").headSize, 144);
  assert.deepEqual(getEnemyArtStandard("armored"), {
    width: 42,
    height: 34,
    rotates: true,
  });
  assert.ok(ART_DEPTHS.towerHead < ART_DEPTHS.enemy);
  assert.ok(ART_DEPTHS.enemyHealth < ART_DEPTHS.projectile);
  assert.equal(TRANSIENT_EFFECT_ENEMY_LIMIT, 72);
});

test("dense-wave health bars prioritize durable and badly damaged enemies", () => {
  assert.equal(shouldShowEnemyHealth("runner", 0.9), false);
  assert.equal(shouldShowEnemyHealth("sprinter", 0.55), true);
  assert.equal(shouldShowEnemyHealth("brute", 0.9), true);
  assert.equal(shouldShowEnemyHealth("armored", 0.99), true);
  assert.equal(shouldShowEnemyHealth("armored", 1), false);
});

test("enemy motion and damage polish stay restrained and deterministic", () => {
  assert.equal(getEnemyMotionRotation("armored", 1.2, 0, 0), 1.2);
  assert.ok(Math.abs(getEnemyMotionRotation("sprinter", 0, 100, 0)) < 0.051);
  assert.deepEqual(getEnemyDamagePresentation(0.2), {
    alpha: 0.88,
    healthColor: 0xff4d6d,
  });
  assert.deepEqual(getEnemyDamagePresentation(0.4), {
    alpha: 0.94,
    healthColor: 0xffc857,
  });
  assert.deepEqual(getEnemyDamagePresentation(0.8), {
    alpha: 1,
    healthColor: 0x57e3ff,
  });
});

test("point-to-segment placement geometry remains deterministic", () => {
  assert.equal(pointToSegmentDistance(5, 5, 0, 0, 10, 0), 5);
  assert.equal(pointToSegmentDistance(-3, 4, 0, 0, 10, 0), 5);
  assert.equal(pointToSegmentDistance(13, 4, 0, 0, 10, 0), 5);
  assert.equal(pointToSegmentDistance(3, 4, 0, 0, 0, 0), 5);
});

test("projectile muzzle feedback follows tower direction and tier", () => {
  assert.deepEqual(
    getMuzzlePoint({ x: 10, y: 20, tier: 1 }, { x: 110, y: 20 }),
    { angle: 0, x: 34, y: 20 }
  );
  const vertical = getMuzzlePoint(
    { x: 10, y: 20, tier: 3 },
    { x: 10, y: 120 }
  );
  assert.ok(Math.abs(vertical.angle - Math.PI / 2) < 1e-10);
  assert.ok(Math.abs(vertical.x - 10) < 1e-10);
  assert.equal(vertical.y, 52);
  assert.deepEqual(
    getProjectileOrigin(
      { x: 10, y: 20, tier: 2 },
      { x: 110, y: 20 },
      "basic"
    ),
    { angle: 0, x: 38, y: 20 }
  );
  assert.deepEqual(
    getProjectileOrigin({ x: 10, y: 20 }, { x: 110, y: 20 }, "rapid"),
    { angle: 0, x: 34, y: 20 }
  );
  assert.deepEqual(
    getMuzzlePoint(
      { x: 10, y: 20, type: "sniper", tier: 3 },
      { x: 110, y: 20 }
    ),
    { angle: 0, x: 60, y: 20 }
  );
  assert.deepEqual(
    getMuzzlePoint(
      { x: 10, y: 20, type: "laser", tier: 2 },
      { x: 110, y: 20 }
    ),
    { angle: 0, x: 35, y: 20 }
  );
});

test("extra art feedback yields to dense-wave readability", () => {
  const makeScene = (count) => ({
    enemies: { countActive: () => count },
  });
  assert.equal(hasTransientEffectBudget(makeScene(72)), true);
  assert.equal(hasTransientEffectBudget(makeScene(73)), false);
  assert.equal(hasTransientEffectBudget({}), true);
});

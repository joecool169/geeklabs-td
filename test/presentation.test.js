import test from "node:test";
import assert from "node:assert/strict";

import {
  PLAYFIELD_TEXTURE_KEY,
  COMMAND_CORE_TEXTURE_KEY,
  createDefaultPath,
  getBasicTowerArtOrigins,
  getCommandCorePosition,
  getTowerTextureKey,
  getTowerBaseTextureKey,
  getTowerHeadTextureKey,
  pointToSegmentDistance,
} from "../src/presentation/WorldRenderer.js";
import { shouldShowEnemyHealth } from "../src/game/enemies.js";
import {
  getMuzzlePoint,
  hasTransientEffectBudget,
} from "../src/game/bullets.js";
import { getProjectileOrigin } from "../src/systems/ProjectileSystem.js";

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
  assert.equal(PLAYFIELD_TEXTURE_KEY, "playfield_floor");
  assert.equal(COMMAND_CORE_TEXTURE_KEY, "command_core");
  assert.deepEqual(getCommandCorePosition(createDefaultPath()), { x: 860, y: 420 });
  assert.deepEqual(getBasicTowerArtOrigins(1), {
    base: { x: 0.5, y: 0.344 },
    head: { x: 0.485, y: 0.492 },
  });
  assert.deepEqual(getBasicTowerArtOrigins(2).head, { x: 0.455, y: 0.492 });
});

test("dense-wave health bars prioritize durable and badly damaged enemies", () => {
  assert.equal(shouldShowEnemyHealth("runner", 0.9), false);
  assert.equal(shouldShowEnemyHealth("sprinter", 0.55), true);
  assert.equal(shouldShowEnemyHealth("brute", 0.9), true);
  assert.equal(shouldShowEnemyHealth("armored", 0.99), true);
  assert.equal(shouldShowEnemyHealth("armored", 1), false);
});

test("point-to-segment placement geometry remains deterministic", () => {
  assert.equal(pointToSegmentDistance(5, 5, 0, 0, 10, 0), 5);
  assert.equal(pointToSegmentDistance(-3, 4, 0, 0, 10, 0), 5);
  assert.equal(pointToSegmentDistance(13, 4, 0, 0, 10, 0), 5);
  assert.equal(pointToSegmentDistance(3, 4, 0, 0, 0, 0), 5);
});

test("Basic muzzle feedback follows the target direction and tower tier", () => {
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
    { x: 10, y: 20 }
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

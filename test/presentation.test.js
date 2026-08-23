import test from "node:test";
import assert from "node:assert/strict";

import {
  createDefaultPath,
  getTowerTextureKey,
  pointToSegmentDistance,
} from "../src/presentation/WorldRenderer.js";
import { shouldShowEnemyHealth } from "../src/game/enemies.js";

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

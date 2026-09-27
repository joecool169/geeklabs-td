import test from "node:test";
import assert from "node:assert/strict";
import { RocketSystem, splashMultiplier } from "../src/systems/RocketSystem.js";
import { CombatSystem } from "../src/systems/CombatSystem.js";
import { TOWER_DEFS } from "../src/constants.js";
import { findTarget } from "../src/game/enemies.js";
import { applyTowerTier, getTargetModes } from "../src/game/towers.js";
import { computeDamageAgainstEnemy } from "../src/game/balance.js";
import { createRunTelemetry } from "../src/game/telemetry.js";

function image(x, y) {
  return { x, y, active: true, setDepth() { return this; }, setRotation() { return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; }, destroy() { this.active = false; } };
}
function enemy(x, y, extra = {}) { return { x, y, active: true, hp: 10000, pathIndex: 0, ...extra }; }
function setup(tier = 1) {
  const enemies = [enemy(80, 0)];
  const hits = [];
  const scene = { add: { image }, textures: { exists: () => false } };
  const tower = { ...TOWER_DEFS.rocket.tiers[tier - 1], type: "rocket", tier, x: 0, y: 0, sprite: image(0, 0) };
  const rockets = new RocketSystem({ scene, getEnemies: () => enemies, onHit: (t, e, damage) => hits.push({ t, e, damage }) });
  return { enemies, hits, scene, tower, rockets };
}

test("all rocket tiers launch a focused, spaced volley with damage fixed at launch", () => {
  for (const tier of [1, 2, 3]) {
    const { enemies, rockets, tower } = setup(tier);
    rockets.fire(tower, enemies[0]);
    const damage = tower.damage;
    tower.damage = 9999; // An upgrade cannot retroactively strengthen a volley.
    rockets.update(0);
    assert.equal(rockets.rockets.length, 1);
    rockets.update(179);
    assert.equal(rockets.volleys[0].remaining, tier + 1);
    rockets.update(1);
    assert.equal(rockets.volleys[0].remaining, tier);
    for (let i = 0; i < tier; i++) rockets.update(180);
    assert.equal(rockets.volleys.length, 0);
    assert.equal(tower.rocketReloadMs, 5000);
    assert.ok(rockets.rockets.every(shot => shot.target === enemies[0] && shot.damage === damage));
  }
});

test("rockets retarget locally and fly to the last location when no enemy remains", () => {
  const { enemies, rockets, tower } = setup();
  rockets.fire(tower, enemies[0]); rockets.update(0);
  const shot = rockets.rockets[0];
  enemies[0].active = false;
  enemies.push(enemy(95, 0), enemy(1000, 0));
  rockets.update(10);
  assert.equal(shot.target, enemies[1]);
  enemies[1].active = false;
  rockets.update(10);
  assert.equal(shot.target, null);
  assert.equal(shot.lastX, 95);
  assert.equal(shot.sprite.active, true);
  rockets.update(1000);
  assert.equal(shot.sprite.active, false);
  assert.equal(shot.sprite.x, 95);
});

test("splash falls off, excludes out-of-radius enemies and uses normal armor", () => {
  const { enemies, hits, rockets, tower } = setup();
  enemies.push(enemy(80 + 29, 0), enemy(80 + 58, 0), enemy(80 + 59, 0));
  rockets.fire(tower, enemies[0]); rockets.update(0); rockets.update(1000);
  assert.equal(hits.length, 3);
  assert.equal(hits[0].damage, 105);
  assert.equal(hits[1].damage, 105 * 0.625);
  assert.equal(hits[2].damage, 105 * 0.25);
  assert.equal(splashMultiplier(59), 0);
  assert.equal(computeDamageAgainstEnemy(tower, hits[2].damage, { armor: 4 }), hits[2].damage - 4);
});

test("selling cancels pending launches but allows airborne damage; destruction clears all", () => {
  const { enemies, hits, rockets, tower } = setup();
  rockets.fire(tower, enemies[0]); rockets.update(0);
  tower.sprite.active = false;
  rockets.update(1000);
  assert.equal(hits.length, 1);
  assert.equal(rockets.volleys.length, 0);
  assert.equal(rockets.rockets.length, 0);
  tower.sprite.active = true;
  rockets.fire(tower, enemies[0]); rockets.update(0);
  const shot = rockets.rockets[0];
  rockets.destroy();
  assert.equal(shot.sprite.active, false);
  assert.equal(rockets.volleys.length, 0);
});

test("densest targeting counts active neighbors and breaks ties by route progress", () => {
  const path = [{ x: 0, y: 0 }, { x: 1000, y: 0 }];
  const list = [enemy(140, 0), enemy(20, 0), enemy(25, 0), enemy(30, 0), enemy(145, 0, { active: false })];
  const enemies = { children: { iterate: fn => list.forEach(fn) } };
  assert.equal(findTarget({ path, enemies }, { type: "rocket", x: 0, y: 0, range: 155 }, "dense"), list[3]);
  assert.deepEqual(getTargetModes({ type: "rocket" }), ["dense", "first", "close", "strong", "armored"]);
});

test("reload lasts five active seconds after final rocket and survives upgrade", () => {
  const { enemies, scene, tower } = setup();
  const combat = new CombatSystem({ scene, towerSystem: { towers: [tower] },
    enemySystem: { group: { getChildren: () => enemies }, findTarget: () => enemies[0] },
    runController: {}, getDifficulty: () => ({}), getTelemetry: () => null });
  combat.update(0, 0); combat.update(180, 180); combat.update(360, 180);
  assert.equal(tower.rocketReloadMs, 5000);
  assert.equal(combat.rockets.volleys.length, 0);
  // A huge wall-clock jump with no active delta models pause/resume.
  combat.update(100000, 0);
  assert.equal(tower.rocketReloadMs, 5000);
  tower.sprite.setTint = () => {}; tower.sprite.setScale = () => {};
  applyTowerTier(tower, 1);
  combat.update(104999, 4999);
  assert.equal(combat.rockets.volleys.length, 0);
  combat.update(105000, 1);
  assert.equal(combat.rockets.volleys[0].remaining, 3);
});

test("rocket kills record clipped damage, rewards and tower telemetry once", () => {
  const { enemies, scene, tower } = setup();
  const telemetry = createRunTelemetry({ seed: "rocket", difficultyKey: "hard" });
  let kills = 0;
  enemies[0].hp = 20; enemies[0].typeKey = "brute";
  enemies[0].destroy = function() { this.active = false; };
  const combat = new CombatSystem({ scene, towerSystem: { towers: [tower] },
    enemySystem: { group: { getChildren: () => enemies }, findTarget: () => enemies.find(e => e.active) },
    runController: { recordKill() { kills++; } }, getDifficulty: () => ({}), getTelemetry: () => telemetry });
  combat.update(0, 0); combat.update(1000, 1000); combat.update(2000, 1000);
  assert.equal(kills, 1);
  assert.equal(telemetry.damageByTowerType.rocket, 20);
  assert.equal(telemetry.killsByTowerType.rocket, 1);
});

test("a rocket with an unreachable target expires at its own location", () => {
  const { enemies, hits, rockets, tower } = setup();
  enemies[0].x = 10000;
  rockets.fire(tower, enemies[0]); rockets.update(0);
  const shot = rockets.rockets[0];
  rockets.update(3999);
  const x = shot.sprite.x;
  rockets.update(1);
  assert.equal(shot.sprite.active, false);
  assert.equal(shot.sprite.x, x);
  assert.equal(hits.length, 0);
});

test("splash damage survives enemy collection mutation during kills", () => {
  const { enemies, scene, tower } = setup();
  enemies.push(enemy(81, 0), enemy(82, 0));
  const hit = [];
  const rockets = new RocketSystem({scene,getEnemies:()=>enemies,onHit:(_t,e)=>{
    hit.push(e);e.active=false;enemies.splice(enemies.indexOf(e),1);
  }});
  rockets.fire(tower,enemies[0]);rockets.update(0);rockets.update(1000);
  assert.equal(hit.length,3);
  assert.equal(enemies.length,0);
});

import test from "node:test";
import assert from "node:assert/strict";

import { ENEMY_DEFS, TOWER_DEFS } from "../src/constants.js";
import { DIFFICULTY_CONFIG } from "../src/game/config.js";
import {
  computeEnemyHp,
  computeEnemyReward,
  createEnemyRewardCarry,
} from "../src/game/enemies.js";
import { computeWaveConfig } from "../src/game/waves.js";
import {
  computeDamageAgainstEnemy,
  computeExpectedEnemyCounts,
  computeTowerDps,
  computeWaveBalance,
} from "../src/game/balance.js";

const waveConfig = (wave) => computeWaveConfig.call({ intermissionMs: 5000 }, wave);
const weightMap = (wave) =>
  Object.fromEntries(waveConfig(wave).weights.map(({ key, w }) => [key, w]));

const expectedEnemyCounts = (wave) => {
  return computeExpectedEnemyCounts(wave).counts;
};

const expectedEnemyBounty = (wave, difficulty) => {
  const counts = expectedEnemyCounts(wave);
  return Object.entries(counts).reduce((total, [key, count]) => {
    const { exactReward } = computeEnemyReward(
      ENEMY_DEFS[key],
      wave,
      difficulty
    );
    return total + count * exactReward;
  }, 0);
};

test("specialist towers unlock at their progression milestones", () => {
  assert.equal(TOWER_DEFS.basic.unlockWave, 1);
  assert.equal(TOWER_DEFS.rapid.unlockWave, 10);
  assert.equal(TOWER_DEFS.sniper.unlockWave, 20);
  assert.equal(TOWER_DEFS.laser.unlockWave, 28);
});

test("waves before the Brute unlock remain Runner-only", () => {
  for (let wave = 1; wave < ENEMY_DEFS.brute.unlockWave; wave += 1) {
    assert.deepEqual(weightMap(wave), { runner: 1.6 });
  }
});

test("Brutes first appear on wave 22 and ramp gradually", () => {
  assert.equal(ENEMY_DEFS.brute.unlockWave, 22);
  assert.deepEqual(weightMap(20), { runner: 1.6 });
  assert.deepEqual(weightMap(21), { runner: 1.6 });
  assert.deepEqual(weightMap(22), { runner: 1.6, brute: 0.35 });
  assert.ok(Math.abs(weightMap(27).brute - 0.775) < Number.EPSILON);
  assert.equal(weightMap(32).brute, 1.2);
  assert.equal(weightMap(50).brute, 1.2);
  assert.equal(weightMap(29).armored, undefined);
});

test("Armored enemies ramp gradually after their unlock", () => {
  assert.equal(weightMap(30).armored, 0.25);
  assert.equal(weightMap(36).armored, 0.625);
  assert.equal(weightMap(42).armored, 1);
  assert.equal(weightMap(60).armored, 1);
});

test("Basic tower stats remain unchanged", () => {
  assert.deepEqual(TOWER_DEFS.basic, {
    key: "basic",
    name: "Basic",
    desc: "Balanced damage and range.",
    hotkey: "1",
    unlockWave: 1,
    tiers: [
      { cost: 50, damage: 10, range: 95, fireMs: 260, tint: 0x3bd3ff, scale: 1.0 },
      { cost: 75, damage: 16, range: 110, fireMs: 210, tint: 0x7cf0ff, scale: 1.0 },
      { cost: 120, damage: 24, range: 130, fireMs: 170, tint: 0xb9f5ff, scale: 1.15 },
    ],
  });
});

const cumulativeTierMetrics = (towerKey, enemyKey, damageMultiplier = 1) => {
  const def = TOWER_DEFS[towerKey];
  let cumulativeCost = 0;
  return def.tiers.map((tier, tierIndex) => {
    cumulativeCost += tier.cost;
    const dps = computeTowerDps(
      towerKey,
      tierIndex,
      enemyKey,
      damageMultiplier
    );
    return { dps, cumulativeCost, efficiency: dps / cumulativeCost };
  });
};

test("Sniper has a 20–30% equal-dollar advantage against Brutes", () => {
  const basicEfficiency =
    computeTowerDps("basic", 0, "brute") / TOWER_DEFS.basic.tiers[0].cost;
  for (const tier of cumulativeTierMetrics("sniper", "brute")) {
    const advantage = tier.efficiency / basicEfficiency - 1;
    assert.ok(advantage >= 0.2 && advantage <= 0.3);
  }
});

test("Sniper does not gain its specialist advantage against Runners", () => {
  const basicEfficiency =
    computeTowerDps("basic", 0, "runner") / TOWER_DEFS.basic.tiers[0].cost;
  for (const tier of cumulativeTierMetrics("sniper", "runner")) {
    assert.ok(tier.efficiency < basicEfficiency);
  }
});

test("Rapid has a 20–30% equal-dollar advantage against Runners", () => {
  const basicEfficiency =
    computeTowerDps("basic", 0, "runner") / TOWER_DEFS.basic.tiers[0].cost;
  for (const tier of cumulativeTierMetrics("rapid", "runner")) {
    const advantage = tier.efficiency / basicEfficiency - 1;
    assert.ok(advantage >= 0.2 && advantage <= 0.3);
  }
});

test("Rapid remains less armor-efficient than high-damage Basic tiers", () => {
  const rapid = cumulativeTierMetrics("rapid", "armored");
  const basic = cumulativeTierMetrics("basic", "armored");
  for (let tierIndex = 0; tierIndex < rapid.length; tierIndex += 1) {
    assert.ok(rapid[tierIndex].efficiency < basic[tierIndex].efficiency);
  }
});

test("Laser has a 20–30% full-lock equal-dollar advantage against Armored", () => {
  const basicEfficiency =
    computeTowerDps("basic", 0, "armored") / TOWER_DEFS.basic.tiers[0].cost;
  const laser = cumulativeTierMetrics("laser", "armored", 2.5);
  for (const tier of laser) {
    const advantage = tier.efficiency / basicEfficiency - 1;
    assert.ok(advantage >= 0.2 && advantage <= 0.3);
  }
});

test("Laser unlocks before Armored enemies", () => {
  assert.equal(TOWER_DEFS.laser.unlockWave, 28);
  assert.equal(ENEMY_DEFS.armored.unlockWave, 30);
  assert.ok(TOWER_DEFS.laser.unlockWave < ENEMY_DEFS.armored.unlockWave);
});

test("specialist upgrades meet intended-match incremental efficiency", () => {
  const cases = [
    ["rapid", "runner", 1],
    ["sniper", "brute", 1],
    ["laser", "armored", 2.5],
  ];
  for (const [towerKey, enemyKey, damageMultiplier] of cases) {
    const tiers = cumulativeTierMetrics(
      towerKey,
      enemyKey,
      damageMultiplier
    );
    const tierOneEfficiency = tiers[0].efficiency;
    for (let index = 1; index < tiers.length; index += 1) {
      const upgradeCost = TOWER_DEFS[towerKey].tiers[index].cost;
      const incrementalEfficiency =
        (tiers[index].dps - tiers[index - 1].dps) / upgradeCost;
      const ratio = incrementalEfficiency / tierOneEfficiency;
      assert.ok(ratio >= 0.9 && ratio <= 1.1);
    }
  }
});

test("Runner pack pressure ramps gently from waves 10 through 15", () => {
  const packs = [];
  for (let wave = 9; wave <= 16; wave += 1) {
    const { packEvery, packSize } = waveConfig(wave);
    packs.push({ wave, packEvery, packSize });
  }

  assert.deepEqual(packs, [
    { wave: 9, packEvery: 12, packSize: 2 },
    { wave: 10, packEvery: 11, packSize: 3 },
    { wave: 11, packEvery: 11, packSize: 3 },
    { wave: 12, packEvery: 9, packSize: 3 },
    { wave: 13, packEvery: 9, packSize: 4 },
    { wave: 14, packEvery: 9, packSize: 4 },
    { wave: 15, packEvery: 8, packSize: 4 },
    { wave: 16, packEvery: 8, packSize: 5 },
  ]);
});

test("Brute HP class scaling starts at zero on its unlock wave", () => {
  const def = ENEMY_DEFS.brute;
  const expected = Math.floor(
    def.baseHp *
      DIFFICULTY_CONFIG.hard.enemyHpMul *
      2 *
      1.225 *
      Math.pow(1.03, 10)
  );

  assert.equal(computeEnemyHp(def, 22, DIFFICULTY_CONFIG.hard), expected);
});

test("Brute HP receives one wave of class scaling at wave 23", () => {
  const def = ENEMY_DEFS.brute;
  const expected = Math.floor(
    def.baseHp *
      (1 + def.scaleHpPerWave) *
      DIFFICULTY_CONFIG.hard.enemyHpMul *
      2 *
      1.225 *
      Math.pow(1.03, 11)
  );

  assert.equal(computeEnemyHp(def, 23, DIFFICULTY_CONFIG.hard), expected);
});

test("wave-1 Runner HP behavior remains unchanged", () => {
  const def = ENEMY_DEFS.runner;
  const oldFormulaHp = Math.floor(
    def.baseHp *
      (1 + (1 - 1) * def.scaleHpPerWave) *
      DIFFICULTY_CONFIG.hard.enemyHpMul
  );

  assert.equal(computeEnemyHp(def, 1, DIFFICULTY_CONFIG.hard), oldFormulaHp);
});

test("Armored HP class scaling is relative to its later unlock wave", () => {
  const def = ENEMY_DEFS.armored;
  const globalHpMulAt = (wave) =>
    DIFFICULTY_CONFIG.hard.enemyHpMul *
    2 *
    1.225 *
    Math.pow(1.03, wave - 12);

  assert.equal(
    computeEnemyHp(def, 30, DIFFICULTY_CONFIG.hard),
    Math.floor(def.baseHp * globalHpMulAt(30))
  );
  assert.equal(
    computeEnemyHp(def, 32, DIFFICULTY_CONFIG.hard),
    Math.floor(
      def.baseHp *
        (1 + 2 * def.scaleHpPerWave) *
        globalHpMulAt(32)
    )
  );
});

test("Armored HP class scaling starts at zero on its unlock wave", () => {
  const def = ENEMY_DEFS.armored;
  const withoutClassAge = Math.floor(
    def.baseHp *
      DIFFICULTY_CONFIG.hard.enemyHpMul *
      2 *
      1.225 *
      Math.pow(1.03, 18)
  );
  assert.equal(
    computeEnemyHp(def, def.unlockWave, DIFFICULTY_CONFIG.hard),
    withoutClassAge
  );
});

test("Hard Runner rewards carry fractional value through wave 21", () => {
  let carry = 0;
  let wave20Total = 0;
  let wave21Total = 0;

  for (let i = 0; i < waveConfig(20).total; i += 1) {
    const result = computeEnemyReward(
      ENEMY_DEFS.runner,
      20,
      DIFFICULTY_CONFIG.hard,
      carry
    );
    wave20Total += result.reward;
    carry = result.roundingCarry;
  }
  for (let i = 0; i < waveConfig(21).total; i += 1) {
    const result = computeEnemyReward(
      ENEMY_DEFS.runner,
      21,
      DIFFICULTY_CONFIG.hard,
      carry
    );
    wave21Total += result.reward;
    carry = result.roundingCarry;
  }

  assert.ok(wave20Total >= 162);
  assert.ok(wave21Total >= 164);
  assert.ok(wave21Total / waveConfig(21).total > 2.9);
});

test("fractional reward carry is deterministic and resets between games", () => {
  const rewardSequence = () => {
    const carry = createEnemyRewardCarry();
    const rewards = [];
    for (let wave = 19; wave <= 25; wave += 1) {
      for (const key of ["runner", "brute", "runner"]) {
        const result = computeEnemyReward(
          ENEMY_DEFS[key],
          wave,
          DIFFICULTY_CONFIG.hard,
          carry[key] ?? 0
        );
        rewards.push(result.reward);
        carry[key] = result.roundingCarry;
      }
    }
    return { rewards, carry };
  };

  const first = rewardSequence();
  const second = rewardSequence();
  assert.deepEqual(first.rewards, second.rewards);
  assert.deepEqual(first.carry, second.carry);
  assert.notEqual(first.carry, second.carry);
  assert.deepEqual(Object.keys(createEnemyRewardCarry()), []);
});

test("expected Hard bounty changes gradually from waves 19 through 25", () => {
  const bounties = [];
  for (let wave = 19; wave <= 25; wave += 1) {
    bounties.push(expectedEnemyBounty(wave, DIFFICULTY_CONFIG.hard));
  }

  assert.ok(Math.abs(bounties[2] / bounties[1] - 1) <= 0.1);
  for (let i = 1; i < bounties.length; i += 1) {
    assert.ok(bounties[i] / bounties[i - 1] >= 0.9);
  }
});

test("no unintended total-income cliff occurs from waves 19 through 35", () => {
  let priorIncome = computeWaveBalance(
    18,
    DIFFICULTY_CONFIG.hard
  ).income;
  for (let wave = 19; wave <= 35; wave += 1) {
    const income = computeWaveBalance(wave, DIFFICULTY_CONFIG.hard).income;
    assert.ok(income / priorIncome >= 0.98);
    assert.ok(income / priorIncome <= 1.12);
    priorIncome = income;
  }
});

test("required-DPS growth meets target bands after specialist unlocks", () => {
  const rows = Array.from({ length: 22 }, (_, index) =>
    computeWaveBalance(index + 19, DIFFICULTY_CONFIG.hard)
  );
  const growthAt = (wave) =>
    rows[wave - 19].requiredDps / rows[wave - 20].requiredDps - 1;

  for (let wave = 20; wave <= 40; wave += 1) {
    assert.ok(growthAt(wave) <= 0.11, `Wave ${wave} growth exceeded 11%`);
  }
  assert.ok(growthAt(22) >= 0.08 && growthAt(22) <= 0.11);

  const average = (waves) =>
    waves.reduce((sum, wave) => sum + growthAt(wave), 0) / waves.length;
  const waves20To30 = Array.from(
    { length: 11 },
    (_, index) => index + 20
  );
  const waves31To40 = Array.from({ length: 10 }, (_, index) => index + 31);
  assert.ok(average(waves20To30) >= 0.06);
  assert.ok(average(waves20To30) <= 0.08);
  assert.ok(average(waves31To40) >= 0.065);
  assert.ok(average(waves31To40) <= 0.09);
});

test("pack topology stays within the smooth target deployment window", () => {
  for (let wave = 1; wave <= 40; wave += 1) {
    const row = computeWaveBalance(wave, DIFFICULTY_CONFIG.hard);
    assert.ok(
      Math.abs(
        row.spawnDurationMs - row.config.targetSpawnDurationMs
      ) <= 25
    );
  }
});

test("income progression funds 70–90% of late-wave ideal sustained DPS", () => {
  const idealEfficiency = {
    runner: computeTowerDps("rapid", 0, "runner") / 65,
    brute: computeTowerDps("sniper", 0, "brute") / 90,
    armored: computeTowerDps("laser", 0, "armored", 2.5) / 220,
  };
  // A tower's raw range, retargeting, overkill, and travel time make roughly
  // 40% of theoretical map-wide DPS a conservative late-game budget model.
  const realisticEngagement = 0.4;
  let cumulativeMoney = DIFFICULTY_CONFIG.hard.startingMoney;

  for (let wave = 1; wave <= 35; wave += 1) {
    const row = computeWaveBalance(wave, DIFFICULTY_CONFIG.hard);
    cumulativeMoney += row.income;
    if (wave < 30) continue;
    const idealSpend = Object.entries(row.counts).reduce(
      (total, [key, count]) =>
        total +
        count *
          row.hpByClass[key] /
          (row.spawnDurationMs / 1000) /
          idealEfficiency[key],
      0
    );
    const supportedFraction =
      cumulativeMoney * realisticEngagement / idealSpend;
    assert.ok(supportedFraction >= 0.7 && supportedFraction <= 0.9);
  }
});

test("shared damage rules apply matchup and armor data deterministically", () => {
  assert.equal(computeDamageAgainstEnemy("rapid", 6, "runner"), 7.5);
  assert.equal(computeDamageAgainstEnemy("rapid", 6, "armored"), 1);
  assert.ok(
    Math.abs(computeDamageAgainstEnemy("sniper", 28, "brute") - 44.8) <
      1e-10
  );
  assert.equal(computeDamageAgainstEnemy("laser", 6, "armored"), 5);
});

test("easier difficulties retain higher expected rewards", () => {
  for (let wave = 19; wave <= 25; wave += 1) {
    const easy = expectedEnemyBounty(wave, DIFFICULTY_CONFIG.easy);
    const medium = expectedEnemyBounty(wave, DIFFICULTY_CONFIG.medium);
    const hard = expectedEnemyBounty(wave, DIFFICULTY_CONFIG.hard);
    assert.ok(easy > medium);
    assert.ok(medium > hard);
  }
});

const TOWER_DEFS = {
  basic: {
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
  },
  rapid: {
    key: "rapid",
    name: "Rapid",
    desc: "High rate of fire, lower damage.",
    hotkey: "2",
    unlockWave: 10,
    tiers: [
      { cost: 65, damage: 6, range: 85, fireMs: 140, tint: 0x39ff8f, scale: 0.95 },
      { cost: 90, damage: 8, range: 95, fireMs: 115, tint: 0x7fffc2, scale: 1.0 },
      { cost: 140, damage: 10, range: 105, fireMs: 95, tint: 0xc7ffe5, scale: 1.1 },
    ],
  },
  sniper: {
    key: "sniper",
    name: "Sniper",
    desc: "Long range, heavy hits (prefers Strong).",
    hotkey: "3",
    unlockWave: 20,
    defaultTargetMode: "strong",
    tiers: [
      { cost: 90, damage: 28, range: 165, fireMs: 520, tint: 0xffc857, scale: 1.05 },
      { cost: 140, damage: 42, range: 185, fireMs: 470, tint: 0xffda85, scale: 1.1 },
      { cost: 210, damage: 64, range: 205, fireMs: 420, tint: 0xffedc0, scale: 1.15 },
    ],
  },
  laser: {
    key: "laser",
    name: "Laser",
    desc: "Fast ticks, best vs Armored (prefers Armored).",
    hotkey: "4",
    unlockWave: 40,
    defaultTargetMode: "armored",
    tiers: [
      { cost: 220, damage: 6, range: 145, fireMs: 110, tint: 0xff6bff, scale: 1.05 },
    ],
  },
};

const TARGET_MODES = ["close", "strong", "armored", "first"];

function nextInCycle(arr, v) {
  const i = arr.indexOf(v);
  return arr[(i + 1 + arr.length) % arr.length];
}

const ENEMY_DEFS = {
  runner: {
    key: "runner",
    name: "Runner",
    tint: 0xff4d6d,
    baseHp: 18,
    baseSpeed: 120,
    reward: 6,
    armor: 0,
    scaleHpPerWave: 0.085,
    scaleSpeedPerWave: 0.01,
    scoreWeight: 0.7,
  },
  brute: {
    key: "brute",
    name: "Brute",
    tint: 0xb54dff,
    baseHp: 70,
    baseSpeed: 52,
    reward: 12,
    armor: 0,
    scaleHpPerWave: 0.14,
    scaleSpeedPerWave: 0.007,
    scoreWeight: 1.5,
  },
  armored: {
    key: "armored",
    name: "Armored",
    tint: 0x8fb3c9,
    baseHp: 40,
    baseSpeed: 72,
    reward: 10,
    armor: 4,
    scaleHpPerWave: 0.12,
    scaleSpeedPerWave: 0.01,
    scoreWeight: 1.8,
  },
};

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export { TOWER_DEFS, ENEMY_DEFS, TARGET_MODES, nextInCycle, clamp01 };

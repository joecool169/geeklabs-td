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
    desc: "Intercepts Sprinters and Runner packs.",
    hotkey: "2",
    unlockWave: 10,
    defaultTargetMode: "preferred",
    preferredTargetType: "sprinter",
    matchupDamage: { runner: 1.25, sprinter: 1.5 },
    armorMultiplier: 2,
    tiers: [
      { cost: 65, damage: 6, range: 85, fireMs: 120, tint: 0x39ff8f, scale: 0.95 },
      { cost: 90, damage: 11, range: 95, fireMs: 95, tint: 0x7fffc2, scale: 1.0 },
      { cost: 140, damage: 17, range: 105, fireMs: 75, tint: 0xc7ffe5, scale: 1.1 },
    ],
  },
  sniper: {
    key: "sniper",
    name: "Sniper",
    desc: "Long-range Brute killer with Brute priority.",
    hotkey: "3",
    unlockWave: 20,
    defaultTargetMode: "preferred",
    preferredTargetType: "brute",
    matchupDamage: { brute: 1.6 },
    tiers: [
      { cost: 90, damage: 28, range: 165, fireMs: 520, tint: 0xffc857, scale: 1.05 },
      { cost: 140, damage: 65, range: 185, fireMs: 470, tint: 0xffda85, scale: 1.1 },
      { cost: 210, damage: 110, range: 205, fireMs: 420, tint: 0xffedc0, scale: 1.15 },
    ],
  },
  laser: {
    key: "laser",
    name: "Laser",
    desc: "Armor-piercing beam with line pierce.",
    hotkey: "4",
    unlockWave: 30,
    defaultTargetMode: "preferred",
    preferredTargetType: "armored",
    armorPenetration: 3,
    maxPierce: 5,
    pierceFalloff: 0.7,
    lockRampMs: 2000,
    maxLockBonus: 1.5,
    tiers: [
      { cost: 220, damage: 6, range: 145, fireMs: 110, tint: 0xff6bff, scale: 1.05 },
      { cost: 160, damage: 9, range: 160, fireMs: 95, tint: 0xff9cff, scale: 1.1 },
      { cost: 230, damage: 12, range: 180, fireMs: 80, tint: 0xffd1ff, scale: 1.15 },
    ],
  },
};

const TARGET_MODES = ["first", "close", "strong", "armored"];

function nextInCycle(arr, v) {
  const i = arr.indexOf(v);
  return arr[(i + 1 + arr.length) % arr.length];
}

const ENEMY_DEFS = {
  runner: {
    key: "runner",
    name: "Runner",
    unlockWave: 1,
    tint: 0xff4d6d,
    baseHp: 18,
    baseSpeed: 120,
    reward: 6,
    armor: 0,
    scaleHpPerWave: 0.085,
    scaleSpeedPerWave: 0.01,
    scoreWeight: 0.7,
  },
  sprinter: {
    key: "sprinter",
    name: "Sprinter",
    unlockWave: 15,
    tint: 0xff9f43,
    baseHp: 12,
    baseSpeed: 175,
    reward: 7,
    armor: 0,
    scaleHpPerWave: 0.075,
    scaleSpeedPerWave: 0.012,
    scoreWeight: 0.9,
  },
  brute: {
    key: "brute",
    name: "Brute",
    unlockWave: 25,
    tint: 0xb54dff,
    baseHp: 70,
    baseSpeed: 52,
    reward: 12,
    armor: 0,
    scaleHpPerWave: 0.08,
    scaleSpeedPerWave: 0.007,
    scoreWeight: 1.5,
  },
  armored: {
    key: "armored",
    name: "Armored",
    unlockWave: 35,
    tint: 0x8fb3c9,
    baseHp: 40,
    baseSpeed: 72,
    reward: 10,
    armor: 4,
    scaleHpPerWave: 0.10,
    scaleSpeedPerWave: 0.01,
    scoreWeight: 1.8,
  },
};

const ENEMY_HP_SCALING = {
  earlyRampWaves: 9,
  earlyRampBonus: 1,
  midPressureStartWave: 3,
  midPressureWaves: 9,
  midPressurePerWave: 0.025,
  enduranceStartWave: 12,
  enduranceMultiplierPerWave: 1.03,
};

const WAVE_CADENCE = {
  preparationFloorMs: 330,
  lateRampStartWave: 30,
  lateRampPerWaveMs: 7,
  minimumMs: 260,
  packSpacingMs: 60,
};

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export {
  TOWER_DEFS,
  ENEMY_DEFS,
  ENEMY_HP_SCALING,
  WAVE_CADENCE,
  TARGET_MODES,
  nextInCycle,
  clamp01,
};

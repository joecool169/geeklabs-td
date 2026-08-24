const ART_DEPTHS = Object.freeze({
  range: 10,
  towerBase: 12,
  towerHead: 13,
  enemy: 20,
  enemyHealth: 21,
  projectile: 50,
  impact: 60,
});

const FULL_EFFECT_ENEMY_LIMIT = 36;
const TRANSIENT_EFFECT_ENEMY_LIMIT = 60;
const PLACEMENT_GHOST_ALPHA = 0.44;

const TOWER_ART_STANDARDS = Object.freeze({
  basic: Object.freeze({
    color: 0x3bd3ff,
    baseSizeByTier: Object.freeze({ 1: 64, 2: 67, 3: 70 }),
    headSize: 128,
    fallbackSizeByTier: Object.freeze({ 1: 40, 2: 42, 3: 46 }),
    baseOrigin: Object.freeze({ x: 0.5, y: 0.344 }),
  }),
  rapid: Object.freeze({
    color: 0x39ff8f,
    baseSizeByTier: Object.freeze({ 1: 62, 2: 65, 3: 68 }),
    headSize: 128,
    fallbackSizeByTier: Object.freeze({ 1: 38, 2: 41, 3: 44 }),
    baseOrigin: Object.freeze({ x: 0.5, y: 0.36 }),
  }),
  sniper: Object.freeze({
    color: 0xffc857,
    baseSizeByTier: Object.freeze({ 1: 64, 2: 67, 3: 70 }),
    headSize: 144,
    fallbackSizeByTier: Object.freeze({ 1: 40, 2: 43, 3: 46 }),
    baseOrigin: Object.freeze({ x: 0.5, y: 0.36 }),
  }),
  laser: Object.freeze({
    color: 0xff6bff,
    baseSizeByTier: Object.freeze({ 1: 64, 2: 68, 3: 72 }),
    headSize: 128,
    fallbackSizeByTier: Object.freeze({ 1: 40, 2: 43, 3: 46 }),
    baseOrigin: Object.freeze({ x: 0.5, y: 0.36 }),
  }),
});

const ENEMY_ART_STANDARDS = Object.freeze({
  runner: Object.freeze({ width: 34, height: 23, rotates: true }),
  sprinter: Object.freeze({ width: 36, height: 21, rotates: true }),
  brute: Object.freeze({ width: 40, height: 32, rotates: true }),
  armored: Object.freeze({ width: 42, height: 34, rotates: true }),
});

const getTowerArtStandard = (type) =>
  TOWER_ART_STANDARDS[type] ?? TOWER_ART_STANDARDS.basic;

const getEnemyArtStandard = (type) =>
  ENEMY_ART_STANDARDS[type] ?? ENEMY_ART_STANDARDS.runner;

export {
  ART_DEPTHS,
  ENEMY_ART_STANDARDS,
  FULL_EFFECT_ENEMY_LIMIT,
  PLACEMENT_GHOST_ALPHA,
  TOWER_ART_STANDARDS,
  TRANSIENT_EFFECT_ENEMY_LIMIT,
  getEnemyArtStandard,
  getTowerArtStandard,
};

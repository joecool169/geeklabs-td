const DEFAULT_RUN_SEED = "balance-v0.3.0";

function normalizeRunSeed(value) {
  const seed = String(value ?? "").trim();
  return seed || DEFAULT_RUN_SEED;
}

function hashSeed(value) {
  const text = normalizeRunSeed(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createWaveRandom(runSeed, waveNumber) {
  const wave = Math.max(1, Math.floor(Number(waveNumber) || 1));
  return createSeededRandom(`${normalizeRunSeed(runSeed)}:wave:${wave}`);
}

export {
  DEFAULT_RUN_SEED,
  createSeededRandom,
  createWaveRandom,
  hashSeed,
  normalizeRunSeed,
};

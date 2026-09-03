const CALLSIGN_PREFIXES = Object.freeze([
  "Amber",
  "Arctic",
  "Bold",
  "Bright",
  "Cobalt",
  "Crimson",
  "Delta",
  "Iron",
  "Lunar",
  "Nova",
  "Rapid",
  "Silver",
  "Solar",
  "Steel",
  "Swift",
  "Titan",
]);

const CALLSIGN_SUFFIXES = Object.freeze([
  "Aegis",
  "Beacon",
  "Comet",
  "Falcon",
  "Forge",
  "Helix",
  "Lancer",
  "Orbit",
  "Ranger",
  "Relay",
  "Shield",
  "Signal",
  "Spear",
  "Vector",
  "Viper",
  "Warden",
]);

const CALLSIGN_PATTERN = /^([A-Za-z]+)-([A-Za-z]+)-(\d{3})$/;

function randomIndex(length, random) {
  const value = Number(random());
  const normalized = Number.isFinite(value)
    ? Math.min(Math.max(value, 0), 0.9999999999999999)
    : 0;
  return Math.floor(normalized * length);
}

function generateCallsign(random = Math.random) {
  const prefix = CALLSIGN_PREFIXES[randomIndex(CALLSIGN_PREFIXES.length, random)];
  const suffix = CALLSIGN_SUFFIXES[randomIndex(CALLSIGN_SUFFIXES.length, random)];
  const number = 100 + randomIndex(900, random);
  return `${prefix}-${suffix}-${number}`;
}

function isGeneratedCallsign(value) {
  const match = String(value || "").trim().match(CALLSIGN_PATTERN);
  return !!(
    match &&
    CALLSIGN_PREFIXES.includes(match[1]) &&
    CALLSIGN_SUFFIXES.includes(match[2])
  );
}

function normalizeCallsign(value, random = Math.random) {
  const callsign = String(value || "").trim();
  return isGeneratedCallsign(callsign) ? callsign : generateCallsign(random);
}

export {
  CALLSIGN_PREFIXES,
  CALLSIGN_SUFFIXES,
  generateCallsign,
  isGeneratedCallsign,
  normalizeCallsign,
};

import { DIFFICULTY_CONFIG } from "../game/config.js";

const DEFAULT_DIFFICULTY_KEY = "easy";

const STORAGE_KEYS = Object.freeze({
  playerName: "defense_protocol_player_name_v1",
  difficulty: "defense_protocol_difficulty_v1",
  leaderboard: "defense_protocol_leaderboard_v1",
  helpOverlay: "defense_protocol_help_overlay_v1",
  balanceTelemetry: "defense_protocol_balance_telemetry_v2",
});

function createStorageGateway(storage = globalThis.localStorage) {
  return {
    read(key) {
      try {
        return storage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    write(key, value) {
      try {
        storage?.setItem(key, value);
      } catch {
        return false;
      }
      return true;
    },
  };
}

function normalizePlayerName(raw) {
  const name = String(raw || "").trim();
  return name.length ? name : "Player";
}

function normalizeDifficultyKey(key) {
  return DIFFICULTY_CONFIG[key] ? key : DEFAULT_DIFFICULTY_KEY;
}

export {
  DEFAULT_DIFFICULTY_KEY,
  STORAGE_KEYS,
  createStorageGateway,
  normalizeDifficultyKey,
  normalizePlayerName,
};

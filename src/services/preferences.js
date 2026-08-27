import { DIFFICULTY_CONFIG } from "../game/config.js";

const DEFAULT_DIFFICULTY_KEY = "easy";

const STORAGE_KEYS = Object.freeze({
  playerName: "defense_protocol_player_name_v1",
  difficulty: "defense_protocol_difficulty_v1",
  leaderboard: "defense_protocol_leaderboard_v1",
  globalScoresEnabled: "defense_protocol_global_scores_enabled_v1",
  helpOverlay: "defense_protocol_help_overlay_v1",
  soundEnabled: "defense_protocol_sound_enabled_v1",
  balanceTelemetry: "defense_protocol_balance_telemetry_v2",
});

function createStorageGateway(
  storage = globalThis.localStorage,
  { writeThrough } = {}
) {
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
      if (typeof writeThrough === "function") {
        Promise.resolve(writeThrough(key, String(value))).catch(() => {});
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

function isPreferenceEnabled(value, defaultEnabled = true) {
  if (value === null || value === undefined) return defaultEnabled;
  return value !== "false";
}

export {
  DEFAULT_DIFFICULTY_KEY,
  STORAGE_KEYS,
  createStorageGateway,
  isPreferenceEnabled,
  normalizeDifficultyKey,
  normalizePlayerName,
};

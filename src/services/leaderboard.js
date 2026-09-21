import { DEFAULT_MAP_KEY, normalizeMapKey } from "../game/maps.js";
import { DIFFICULTY_CONFIG } from "../game/config.js";
import {
  DEFAULT_DIFFICULTY_KEY,
  STORAGE_KEYS,
  normalizeDifficultyKey,
} from "./preferences.js";
import { isNativeRuntime } from "../platform/nativeRuntime.js";

const NATIVE_API_ORIGIN = "https://play.geeklabs.io";

function getLeaderboardApiUrl(path, nativeRuntime = isNativeRuntime()) {
  return nativeRuntime ? new URL(path, NATIVE_API_ORIGIN).href : path;
}

const getLeaderboardStorageKey = (difficultyKey, mapKey = DEFAULT_MAP_KEY) => {
  const base = `${STORAGE_KEYS.leaderboard}:${normalizeDifficultyKey(difficultyKey)}`;
  // Preserve every existing local score under the original map's key.
  return normalizeMapKey(mapKey) === DEFAULT_MAP_KEY ? base : `${base}:${normalizeMapKey(mapKey)}`;
};

function compareLeaderboardEntries(a, b) {
  const scoreDiff = (Number(b.score) || 0) - (Number(a.score) || 0);
  if (scoreDiff) return scoreDiff;
  const waveDiff = (Number(b.wave) || 0) - (Number(a.wave) || 0);
  if (waveDiff) return waveDiff;
  const killsDiff = (Number(b.kills) || 0) - (Number(a.kills) || 0);
  if (killsDiff) return killsDiff;
  const fallbackDate = "9999-12-31T23:59:59.999Z";
  const dateA = typeof a.dateISO === "string" ? a.dateISO : fallbackDate;
  const dateB = typeof b.dateISO === "string" ? b.dateISO : fallbackDate;
  return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
}

function readLocalLeaderboard(storage, difficultyKey, mapKey = DEFAULT_MAP_KEY) {
  const key = getLeaderboardStorageKey(difficultyKey, mapKey);
  const raw = storage.read(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Leaderboard data not array.");
    return parsed.filter((entry) => entry && typeof entry === "object");
  } catch {
    storage.write(key, "[]");
    return [];
  }
}

function writeLocalLeaderboard(storage, entries, difficultyKey, mapKey = DEFAULT_MAP_KEY) {
  return storage.write(
    getLeaderboardStorageKey(difficultyKey, mapKey),
    JSON.stringify(entries)
  );
}

function recordLocalScore(storage, entry, difficultyKey, mapKey = entry?.mapKey ?? DEFAULT_MAP_KEY) {
  const entries = readLocalLeaderboard(storage, difficultyKey, mapKey);
  entries.push(entry);
  entries.sort(compareLeaderboardEntries);
  const trimmed = entries.slice(0, 10);
  writeLocalLeaderboard(storage, trimmed, difficultyKey, mapKey);
  return trimmed;
}

function recordLeaderboardScore({
  storage,
  entry,
  difficultyKey,
  mapKey = entry?.mapKey ?? DEFAULT_MAP_KEY,
  globalScoresEnabled = false,
  fetchImpl = globalThis.fetch,
}) {
  const localEntries = recordLocalScore(storage, entry, difficultyKey, mapKey);
  const globalSubmission = globalScoresEnabled
    ? submitGlobalScore({ ...entry, mapKey }, fetchImpl)
    : null;
  return { localEntries, globalSubmission };
}

async function fetchGlobalLeaderboard(
  difficultyKey,
  limit = 10,
  fetchImpl = globalThis.fetch,
  mapKey = DEFAULT_MAP_KEY
) {
  const difficulty = normalizeDifficultyKey(difficultyKey);
  const map = normalizeMapKey(mapKey);
  const url = getLeaderboardApiUrl(
    `/api/leaderboard?difficulty=${encodeURIComponent(difficulty)}&limit=${limit}${map === DEFAULT_MAP_KEY ? "" : `&map=${encodeURIComponent(map)}`}`
  );
  const response = await fetchImpl(url);
  if (!response.ok) throw new Error("Global leaderboard request failed");
  const data = await response.json();
  if (map !== DEFAULT_MAP_KEY && data.map !== map) {
    throw new Error("Online scores for this map are not available yet.");
  }
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map((item) => {
    const key = item.difficulty || difficulty;
    return {
      name: item.name || "Player",
      score: Number(item.score) || 0,
      wave: Number(item.wave) || 0,
      kills: Number(item.kills) || 0,
      difficultyKey: key,
      difficultyLabel: DIFFICULTY_CONFIG[key]?.label ?? key,
      dateISO: item.created_at,
    };
  });
}

async function submitGlobalScore(entry, fetchImpl = globalThis.fetch) {
  const rawDifficulty =
    entry?.difficultyKey ??
    entry?.difficultyLabel ??
    DEFAULT_DIFFICULTY_KEY;
  const map = normalizeMapKey(entry?.mapKey);
  const payload = {
    name: entry?.name,
    difficulty: normalizeDifficultyKey(rawDifficulty),
    score: entry?.score ?? 0,
    wave: entry?.wave ?? 0,
    kills: entry?.kills ?? 0,
    ...(map !== DEFAULT_MAP_KEY ? { map } : {}),
  };
  try {
    // Old servers ignore unknown fields. Require explicit map support before
    // sending a new-map score so it cannot contaminate the classic board.
    if (map !== DEFAULT_MAP_KEY) await fetchGlobalLeaderboard("easy", 1, fetchImpl, map);
    const response = await fetchImpl(getLeaderboardApiUrl("/api/score"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok ? { submitted: true } : { submitted: false };
  } catch {
    return { submitted: false };
  }
}

export {
  compareLeaderboardEntries,
  fetchGlobalLeaderboard,
  getLeaderboardApiUrl,
  getLeaderboardStorageKey,
  readLocalLeaderboard,
  recordLeaderboardScore,
  recordLocalScore,
  submitGlobalScore,
  writeLocalLeaderboard,
};

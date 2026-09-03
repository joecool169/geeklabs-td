import test from "node:test";
import assert from "node:assert/strict";

import {
  compareLeaderboardEntries,
  fetchGlobalLeaderboard,
  getLeaderboardApiUrl,
  getLeaderboardStorageKey,
  readLocalLeaderboard,
  recordLeaderboardScore,
  recordLocalScore,
  submitGlobalScore,
} from "../src/services/leaderboard.js";
import {
  STORAGE_KEYS,
  createStorageGateway,
  isPreferenceEnabled,
  normalizeDifficultyKey,
  normalizePlayerName,
} from "../src/services/preferences.js";
import {
  generateCallsign,
  isGeneratedCallsign,
  normalizeCallsign,
} from "../src/services/callsigns.js";
import { readRunOptions } from "../src/services/runOptions.js";

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    values,
  };
}

test("preferences preserve public storage keys and normalize inputs", () => {
  assert.equal(STORAGE_KEYS.playerName, "defense_protocol_player_name_v1");
  assert.equal(STORAGE_KEYS.difficulty, "defense_protocol_difficulty_v1");
  assert.equal(STORAGE_KEYS.leaderboard, "defense_protocol_leaderboard_v1");
  assert.equal(
    STORAGE_KEYS.globalScoresEnabled,
    "defense_protocol_global_scores_enabled_v2"
  );
  assert.equal(STORAGE_KEYS.soundEnabled, "defense_protocol_sound_enabled_v1");
  assert.equal(
    STORAGE_KEYS.balanceTelemetry,
    "defense_protocol_balance_telemetry_v2"
  );
  assert.equal(normalizePlayerName("  Cobalt-Falcon-472  "), "Cobalt-Falcon-472");
  assert.ok(isGeneratedCallsign(normalizePlayerName("heavy")));
  assert.equal(normalizeDifficultyKey("hard"), "hard");
  assert.equal(normalizeDifficultyKey("impossible"), "easy");
  assert.equal(isPreferenceEnabled(null), true);
  assert.equal(isPreferenceEnabled("true"), true);
  assert.equal(isPreferenceEnabled("false"), false);
  assert.equal(isPreferenceEnabled(null, false), false);
});

test("callsigns use only the fixed generated vocabulary", () => {
  const values = [0, 0.5, 0.999999];
  assert.equal(generateCallsign(() => values.shift()), "Amber-Ranger-999");
  assert.equal(isGeneratedCallsign("Amber-Ranger-999"), true);
  assert.equal(isGeneratedCallsign("anything a player typed"), false);
  assert.equal(
    normalizeCallsign("unsafe", () => 0),
    "Amber-Aegis-100"
  );
});

test("storage gateway isolates unavailable storage and mirrors successful writes", async () => {
  const memory = createMemoryStorage();
  const mirrored = [];
  const storage = createStorageGateway(memory, {
    writeThrough: async (key, value) => mirrored.push([key, value]),
  });
  assert.equal(storage.write("key", "value"), true);
  assert.equal(storage.read("key"), "value");
  await Promise.resolve();
  assert.deepEqual(mirrored, [["key", "value"]]);

  const unavailable = createStorageGateway({
    getItem() {
      throw new Error("blocked");
    },
    setItem() {
      throw new Error("blocked");
    },
  });
  assert.equal(unavailable.read("key"), null);
  assert.equal(unavailable.write("key", "value"), false);
});

test("local leaderboard repairs invalid data and keeps the best ten", () => {
  const memory = createMemoryStorage({
    [getLeaderboardStorageKey("hard")]: "not-json",
  });
  const storage = createStorageGateway(memory);
  assert.deepEqual(readLocalLeaderboard(storage, "hard"), []);
  assert.equal(memory.values.get(getLeaderboardStorageKey("hard")), "[]");

  for (let score = 1; score <= 12; score += 1) {
    recordLocalScore(storage, { name: `P${score}`, score }, "hard");
  }
  const entries = readLocalLeaderboard(storage, "hard");
  assert.equal(entries.length, 10);
  assert.equal(entries[0].score, 12);
  assert.equal(entries.at(-1).score, 3);
});

test("leaderboard tie breaking remains score, wave, kills, then date", () => {
  const entries = [
    { score: 100, wave: 10, kills: 50, dateISO: "2026-01-03" },
    { score: 101, wave: 1, kills: 1, dateISO: "2026-01-04" },
    { score: 100, wave: 11, kills: 1, dateISO: "2026-01-05" },
    { score: 100, wave: 10, kills: 51, dateISO: "2026-01-06" },
    { score: 100, wave: 10, kills: 50, dateISO: "2026-01-02" },
  ].sort(compareLeaderboardEntries);
  assert.deepEqual(
    entries.map(({ score, wave, kills, dateISO }) => [score, wave, kills, dateISO]),
    [
      [101, 1, 1, "2026-01-04"],
      [100, 11, 1, "2026-01-05"],
      [100, 10, 51, "2026-01-06"],
      [100, 10, 50, "2026-01-02"],
      [100, 10, 50, "2026-01-03"],
    ]
  );
});

test("global leaderboard service preserves request and response contracts", async () => {
  const requests = [];
  const fetchImpl = async (url, options) => {
    requests.push({ url, options });
    if (url === "/api/score") return { ok: true };
    return {
      ok: true,
      async json() {
        return {
          items: [
            {
              name: "special",
              score: "60273",
              wave: "54",
              kills: "3682",
              difficulty: "hard",
              created_at: "2026-08-22T00:00:00.000Z",
            },
          ],
        };
      },
    };
  };

  const entries = await fetchGlobalLeaderboard("hard", 10, fetchImpl);
  assert.equal(requests[0].url, "/api/leaderboard?difficulty=hard&limit=10");
  assert.deepEqual(entries[0], {
    name: "special",
    score: 60273,
    wave: 54,
    kills: 3682,
    difficultyKey: "hard",
    difficultyLabel: "Hard",
    dateISO: "2026-08-22T00:00:00.000Z",
  });

  await submitGlobalScore(
    { name: "special", difficultyKey: "hard", score: 60273, wave: 54, kills: 3682 },
    fetchImpl
  );
  assert.equal(requests[1].url, "/api/score");
  assert.deepEqual(JSON.parse(requests[1].options.body), {
    name: "special",
    difficulty: "hard",
    score: 60273,
    wave: 54,
    kills: 3682,
  });
});

test("leaderboard API URLs stay same-origin on web and use production on native", () => {
  assert.equal(getLeaderboardApiUrl("/api/score", false), "/api/score");
  assert.equal(
    getLeaderboardApiUrl("/api/score", true),
    "https://play.geeklabs.io/api/score"
  );
  assert.equal(
    getLeaderboardApiUrl("/api/leaderboard?difficulty=hard&limit=10", true),
    "https://play.geeklabs.io/api/leaderboard?difficulty=hard&limit=10"
  );
});

test("score recording always stays local and only submits globally when enabled", async () => {
  const memory = createMemoryStorage();
  const storage = createStorageGateway(memory);
  const requests = [];
  const fetchImpl = async (url) => {
    requests.push(url);
    return { ok: true };
  };
  const entry = {
    name: "Player",
    difficultyKey: "easy",
    score: 100,
    wave: 4,
    kills: 20,
  };

  const localOnly = recordLeaderboardScore({
    storage,
    entry,
    difficultyKey: "easy",
    globalScoresEnabled: false,
    fetchImpl,
  });
  assert.equal(localOnly.localEntries.length, 1);
  assert.equal(localOnly.globalSubmission, null);
  assert.deepEqual(requests, []);

  const online = recordLeaderboardScore({
    storage,
    entry: { ...entry, score: 200 },
    difficultyKey: "easy",
    globalScoresEnabled: true,
    fetchImpl,
  });
  await online.globalSubmission;
  assert.deepEqual(requests, ["/api/score"]);
  assert.equal(readLocalLeaderboard(storage, "easy")[0].score, 200);
});

test("run options parse deterministic seed and label without browser globals", () => {
  assert.deepEqual(
    readRunOptions("?seed=specialists-v0.4.0&run=mixed-specialist"),
    { seed: "specialists-v0.4.0", runLabel: "mixed-specialist" }
  );
  assert.deepEqual(readRunOptions(""), { seed: null, runLabel: null });
});

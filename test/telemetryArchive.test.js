import test from "node:test";
import assert from "node:assert/strict";

import { createRunTelemetry } from "../src/game/telemetry.js";
import { STORAGE_KEYS } from "../src/services/preferences.js";
import { publishTelemetryArchive } from "../src/services/telemetryArchive.js";

test("telemetry archive service isolates storage and debug publication", () => {
  const values = new Map();
  const storage = {
    read: (key) => values.get(key) ?? null,
    write: (key, value) => values.set(key, value),
  };
  const target = {};
  const telemetry = createRunTelemetry({
    seed: "archive-test",
    difficultyKey: "hard",
    runLabel: "service",
  });

  const published = publishTelemetryArchive({ storage, telemetry, target });
  assert.equal(target.defenseProtocolTelemetry.runId, telemetry.runId);
  assert.equal(
    target.defenseProtocolTelemetryRuns[telemetry.runId].seed,
    "archive-test"
  );
  assert.deepEqual(
    JSON.parse(values.get(STORAGE_KEYS.balanceTelemetry)),
    published.archive
  );
});

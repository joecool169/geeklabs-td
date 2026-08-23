import {
  snapshotRunTelemetry,
  updateTelemetryArchive,
} from "../game/telemetry.js";
import { STORAGE_KEYS } from "./preferences.js";

function publishTelemetryArchive({ storage, telemetry, target = globalThis }) {
  const snapshot = snapshotRunTelemetry(telemetry);
  if (!snapshot) return null;
  const archive = updateTelemetryArchive(
    storage.read(STORAGE_KEYS.balanceTelemetry),
    snapshot
  );
  storage.write(STORAGE_KEYS.balanceTelemetry, JSON.stringify(archive));
  if (target) {
    target.defenseProtocolTelemetry = snapshot;
    target.defenseProtocolTelemetryRuns = archive.runs;
  }
  return { snapshot, archive };
}

export { publishTelemetryArchive };

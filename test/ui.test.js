import test from "node:test";
import assert from "node:assert/strict";

import { formatHudText, formatTouchTowerStats } from "../src/game/ui.js";

test("HUD text is compact, grouped, and readable at large values", () => {
  assert.equal(
    formatHudText({
      money: 1234,
      lives: 20,
      towers: 37,
      wave: 54,
      kills: 3626,
      score: 43659,
      diff: "Easy",
    }),
    "MONEY $1,234   •   LIVES 20   •   TOWERS 37   •   WAVE 54   •   KILLS 3,626   •   SCORE 43,659   •   EASY"
  );
});

test("touch tower stats summarize combat output compactly", () => {
  assert.equal(
    formatTouchTowerStats({ damage: 24, range: 130, fireMs: 170 }),
    "DMG 24  •  RNG 130  •  RATE 5.9/s  •  DPS 141.2"
  );
});

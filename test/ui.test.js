import test from "node:test";
import assert from "node:assert/strict";
import { OverlayManager } from "../src/ui/OverlayManager.js";
import { isGeneratedCallsign } from "../src/services/callsigns.js";

import {
  formatHudText,
  formatTouchTowerStats,
  formatWaveHint,
  formatWavePreview,
  formatTowerSpecialty,
} from "../src/game/ui.js";

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
    "DMG 24  •  RNG 130  •  RATE 5.9/s  •  BASE DPS 141.2"
  );
});

test("wave preview names new threats and omits absent enemies", () => {
  assert.equal(formatWavePreview({ wave: 15, counts: { runner: 12, sprinter: 3, brute: 0 } }),
    "NEXT W15 • 12 Runner · 3 Sprinter NEW");
});

test("specialist descriptions expose bonuses and Laser's non-base damage", () => {
  assert.match(formatTowerSpecialty("rapid"), /×1.5 vs Sprinter/);
  assert.match(formatTowerSpecialty("rapid"), /Armor penalty ×2/);
  assert.match(formatTowerSpecialty("sniper"), /×1.6 vs Brute/);
  assert.match(formatTowerSpecialty("laser"), /Ignores 3 armor.*Pierces 5.*×0.7 per hit.*×2.5 in 2s.*persists between targets/);
});

test("game-over overlay renders actual escapes and dispatches replay/change actions", () => {
  const previousDocument = globalThis.document;
  const makeNode = () => ({
    children: [], style: {}, listeners: {},
    append(...nodes) { this.children.push(...nodes); },
    addEventListener(event, handler) { this.listeners[event] = handler; },
    remove() { this.removed = true; },
    querySelector() { return null; },
  });
  globalThis.document = { createElement: makeNode };
  try {
    const manager = new OverlayManager({ host: makeNode(), storage: {} });
    const actions = [];
    const overlay = manager.showGameOver({
      result: {
        playerName: "Test", difficultyKey: "hard", difficultyLabel: "Hard",
        wave: 49, kills: 3089, score: 50629,
        escapedByType: { runner: 15, brute: 3, armored: 2 },
        escapesByWave: { 46: 2, 49: 18 },
      },
      onRestart: () => actions.push("restart"),
      onChange: () => actions.push("change"),
    });
    const flatten = node => [node, ...node.children.flatMap(flatten)];
    const nodes = flatten(overlay);
    const texts = nodes.map(node => node.textContent);
    for (const expected of ["50629", "3089", "Runner: 15", "Brute: 3", "Armored: 2", "W46: 2", "W49: 18"]) {
      assert.ok(texts.includes(expected), expected);
    }
    assert.ok(texts.includes("Escaped enemies: 20 • View breakdown"));
    const buttons = nodes.find(node => node.className === "game-overlay-actions");
    const losses = nodes.find(node => node.className === "game-over-losses");
    assert.ok(nodes.indexOf(buttons) < nodes.indexOf(losses), "replay precedes expandable detail");
    nodes.find(node => node.textContent === "Re-engage").listeners.click();
    assert.equal(overlay.removed, true);
    nodes.find(node => node.textContent === "Change name / difficulty").listeners.click();
    assert.deepEqual(actions, ["restart", "change"]);
  } finally {
    globalThis.document = previousDocument;
  }
});

test("start overlay uses generated callsigns and requires leaderboard opt-in", () => {
  const previousDocument = globalThis.document;
  const makeNode = () => {
    const node = {
      children: [], style: {}, listeners: {}, attributes: {}, className: "",
      append(...nodes) { this.children.push(...nodes); },
      addEventListener(event, handler) { this.listeners[event] = handler; },
      setAttribute(name, value) { this.attributes[name] = String(value); },
      remove() { this.removed = true; },
      querySelector() { return null; },
      querySelectorAll() { return []; },
    };
    node.classList = {
      add(...names) { node.className = `${node.className} ${names.join(" ")}`.trim(); },
      toggle() {},
    };
    return node;
  };
  globalThis.document = { createElement: makeNode };
  try {
    const host = makeNode();
    const manager = new OverlayManager({ host, storage: {} });
    let startOptions;
    const overlay = manager.showStart({
      playerName: "Cobalt-Falcon-472",
      difficultyKey: "easy",
      onStart: options => { startOptions = options; },
    });
    const flatten = node => [node, ...node.children.flatMap(flatten)];
    const nodes = flatten(overlay);
    const callsign = nodes.find(node => node.attributes["aria-label"] === "Generated callsign");
    const checkbox = nodes.find(node => node.type === "checkbox");
    const reroll = nodes.find(node => node.textContent === "Generate another");
    const engage = nodes.find(node => node.textContent === "Engage Protocol");

    assert.equal(callsign.readOnly, true);
    assert.equal(callsign.value, "Cobalt-Falcon-472");
    assert.equal(checkbox.checked, false);
    reroll.listeners.click();
    assert.equal(isGeneratedCallsign(callsign.value), true);
    engage.listeners.click();
    assert.equal(startOptions.globalScoresEnabled, false);
    assert.equal(startOptions.playerName, callsign.value);
  } finally {
    globalThis.document = previousDocument;
  }
});

test("wave hints use device-appropriate actions", () => {
  const state = {
    wave: 4,
    waveState: "intermission",
    didStartFirstWave: false,
    ready: true,
    seconds: 0,
    autoStartWaves: false,
  };
  assert.match(formatWaveHint({ ...state, touchUi: true }), /Tap Start Wave/);
  assert.doesNotMatch(formatWaveHint({ ...state, touchUi: true }), /SPACE/);
  assert.match(formatWaveHint({ ...state, touchUi: false }), /SPACE to start/);

  for (const autoStartWaves of [false, true]) {
    const countdown = {
      ...state,
      didStartFirstWave: true,
      ready: false,
      seconds: 2,
      autoStartWaves,
    };
    const touchHint = formatWaveHint({ ...countdown, touchUi: true });
    assert.match(touchHint, /Tap Start Wave to deploy now/);
    assert.doesNotMatch(touchHint, /SPACE|twice/);
    assert.match(
      formatWaveHint({ ...countdown, touchUi: false }),
      /SPACE twice to deploy now/
    );
  }
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  RunController,
  computeKillScore,
} from "../src/core/RunController.js";
import { RunState, attachRunState } from "../src/core/RunState.js";

test("run state compatibility fields share one explicit state owner", () => {
  const state = new RunState({ startingLives: 20, startScreenActive: true });
  const owner = attachRunState({}, state);

  owner.money = 125;
  owner.lives = 18;
  owner.killCount = 42;
  owner.wave = 7;
  owner.waveState = "running";

  assert.deepEqual(state.snapshot(), {
    money: 125,
    lives: 18,
    kills: 42,
    score: 0,
    wave: 7,
    waveState: "running",
    isPaused: false,
    isGameOver: false,
    isStartScreenActive: true,
  });
  state.score = 900;
  assert.equal(owner.score, 900);
});

test("run controller preserves reward and scoring transitions", () => {
  const state = new RunState();
  const controller = new RunController(state);
  controller.applyStartingMoney(200);
  assert.equal(controller.spend(50), true);
  assert.equal(controller.spend(151), false);
  assert.equal(controller.earn(50), 50);
  assert.equal(controller.awardWaveClear(25), 25);

  assert.equal(computeKillScore(7, 0.9, 1.35), 22);
  assert.deepEqual(
    controller.recordKill({
      reward: 7,
      scoreWeight: 0.9,
      scoreMultiplier: 1.35,
    }),
    { reward: 7, scoreGain: 22 }
  );
  assert.equal(state.money, 232);
  assert.equal(state.kills, 1);
  assert.equal(state.score, 47);
});

test("run controller owns life, pause, start, and game-over transitions", () => {
  const state = new RunState({ startingLives: 2 });
  const controller = new RunController(state);

  assert.equal(controller.loseLife(), false);
  assert.equal(state.lives, 1);
  assert.equal(controller.loseLife(), true);
  assert.equal(state.lives, 0);
  assert.equal(controller.setPaused(true), true);
  assert.equal(controller.setPaused(true), false);
  controller.startGame();
  assert.equal(state.isStartScreenActive, false);
  assert.equal(controller.endGame(), true);
  assert.equal(controller.endGame(), false);
});

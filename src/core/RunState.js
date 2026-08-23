const RUN_STATE_FIELDS = Object.freeze({
  money: "money",
  lives: "lives",
  killCount: "kills",
  score: "score",
  wave: "wave",
  waveState: "waveState",
  isPaused: "isPaused",
  isGameOver: "isGameOver",
  isStartScreenActive: "isStartScreenActive",
});

class RunState {
  constructor({ startingLives = 20, startScreenActive = true } = {}) {
    this.money = 0;
    this.lives = startingLives;
    this.kills = 0;
    this.score = 0;
    this.wave = 1;
    this.waveState = "intermission";
    this.isPaused = false;
    this.isGameOver = false;
    this.isStartScreenActive = startScreenActive;
  }

  snapshot() {
    return {
      money: this.money,
      lives: this.lives,
      kills: this.kills,
      score: this.score,
      wave: this.wave,
      waveState: this.waveState,
      isPaused: this.isPaused,
      isGameOver: this.isGameOver,
      isStartScreenActive: this.isStartScreenActive,
    };
  }
}

function attachRunState(owner, state) {
  owner.runState = state;
  for (const [ownerField, stateField] of Object.entries(RUN_STATE_FIELDS)) {
    Object.defineProperty(owner, ownerField, {
      configurable: true,
      enumerable: true,
      get() {
        return this.runState[stateField];
      },
      set(value) {
        this.runState[stateField] = value;
      },
    });
  }
  return owner;
}

export { RUN_STATE_FIELDS, RunState, attachRunState };

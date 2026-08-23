function computeKillScore(reward, scoreWeight, scoreMultiplier) {
  const baseScoreGain = reward + Math.round(scoreWeight * 10);
  return Math.round(baseScoreGain * scoreMultiplier);
}

class RunController {
  constructor(state) {
    this.state = state;
  }

  applyStartingMoney(amount) {
    this.state.money = Number(amount) || 0;
  }

  spend(amount) {
    const cost = Math.max(0, Number(amount) || 0);
    if (this.state.money < cost) return false;
    this.state.money -= cost;
    return true;
  }

  earn(amount) {
    const value = Math.max(0, Number(amount) || 0);
    this.state.money += value;
    return value;
  }

  awardWaveClear(amount) {
    const value = this.earn(amount);
    this.state.score += value;
    return value;
  }

  recordKill({ reward = 8, scoreWeight = 1, scoreMultiplier = 1 } = {}) {
    const normalizedReward = Number(reward) || 0;
    const scoreGain = computeKillScore(
      normalizedReward,
      Number(scoreWeight) || 0,
      Number(scoreMultiplier) || 1
    );
    this.state.money += normalizedReward;
    this.state.kills += 1;
    this.state.score += scoreGain;
    return { reward: normalizedReward, scoreGain };
  }

  loseLife(amount = 1) {
    this.state.lives -= Math.max(0, Number(amount) || 0);
    return this.state.lives <= 0;
  }

  setPaused(paused) {
    const next = !!paused;
    const changed = next !== this.state.isPaused;
    this.state.isPaused = next;
    return changed;
  }

  startGame() {
    this.state.isStartScreenActive = false;
  }

  endGame() {
    if (this.state.isGameOver) return false;
    this.state.isGameOver = true;
    return true;
  }
}

export { RunController, computeKillScore };

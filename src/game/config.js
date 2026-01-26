export const GRID = 40;
export const TOP_UI = 120;
export const WAVE_SPAM_WINDOW_MS = 900;
export const MAX_CONCURRENT_SPAWNERS = 8;

export const DIFFICULTY_CONFIG = {
  easy: {
    label: "Easy",
    enemyHpMul: 1,
    enemySpeedMul: 1,
    enemyRewardMul: 1,
    scoreMul: 1,
    startingMoney: 120,
  },
  medium: {
    label: "Medium",
    enemyHpMul: 1.2,
    enemySpeedMul: 1.08,
    enemyRewardMul: 0.9,
    scoreMul: 1.2,
    startingMoney: 105,
  },
  hard: {
    label: "Hard",
    enemyHpMul: 1.45,
    enemySpeedMul: 1.15,
    enemyRewardMul: 0.8,
    scoreMul: 1.45,
    startingMoney: 90,
  },
};

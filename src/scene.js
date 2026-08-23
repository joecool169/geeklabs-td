import Phaser from "phaser";
import {
  DIFFICULTY_CONFIG,
  GRID,
  MAX_CONCURRENT_SPAWNERS,
  TOP_UI,
  WAVE_SPAM_WINDOW_MS,
} from "./game/config.js";
import { dist2, segCircleHit, snapX, snapY } from "./game/utils.js";
import * as Bullets from "./game/bullets.js";
import * as Balance from "./game/balance.js";
import * as Enemies from "./game/enemies.js";
import * as UI from "./game/ui.js";
import * as Towers from "./game/towers.js";
import * as Waves from "./game/waves.js";
import * as Telemetry from "./game/telemetry.js";
import { normalizeRunSeed } from "./game/random.js";
import { ENEMY_DEFS, TOWER_DEFS, WAVE_CADENCE } from "./constants.js";
import {
  recordLocalScore,
  submitGlobalScore,
} from "./services/leaderboard.js";
import {
  STORAGE_KEYS,
  createStorageGateway,
  normalizeDifficultyKey,
  normalizePlayerName,
} from "./services/preferences.js";
import { readRunOptions } from "./services/runOptions.js";
import { OverlayManager } from "./ui/OverlayManager.js";
import { GameDomView } from "./ui/GameDomView.js";
import { GAME_ACTIONS } from "./input/actions.js";
import { InputController } from "./input/InputController.js";
import { RunController } from "./core/RunController.js";
import { RunState, attachRunState } from "./core/RunState.js";
import {
  WorldRenderer,
  getTowerTextureKey,
  pointToSegmentDistance,
} from "./presentation/WorldRenderer.js";

const storage = createStorageGateway();
const SFX_CONFIG = {
  place: { url: "/sfx/place.wav", volume: 0.26 },
  upgrade: { url: "/sfx/upgrade.wav", volume: 0.26 },
  sell: { url: "/sfx/sell.wav", volume: 0.26 },
  wave: { url: "/sfx/wave.wav", volume: 0.35 },
  death: { url: "/sfx/death.wav", volume: 0.35 },
  life: { url: "/sfx/life.wav", volume: 0.35 },
  gameover: { url: "/sfx/gameover.wav", volume: 0.45 },
};
export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    Object.entries(SFX_CONFIG).forEach(([key, cfg]) => {
      if (!cfg?.url) return;
      this.load.audio(key, cfg.url);
    });
  }

  init(data) {
    this.startOptions = data || {};
  }

  create() {
    const overlayHost = this.game?.canvas?.parentElement;
    this.overlays = new OverlayManager({ host: overlayHost, storage });

    this.playerName = normalizePlayerName(storage.read(STORAGE_KEYS.playerName));
    this.difficultyKey = normalizeDifficultyKey(
      storage.read(STORAGE_KEYS.difficulty)
    );
    if (this.startOptions?.playerName) this.playerName = normalizePlayerName(this.startOptions.playerName);
    if (this.startOptions?.difficultyKey) this.difficultyKey = normalizeDifficultyKey(this.startOptions.difficultyKey);
    this.difficulty = DIFFICULTY_CONFIG[this.difficultyKey];
    this.difficultyLabel = this.difficulty.label;
    const queryOptions = readRunOptions();
    const querySeed = queryOptions.seed;
    const queryRunLabel = queryOptions.runLabel;
    this.runSeed = normalizeRunSeed(this.startOptions?.runSeed ?? querySeed);
    this.runLabel = String(
      this.startOptions?.runLabel ?? queryRunLabel ?? "unlabeled"
    ).trim() || "unlabeled";
    this.runTelemetry = null;

    this.sfx = {};
    this.sfxLastAt = {};
    this.playSfx = (key, opts = {}) => {
      const {
        allowDuringPause = false,
        allowDuringStart = false,
        allowDuringGameOver = false,
      } = opts;
      if (!allowDuringStart && this.isStartScreenActive) return;
      if (!allowDuringPause && this.isPaused) return;
      if (!allowDuringGameOver && this.isGameOver) return;
      const sound = this.sfx[key];
      if (!sound) return;
      const minInterval = key === "death" ? 100 : 0;
      const lastAt = this.sfxLastAt[key] || 0;
      const now = this.time?.now ?? Date.now();
      if (now - lastAt < minInterval) return;
      if (sound.isPlaying) return;
      sound.play();
      this.sfxLastAt[key] = now;
    };

    attachRunState(
      this,
      new RunState({
        startingLives: 20,
        startScreenActive: !this.startOptions?.skipStartScreen,
      })
    );
    this.runController = new RunController(this.runState);
    this.enemyRewardRoundingCarry = Enemies.createEnemyRewardCarry();

    this.wave = 1;
    this.waveState = "intermission";
    this.waveEnemiesTotal = 0;
    this.waveEnemiesSpawned = 0;
    this.waveSpawnDelayMs = 650;
    this.waveNextSpawnAt = 0;
    this.intermissionMs = 2000;
    this.nextWaveAvailableAt = 0;
    this.autoStartWaves = true;
    this.autoStartTimer = null;
    this.didStartFirstWave = false;
    this.activeWaves = [];
    this.spaceArmedAt = 0;
    this.spaceArmMode = null;
    this.nextWaveNumberToSpawn = this.wave;
    this.blockWaveStart = this.wave;

    this.swarmPacksRemaining = 0;
    this.swarmPackSpacingMs = WAVE_CADENCE.packSpacingMs;
    this.swarmNextPackSpawnAt = 0;

    this.worldRenderer = new WorldRenderer(this);
    this.worldRenderer.create();
    this.path = this.worldRenderer.path;

    this.towers = [];
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();

    this.selectedTower = null;

    this.ui = this.add.text(14, 12, "", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#dbe7ff",
    });
    this.uiBaseColor = "#dbe7ff";

    this.helpIndicator = null;
    this.helpIndicatorTween = null;

    this.placeHint = this.add.text(14, 56, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#9fb3d8",
    });
   
    this.waveHint = this.add.text(14, TOP_UI - 34, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#dbe7ff",
      backgroundColor: "rgba(0,0,0,0.35)",
      padding: { x: 8, y: 6 },
    });

    this.transitionBanner = this.add
      .text(this.scale.width / 2, TOP_UI + 42, "", {
        fontFamily: "monospace",
        fontSize: "22px",
        fontStyle: "bold",
        color: "#dbe7ff",
        backgroundColor: "rgba(10, 23, 38, 0.88)",
        padding: { x: 18, y: 9 },
        stroke: "#071019",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0)
      .setDepth(95000)
      .setVisible(false)
      .setAlpha(0);

    this.toast = this.add.text(14, 146, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#dbe7ff",
      backgroundColor: "rgba(0,0,0,0.55)",
      padding: { x: 8, y: 6 },
    });
    this.toast.setDepth(100000);
    this.toast.setVisible(false);
    this.toastTimer = null;
    this.didShowPlaceToast = false;
    this.lifeFlashRect = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0xff3b3b, 0.18);
    this.lifeFlashRect.setOrigin(0, 0);
    this.lifeFlashRect.setDepth(90000);
    this.lifeFlashRect.setVisible(false);
    this.lifeFlashTween = null;
    this.lifeHudTween = null;

    Object.entries(SFX_CONFIG).forEach(([key, cfg]) => {
      if (!this.cache.audio.exists(key)) return;
      const volume = typeof cfg.volume === "number" ? cfg.volume : 0.4;
      this.sfx[key] = this.sound.add(key, { volume });
    });
    this.showHelp = storage.read(STORAGE_KEYS.helpOverlay) === "true";
    this.buildTowerDefs = Object.values(TOWER_DEFS).sort(
      (a, b) => Number(a.hotkey) - Number(b.hotkey)
    );
    this.domView = new GameDomView();
    this.domView.bind({
      towerDefs: this.buildTowerDefs,
      onSelectTowerType: (type) => {
        if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
        this.trySetPlaceType(type);
      },
      onUpgrade: () => {
        if (!this.selectedTower || !this.towers.includes(this.selectedTower)) return;
        this.tryUpgradeTower(this.selectedTower);
      },
      onSell: () => {
        if (!this.selectedTower || !this.towers.includes(this.selectedTower)) return;
        this.trySellTower(this.selectedTower);
      },
      onTarget: () => {
        if (!this.selectedTower || !this.towers.includes(this.selectedTower)) return;
        this.cycleTargetMode(this.selectedTower);
      },
    });
    Object.assign(this, this.domView.refs);
    this.towerStripSlots = this.domView.towerStripSlots;
    this._uiCache = null;
    this._towerStripWave = null;
    this.pauseText = this.add
      .text(540, 14, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5, 0)
      .setDepth(100000)
      .setVisible(false);

    this.setHelpOverlay(this.showHelp);

    this.setPaused = (paused) => {
      const p = !!paused;
      if (p === this.isPaused) return;
      this.runController.setPaused(p);
      this.physics.world.isPaused = this.isPaused;
      if (this.autoStartTimer) this.autoStartTimer.paused = this.isPaused;
      if (this.isPaused && this.isPlacing) this.setPlacement(false);
      this.pauseText.setText(this.isPaused ? "PAUSED — P / ESC to resume" : "");
      this.pauseText.setVisible(this.isPaused);
      if (this.isPaused) {
        UI.clearTransitionBanner.call(this);
        this.showPauseMenu();
      } else {
        this.hidePauseMenu();
      }
    };

    this.togglePause = () => this.setPaused(!this.isPaused);

    this.ghost = null;
    this.isPlacing = false;
    this.placeType = "basic";
    this.ghostValid = false;
    this.ghostX = 0;
    this.ghostY = 0;

    this.inputController = new InputController({
      input: this.input,
      keyCodes: Phaser.Input.Keyboard.KeyCodes,
      onAction: (action) => this.handleInputAction(action),
    });

    this.updateUI();
    this.enterIntermission(true);
    this.events.once("shutdown", () => {
      UI.clearTransitionBanner.call(this);
      this.overlays?.destroy();
      this.overlays = null;
      this.domView?.destroy();
      this.domView = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.worldRenderer?.destroy();
      this.worldRenderer = null;
    });
    if (this.isStartScreenActive) {
      this.showStartScreen();
    } else {
      this.applyDifficulty(this.difficultyKey);
    }
  }

  handleInputAction(action) {
    if (!action?.type) return;
    if (action.type === GAME_ACTIONS.TOGGLE_PAUSE) {
      if (this.isStartScreenActive || this.isGameOver) return;
      this.togglePause();
      return;
    }
    if (action.type === GAME_ACTIONS.CANCEL) {
      if (this.isStartScreenActive || this.isGameOver) return;
      if (this.isPaused) {
        this.hidePauseMenu();
        this.setPaused(false);
      } else if (this.isPlacing) {
        this.setPlacement(false);
      } else if (this.selectedTower) {
        this.clearSelection();
      }
      return;
    }
    if (action.type === GAME_ACTIONS.TOGGLE_HELP) {
      if (this.isStartScreenActive || this.isGameOver) return;
      this.emphasizeControlsPanel();
      this.setHelpOverlay(!this.showHelp);
      return;
    }
    if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;

    switch (action.type) {
      case GAME_ACTIONS.TOGGLE_PLACEMENT:
        this.togglePlacement();
        break;
      case GAME_ACTIONS.SELECT_TOWER_TYPE:
        this.trySetPlaceType(action.towerType);
        break;
      case GAME_ACTIONS.UPGRADE_SELECTED:
        if (this.selectedTower && this.towers.includes(this.selectedTower)) {
          this.tryUpgradeTower(this.selectedTower);
        }
        break;
      case GAME_ACTIONS.SELL_SELECTED:
        if (this.selectedTower && this.towers.includes(this.selectedTower)) {
          this.trySellTower(this.selectedTower);
        }
        break;
      case GAME_ACTIONS.CYCLE_TARGETING:
        if (this.selectedTower && this.towers.includes(this.selectedTower)) {
          this.cycleTargetMode(this.selectedTower);
        }
        break;
      case GAME_ACTIONS.START_WAVE:
        this.handleStartWaveInput(this.time.now);
        break;
      case GAME_ACTIONS.SECONDARY_AT:
        this.handleSecondaryPointer(action.x, action.y);
        break;
      case GAME_ACTIONS.PRIMARY_AT:
        this.handlePrimaryPointer(action.x, action.y, action.modified);
        break;
      case GAME_ACTIONS.POINTER_MOVED:
        if (this.isPlacing) this.updateGhost(action.x, action.y);
        break;
      default:
        break;
    }
  }

  handleStartWaveInput(now) {
    if (this.waveState === "intermission") {
      if (now < this.nextWaveAvailableAt) {
        if (
          this.spaceArmMode === "intermission" &&
          now - this.spaceArmedAt <= WAVE_SPAM_WINDOW_MS
        ) {
          this.spaceArmedAt = 0;
          this.spaceArmMode = null;
          this.nextWaveAvailableAt = Math.min(this.nextWaveAvailableAt, now);
          this.startWave(this.nextWaveNumberToSpawn);
          this.nextWaveNumberToSpawn += 1;
          if (!this.didStartFirstWave) this.didStartFirstWave = true;
        } else {
          this.spaceArmedAt = now;
          this.spaceArmMode = "intermission";
          this.showToast("Press SPACE again to start early.", 1400);
        }
        return;
      }
      this.spaceArmedAt = 0;
      this.spaceArmMode = null;
      this.startWave(this.nextWaveNumberToSpawn);
      this.nextWaveNumberToSpawn += 1;
      if (!this.didStartFirstWave) this.didStartFirstWave = true;
      return;
    }
    if (this.waveState !== "running") return;
    if ((this.activeWaves?.length || 0) >= MAX_CONCURRENT_SPAWNERS) {
      this.showToast(`Spawner cap reached (${MAX_CONCURRENT_SPAWNERS}).`, 1400);
      return;
    }
    if (
      this.spaceArmMode === "running" &&
      now - this.spaceArmedAt <= WAVE_SPAM_WINDOW_MS
    ) {
      this.spaceArmedAt = 0;
      this.spaceArmMode = null;
      this.startWave(this.nextWaveNumberToSpawn);
      this.nextWaveNumberToSpawn += 1;
      return;
    }
    this.spaceArmedAt = now;
    this.spaceArmMode = "running";
    this.showToast("Press SPACE again to add a spawner.", 1400);
  }

  handleSecondaryPointer(x, y) {
    const tower = this.getTowerAt(x, y);
    if (tower) {
      this.trySellTower(tower);
    } else if (this.isPlacing) {
      this.setPlacement(false);
    }
  }

  handlePrimaryPointer(x, y, modified = false) {
    if (this.isPlacing) {
      if (this.ghostValid) {
        this.tryPlaceTowerAt(this.ghostX, this.ghostY);
        this.refreshGhostVisual();
      }
      return;
    }
    const tower = this.getTowerAt(x, y);
    if (tower) {
      if (modified) this.tryUpgradeTower(tower);
      this.selectTower(tower);
      return;
    }
    this.clearSelection();
  }

  showToast(msg, ms = 2400) {
    UI.showToast.call(this, msg, ms);
  }

  updateUI() {
    UI.updateUI.call(this);
  }

  showWaveTransition(text, tone = "neutral", duration = 1100) {
    UI.showTransitionBanner.call(this, text, tone, duration);
  }

  applyDifficulty(key, opts = {}) {
    const normalized = normalizeDifficultyKey(key);
    const cfg = DIFFICULTY_CONFIG[normalized];
    this.difficultyKey = normalized;
    this.difficulty = cfg;
    this.difficultyLabel = cfg.label;
    this.runController.applyStartingMoney(cfg.startingMoney);
    this.runTelemetry = Telemetry.createRunTelemetry({
      seed: this.runSeed,
      difficultyKey: normalized,
      runLabel: this.runLabel,
      startingLives: this.lives,
    });
    this.publishRunTelemetry();
    console.info("[Defense Protocol balance run]", {
      run: this.runLabel,
      seed: this.runSeed,
      difficulty: normalized,
    });
  }

  showStartScreen() {
    if (!this.overlays?.host) {
      this.runController.startGame();
      this.applyDifficulty(this.difficultyKey);
      return;
    }
    this.inputController?.setKeyboardEnabled(false);
    this.overlays.showStart({
      playerName: this.playerName,
      difficultyKey: this.difficultyKey,
      onStart: ({ playerName, difficultyKey }) => {
        const name = normalizePlayerName(playerName);
        this.playerName = name;
        storage.write(STORAGE_KEYS.playerName, name);
        this.applyDifficulty(difficultyKey);
        storage.write(STORAGE_KEYS.difficulty, difficultyKey);
        this.runController.startGame();
        this.inputController?.setKeyboardEnabled(true);
        this.overlays.remove("defense-protocol-start-overlay");
      },
    });
  }

  showGameOverScreen() {
    this.overlays?.showGameOver({
      result: {
        playerName: this.playerName,
        difficultyKey: this.difficultyKey,
        difficultyLabel: this.difficultyLabel,
        wave: this.wave,
        kills: this.killCount,
        score: this.score,
      },
      currentEntry: this.lastLeaderboardEntry,
      onRestart: () => {
        this.scene.restart({
          skipStartScreen: true,
          playerName: this.playerName,
          difficultyKey: this.difficultyKey,
        });
      },
      onChange: () => this.scene.restart(),
    });
  }

  showPauseMenu() {
    if (this.isStartScreenActive || this.isGameOver) return;
    this.overlays?.showPause({
      difficultyKey: this.difficultyKey,
      onResume: () => this.setPaused(false),
      onRestart: () => {
        this.setPaused(false);
        this.hidePauseMenu();
        this.scene.restart({
          skipStartScreen: true,
          playerName: this.playerName,
          difficultyKey: this.difficultyKey,
        });
      },
      onChange: () => {
        this.setPaused(false);
        this.hidePauseMenu();
        this.scene.restart();
      },
    });
  }

  hidePauseMenu() {
    this.overlays?.hidePause();
  }

  triggerLifeLossFeedback() {
    if (this.isStartScreenActive || this.isPaused) return;
    if (this.lifeHudTween) {
      this.lifeHudTween.stop();
      this.lifeHudTween = null;
    }
    if (this.lifeFlashTween) {
      this.lifeFlashTween.stop();
      this.lifeFlashTween = null;
    }

    if (this.ui) {
      this.ui.setColor("#ffd1d1");
      this.ui.setAlpha(0.7);
      this.lifeHudTween = this.tweens.add({
        targets: this.ui,
        alpha: 1,
        duration: 150,
        onComplete: () => {
          this.ui.setColor(this.uiBaseColor || "#dbe7ff");
          this.lifeHudTween = null;
        },
      });
    }

    if (this.lifeFlashRect) {
      this.lifeFlashRect.width = this.scale.width;
      this.lifeFlashRect.height = this.scale.height;
      this.lifeFlashRect.setAlpha(0.18);
      this.lifeFlashRect.setVisible(true);
      this.lifeFlashTween = this.tweens.add({
        targets: this.lifeFlashRect,
        alpha: 0,
        duration: 120,
        onComplete: () => {
          this.lifeFlashRect.setVisible(false);
          this.lifeFlashTween = null;
        },
      });
    }
  }

  emphasizeControlsPanel() {
    this.domView?.emphasizeControls();
  }

  triggerGameOver() {
    if (!this.runController.endGame()) return;
    const finalTelemetry = Telemetry.recordFinalSnapshot(this.runTelemetry, {
      outcome: "game-over",
      wave: this.wave,
      money: this.money,
      lives: this.lives,
      score: this.score,
      kills: this.killCount,
      activeEnemies: this.enemies.countActive(true),
      towers: this.towers,
    });
    if (finalTelemetry) {
      this.publishRunTelemetry();
      console.info("[Defense Protocol balance final]", {
        run: this.runLabel,
        seed: this.runSeed,
        final: finalTelemetry,
      });
    }
    UI.clearTransitionBanner.call(this);
    this.playSfx("gameover", { allowDuringGameOver: true });
    for (const t of this.towers) {
      if (t.beam) {
        t.beam.destroy();
        t.beam = null;
      }
    }
    if (this.autoStartTimer) {
      this.autoStartTimer.remove(false);
      this.autoStartTimer = null;
    }
    if (this.isPlacing) this.setPlacement(false);
    this.clearSelection();
    this.hideRangeRing();
    this.lastLeaderboardEntry = {
      name: this.playerName,
      score: this.score,
      wave: this.wave,
      kills: this.killCount,
      difficultyKey: this.difficultyKey,
      difficultyLabel: this.difficultyLabel,
      dateISO: new Date().toISOString(),
    };
    recordLocalScore(storage, this.lastLeaderboardEntry, this.difficultyKey);
    submitGlobalScore(this.lastLeaderboardEntry);
    this.showGameOverScreen();
  }

  computeWaveConfig(wave) {
    return Waves.computeWaveConfig.call(this, wave);
  }

  setHelpOverlay(show) {
    this.showHelp = !!show;
    storage.write(STORAGE_KEYS.helpOverlay, this.showHelp ? "true" : "false");

    if (!this.showHelp) {
      if (this.helpIndicatorTween) {
        this.helpIndicatorTween.stop();
        this.helpIndicatorTween.remove();
        this.helpIndicatorTween = null;
      }
      if (this.helpIndicator) {
        this.helpIndicator.destroy();
        this.helpIndicator = null;
      }
      return;
    }

    if (!this.path?.length) return;

    const first = this.path[0];
    const indicator = this.add.circle(first.x, first.y, 4, 0xf0d7c0, 0.45);
    indicator.setDepth(5);
    indicator.setBlendMode(Phaser.BlendModes.ADD);

    const curve = new Phaser.Curves.Path(first.x, first.y);
    for (let i = 1; i < this.path.length; i += 1) {
      const p = this.path[i];
      curve.lineTo(p.x, p.y);
    }

    this.helpIndicator = indicator;
    this.helpIndicatorTween = this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 9000,
      repeat: -1,
      ease: "Sine.easeInOut",
      onUpdate: (tween) => {
        const t = tween.getValue();
        const point = curve.getPoint(t);
        if (point) indicator.setPosition(point.x, point.y);
      },
    });
  }

  enterIntermission(isInitial = false) {
    Waves.enterIntermission.call(this, isInitial);
    this.nextWaveNumberToSpawn = this.wave;
    this.blockWaveStart = this.wave;
  }

  tryStartWave() {
    Waves.tryStartWave.call(this);
  }

  startWave(wave) {
    this.playSfx("wave");
    Waves.startWave.call(this, wave);
  }

  update(time, dt) {
    if (this.isGameOver || this.isPaused || this.isStartScreenActive) return;

    for (const t of this.towers) {
      if (t.type === "laser") {
        this.updateLaserTower(t, time, dt);
        continue;
      }
      if (time < t.nextShotAt) continue;
      const target = Enemies.findTarget.call(this, t, t.targetMode);
      if (!target) continue;
      t.nextShotAt = time + t.fireMs;
      Bullets.fireBullet.call(this, t, target);
    }

    this.enemies.children.iterate((e) => {
      if (!e) return;
      Enemies.advanceEnemy.call(this, e, dt);
      Enemies.updateEnemyVisual(e);
    });

    this.updateWaveSpawning(time);
    Telemetry.observeActiveEnemies(
      this.runTelemetry,
      this.enemies.countActive(true)
    );

    if (this.isPlacing) {
      const nowValid = this.canPlaceTowerAt(this.ghostX, this.ghostY);
      if (nowValid !== this.ghostValid) {
        this.ghostValid = nowValid;
        this.refreshGhostVisual();
      }
      const col = this.ghostValid ? 0x39ff8f : 0xff4d6d;
      const def = this.getPlaceDef();
      this.showGhostRing(this.ghostX, this.ghostY, def.tiers[0].range, col);
      this.updatePlaceHint();
    } else if (this.selectedTower && this.towers.includes(this.selectedTower)) {
      this.showRangeRing(this.selectedTower, 0x00ffff);
    } else if (this.selectedTower && !this.towers.includes(this.selectedTower)) {
      this.selectedTower = null;
      this.hideRangeRing();
    }

    if (this.waveState === "running") {
      const alive = this.enemies.countActive(true);
      const spawners = this.activeWaves || [];
      const allDone = spawners.length > 0 && spawners.every((spawner) => spawner.enemiesSpawned >= spawner.enemiesTotal);
      if (allDone && alive === 0) {
        const wavesCleared = Math.max(1, this.nextWaveNumberToSpawn - this.blockWaveStart);
        const firstWaveCleared = this.blockWaveStart;
        const lastWaveCleared = this.nextWaveNumberToSpawn - 1;
        const completionLabel =
          wavesCleared === 1
            ? `WAVE ${firstWaveCleared} COMPLETE`
            : `WAVES ${firstWaveCleared}–${lastWaveCleared} COMPLETE`;
        this.showWaveTransition(completionLabel, "positive", 1200);
        for (let i = 0; i < wavesCleared; i += 1) {
          const waveNum = this.blockWaveStart + i;
          const clearBonus = Balance.computeClearBonus(waveNum);
          this.runController.awardWaveClear(clearBonus);
        }
        this.recordBalanceCheckpoints(firstWaveCleared, lastWaveCleared);
        this.wave = this.nextWaveNumberToSpawn;
        this.enterIntermission(false);
      }
    }

    this.updateUI();
  }

  updateWaveSpawning(time) {
    Waves.updateWaveSpawning.call(this, time);
  }

  enterPlacementModeIfNeeded() {
    if (!this.isPlacing) this.setPlacement(true);
  }

  getTowerUnlockWave(type) {
    const def = TOWER_DEFS[type];
    return def?.unlockWave ?? 1;
  }

  isTowerUnlocked(type) {
    return this.wave >= this.getTowerUnlockWave(type);
  }

  getPlacementKeyHint() {
    const defs = this.buildTowerDefs || Object.values(TOWER_DEFS);
    const keys = defs
      .filter((def) => this.wave >= (def.unlockWave ?? 1))
      .map((def) => def.hotkey);
    return keys.length ? keys.join("/") : "1";
  }

  trySetPlaceType(type) {
    const def = TOWER_DEFS[type];
    if (!def) return;
    this.enterPlacementModeIfNeeded();
    const unlockWave = def.unlockWave ?? 1;
    if (this.wave < unlockWave) {
      this.showToast(`Unlocks at Wave ${unlockWave}.`, 2200);
      return;
    }
    this.setPlaceType(type);
  }

  getPlaceDef() {
    return TOWER_DEFS[this.placeType] || TOWER_DEFS.basic;
  }

  setPlaceType(type) {
    if (!TOWER_DEFS[type]) return;
    this.placeType = type;
    if (this.isPlacing) {
      if (this.ghost) this.ghost.setTexture(this.getTowerTextureKey(this.placeType));
      this.refreshGhostVisual();
    }
    this.syncTowerStripSelection();
  }

  syncTowerStripSelection() {
    if (!this.towerStripSlots) return;
    const activeKey = this.isPlacing ? this.placeType : null;
    for (const slot of this.towerStripSlots) {
      slot.el.classList.toggle("is-selected", !!activeKey && slot.def?.key === activeKey);
    }
  }

  togglePlacement() {
    this.setPlacement(!this.isPlacing);
  }

  setPlacement(on) {
    if (on === this.isPlacing) return;
    this.isPlacing = on;
    if (this.controlsPlacementEl) {
      this.controlsPlacementEl.classList.toggle("is-active", this.isPlacing);
    }

    if (on) {
      this.clearSelection();
      if (!this.didShowPlaceToast) {
        this.didShowPlaceToast = true;
        const hint = this.getPlacementKeyHint();
        this.showToast(`Placement: press ${hint} to switch tower type.`, 2600);
      }
      this.ghost = this.add.image(0, 0, this.getTowerTextureKey(this.placeType));
      this.ghost.setDepth(9000);
      this.ghost.setAlpha(0.5);
      const p = this.input.activePointer;
      if (p) {
        this.ghostX = NaN;
        this.ghostY = NaN;
        this.updateGhost(p.worldX, p.worldY);
      }
      this.hideRangeRing();
      this.syncTowerStripSelection();
      return;
    }

    if (this.ghost) {
      this.ghost.destroy();
      this.ghost = null;
    }
    this.placeHint.setText("");
    this.hideRangeRing();
    this.syncTowerStripSelection();
  }

  selectTower(t) {
    this.selectedTower = t;
    this.showRangeRing(t, 0x00ffff);
  }

  clearSelection() {
    this.selectedTower = null;
    this.hideRangeRing();
  }

  updateGhost(wx, wy) {
    const x = snapX(wx);
    const y = snapY(wy);
    if (x === this.ghostX && y === this.ghostY) return;
    this.ghostX = x;
    this.ghostY = y;
    this.ghostValid = this.canPlaceTowerAt(x, y);
    this.refreshGhostVisual();
  }

  refreshGhostVisual() {
    if (!this.ghost) return;
    const def = this.getPlaceDef();
    const tier0 = def.tiers[0];
    this.ghost.setPosition(this.ghostX, this.ghostY);
    const col = this.ghostValid ? tier0.tint : 0xff4d6d;
    this.ghost.setTint(col);
    this.ghost.setScale(tier0.scale ?? 1);
    const ringCol = this.ghostValid ? 0x39ff8f : 0xff4d6d;
    this.showGhostRing(this.ghostX, this.ghostY, tier0.range, ringCol);
    this.updatePlaceHint();
  }

  updatePlaceHint() {
    if (!this.isPlacing) return;
    const def = this.getPlaceDef();
    const tier0 = def.tiers[0];
    const ok = this.ghostValid ? "OK" : "BLOCKED";
    const need = this.money < tier0.cost ? " (not enough $)" : "";
    const switchHint = this.getPlacementKeyHint();
    this.placeHint.setText(
      `Placing: ${def.name} [${def.hotkey}]  Cost: $${tier0.cost}  Range: ${tier0.range}  ${ok}${need}   (${switchHint}: switch)`
    );
  }

  showGhostRing(x, y, range, color) {
    this.worldRenderer.showGhostRing(x, y, range, color);
  }

  showRangeRing(tower, color) {
    this.worldRenderer.showTowerRange(tower, color);
  }

  hideRangeRing() {
    this.worldRenderer.hideRange();
  }

  isOnPath(x, y) {
    return this.worldRenderer.isOnPath(x, y);
  }

  pointToSegmentDistance(px, py, ax, ay, bx, by) {
    return pointToSegmentDistance(px, py, ax, ay, bx, by);
  }

  getTowerAt(wx, wy) {
    const x = snapX(wx);
    const y = snapY(wy);
    return this.towers.find((t) => t.x === x && t.y === y);
  }

  getTowerTextureKey(type) {
    return getTowerTextureKey(type);
  }

  canPlaceTowerAt(x, y) {
    const def = this.getPlaceDef();
    const tier0 = def.tiers[0];
    if (this.money < tier0.cost) return false;
    if (x < GRID / 2 || y < TOP_UI + GRID / 2 || x > this.scale.width - GRID / 2 || y > this.scale.height - GRID / 2) return false;
    if (this.isOnPath(x, y)) return false;
    for (const t of this.towers) {
      if (t.x === x && t.y === y) return false;
    }
    return true;
  }

  getNextUpgradeCost(t) {
    return Towers.getNextUpgradeCost.call(this, t);
  }

  applyTowerTier(t, tierIdx) {
    Towers.applyTowerTier.call(this, t, tierIdx);
  }

  tryUpgradeTower(t) {
    const prevTier = t?.tier ?? 0;
    Towers.tryUpgradeTower.call(this, t);
    if (t && t.tier > prevTier) this.playSfx("upgrade");
  }

  tryPlaceTowerAt(x, y) {
    if (!this.canPlaceTowerAt(x, y)) return;
    const def = this.getPlaceDef();
    const tier0 = def.tiers[0];
    this.runController.spend(tier0.cost);
    const img = this.add.image(x, y, this.getTowerTextureKey(def.key));
    const t = {
      x,
      y,
      type: def.key,
      tier: 1,
      damage: tier0.damage,
      range: tier0.range,
      fireMs: tier0.fireMs,
      nextShotAt: 0,
      spent: tier0.cost,
      targetMode: def.defaultTargetMode ?? "first",
      sprite: img,
      badge: null,
    };
    if (def.key === "laser") {
      t.beamTickMs = tier0.fireMs;
      t.beamAcc = 0;
      t.lockTarget = null;
      t.lockMs = 0;
      t.beam = this.add.graphics();
      t.beam.setDepth(70);
      t.beam.setVisible(false);
    }
    img.setTint(tier0.tint);
    img.setScale(tier0.scale ?? 1);
    this.towers.push(t);
    this.selectTower(t);
    this.playSfx("place");
  }

  trySellTower(t) {
    const hadTower = !!t && this.towers.includes(t);
    if (t?.beam) {
      t.beam.destroy();
      t.beam = null;
    }
    Towers.trySellTower.call(this, t);
    if (hadTower && !this.towers.includes(t)) this.playSfx("sell");
  }

  cycleTargetMode(t) {
    Towers.cycleTargetMode.call(this, t);
  }

  spawnEnemyOfType(typeKey, opts = {}) {
    const enemy = Enemies.spawnEnemyOfType.call(this, typeKey, opts);
    Telemetry.recordEnemySpawn(this.runTelemetry, enemy?.typeKey);
    return enemy;
  }

  recordEnemyLeak(enemy) {
    Telemetry.recordEnemyLeak(this.runTelemetry, enemy?.waveNumber);
  }

  publishRunTelemetry() {
    const snapshot = Telemetry.snapshotRunTelemetry(this.runTelemetry);
    if (!snapshot) return;
    const archive = Telemetry.updateTelemetryArchive(
      storage.read(STORAGE_KEYS.balanceTelemetry),
      snapshot
    );
    storage.write(STORAGE_KEYS.balanceTelemetry, JSON.stringify(archive));
    window.defenseProtocolTelemetry = snapshot;
    window.defenseProtocolTelemetryRuns = archive.runs;
  }

  recordBalanceCheckpoints(firstWave, lastWave) {
    for (const wave of Telemetry.BALANCE_CHECKPOINT_WAVES) {
      if (wave < firstWave || wave > lastWave) continue;
      const checkpoint = Telemetry.recordCheckpoint(this.runTelemetry, wave, {
        money: this.money,
        lives: this.lives,
        score: this.score,
        kills: this.killCount,
        activeEnemies: this.enemies.countActive(true),
        towers: this.towers,
      });
      if (!checkpoint) continue;
      this.publishRunTelemetry();
      console.info("[Defense Protocol balance checkpoint]", {
        run: this.runLabel,
        seed: this.runSeed,
        checkpoint,
      });
      this.showToast(`Wave ${wave} balance checkpoint recorded.`, 1800);
    }
  }

  updateLaserTower(tower, _time, dt) {
    const range2 = tower.range * tower.range;
    const hasTarget =
      tower.lockTarget &&
      tower.lockTarget.active &&
      dist2(tower.x, tower.y, tower.lockTarget.x, tower.lockTarget.y) <= range2;

    if (!hasTarget) {
      const nextTarget = Enemies.findTarget.call(this, tower, tower.targetMode);
      if (!nextTarget) {
        tower.lockTarget = null;
        tower.lockMs = 0;
        tower.beamAcc = 0;
        if (tower.beam) {
          tower.beam.clear();
          tower.beam.setVisible(false);
        }
        return;
      }
      if (tower.lockTarget !== nextTarget) {
        tower.lockMs = 0;
        tower.beamAcc = 0;
      }
      tower.lockTarget = nextTarget;
    }

    const target = tower.lockTarget;
    if (!target) return;
    const dx = target.x - tower.x;
    const dy = target.y - tower.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const endX = tower.x + ux * tower.range;
    const endY = tower.y + uy * tower.range;
    tower.lockMs += dt;
    tower.beamAcc += dt;

    if (tower.beam) {
      tower.beam.clear();
      tower.beam.lineStyle(3, 0xff6bff, 0.18);
      tower.beam.lineBetween(tower.x, tower.y, endX, endY);
      tower.beam.lineStyle(1, 0xffd1ff, 0.85);
      tower.beam.lineBetween(tower.x, tower.y, endX, endY);
      tower.beam.setVisible(true);
    }

    const tickMs = tower.beamTickMs || tower.fireMs || 110;
    while (tower.beamAcc >= tickMs) {
      tower.beamAcc -= tickMs;
      if (!tower.lockTarget || !tower.lockTarget.active) break;
      this.applyLaserTick(tower, tower.lockTarget, endX, endY);
    }

    if (tower.lockTarget && !tower.lockTarget.active) {
      tower.lockTarget = null;
      tower.lockMs = 0;
      tower.beamAcc = 0;
      if (tower.beam) {
        tower.beam.clear();
        tower.beam.setVisible(false);
      }
    }
  }

  applyLaserTick(tower, target, endX, endY) {
    const towerDef = TOWER_DEFS[tower.type];
    const hits = [];

    this.enemies.children.iterate((e) => {
      if (!e || !e.active) return;
      if (!segCircleHit(tower.x, tower.y, endX, endY, e.x, e.y, 14)) return;
      hits.push({ enemy: e, dist2: dist2(tower.x, tower.y, e.x, e.y) });
    });

    hits.sort((a, b) => a.dist2 - b.dist2);
    const primaryIndex = hits.findIndex((hit) => hit.enemy === target);
    if (primaryIndex === -1) {
      tower.lockTarget = null;
      tower.lockMs = 0;
      tower.beamAcc = 0;
      return;
    }
    if (primaryIndex > 0) {
      const [primary] = hits.splice(primaryIndex, 1);
      hits.unshift(primary);
    }

    const ramp =
      1 +
      Math.min(
        tower.lockMs / (towerDef.lockRampMs ?? 2000),
        towerDef.maxLockBonus ?? 1.5
      );
    const falloff = towerDef.pierceFalloff ?? 0.7;
    const maxPierce = towerDef.maxPierce ?? 1;

    for (let i = 0; i < hits.length && i < maxPierce; i += 1) {
      const enemy = hits[i].enemy;
      if (!enemy || !enemy.active) continue;
      const base = tower.damage * ramp * Math.pow(falloff, i);
      const dmg = Balance.computeDamageAgainstEnemy(tower, base, enemy);
      Bullets.showHitEffect(
        this,
        "laser",
        enemy.x,
        enemy.y,
        tower.sprite?.tintTopLeft ?? 0xff6bff
      );
      this.recordTowerDamage(tower, enemy, dmg);
      enemy.hp -= dmg;
      if (enemy.hp <= 0) this.handleEnemyKilled(enemy, tower);
    }
  }

  recordTowerDamage(tower, enemy, damage) {
    const actualDamage = Math.min(
      Math.max(0, Number(enemy?.hp) || 0),
      Math.max(0, Number(damage) || 0)
    );
    Telemetry.recordTowerDamage(this.runTelemetry, tower?.type, actualDamage);
  }

  handleEnemyKilled(enemy, tower) {
    const reward = enemy.reward ?? 8;
    const weight = enemy.scoreWeight ?? 1;
    if (enemy.flashTween) {
      enemy.flashTween.remove(false);
      enemy.flashTween = null;
    }
    Telemetry.recordEnemyKill(this.runTelemetry, enemy.typeKey);
    Telemetry.recordTowerKill(this.runTelemetry, tower?.type);
    enemy.destroy();
    this.runController.recordKill({
      reward,
      scoreWeight: weight,
      scoreMultiplier: this.difficulty?.scoreMul ?? 1,
    });
  }

  fireBullet(t, target) {
    Bullets.fireBullet.call(this, t, target);
  }
}

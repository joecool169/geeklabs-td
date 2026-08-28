import Phaser from "phaser";
import {
  DIFFICULTY_CONFIG,
  GRID,
  TOP_UI,
} from "./game/config.js";
import { HudController } from "./game/ui.js";
import * as Telemetry from "./game/telemetry.js";
import { normalizeRunSeed } from "./game/random.js";
import { ENEMY_DEFS, TOWER_DEFS } from "./constants.js";
import {
  recordLeaderboardScore,
} from "./services/leaderboard.js";
import {
  STORAGE_KEYS,
  createStorageGateway,
  isPreferenceEnabled,
  normalizeDifficultyKey,
  normalizePlayerName,
} from "./services/preferences.js";
import { readRunOptions } from "./services/runOptions.js";
import { publishTelemetryArchive } from "./services/telemetryArchive.js";
import { OverlayManager } from "./ui/OverlayManager.js";
import { GameDomView } from "./ui/GameDomView.js";
import { GAME_ACTIONS, getTouchPlacementY } from "./input/actions.js";
import { InputController } from "./input/InputController.js";
import { RunController } from "./core/RunController.js";
import { RunState, attachRunState } from "./core/RunState.js";
import {
  WorldRenderer,
} from "./presentation/WorldRenderer.js";
import { TowerSystem, attachTowerSystem } from "./systems/TowerSystem.js";
import { EnemySystem, attachEnemySystem } from "./systems/EnemySystem.js";
import { CombatSystem } from "./systems/CombatSystem.js";
import { WaveSystem, attachWaveSystem } from "./systems/WaveSystem.js";
import { persistNativePreference } from "./platform/nativeRuntime.js";
import { AudioController } from "./audio/AudioController.js";

const storage = createStorageGateway(globalThis.localStorage, {
  writeThrough: persistNativePreference,
});
const SFX_CONFIG = {
  place: { url: "/sfx/place.wav", volume: 0.65, rate: 0.9 },
  upgrade: { url: "/sfx/upgrade.wav", volume: 0.7, rate: 0.9 },
  sell: { url: "/sfx/sell.wav", volume: 0.65, rate: 0.9 },
  wave: { url: "/sfx/wave.wav", volume: 0.75, rate: 0.85 },
  death: { url: "/sfx/death.wav", volume: 0.68, rate: 0.9 },
  life: { url: "/sfx/life.wav", volume: 0.8, rate: 0.85 },
  gameover: { url: "/sfx/gameover.wav", volume: 0.85, rate: 0.85 },
};
export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("playfield_floor", "/art/playfield-floor-v1.png");
    this.load.image("enemy_runner", "/art/units/runner-v1.png");
    this.load.image("enemy_sprinter", "/art/units/sprinter-v1.png");
    this.load.image("enemy_brute", "/art/units/brute-v1.png");
    this.load.image("enemy_armored", "/art/units/armored-v1.png");
    this.load.image("tower_basic_t1", "/art/towers/basic-t1-v1.png");
    this.load.image("tower_basic_t2", "/art/towers/basic-t2-v1.png");
    this.load.image("tower_basic_t3", "/art/towers/basic-t3-v1.png");
    this.load.image("tower_basic_base", "/art/towers/basic-base-v1.png");
    this.load.image("tower_basic_head_t1", "/art/towers/basic-head-t1-v1.png");
    this.load.image("tower_basic_head_t2", "/art/towers/basic-head-t2-v1.png");
    this.load.image("tower_basic_head_t3", "/art/towers/basic-head-t3-v1.png");
    this.load.image("tower_rapid_base", "/art/towers/rapid-base-v1.png");
    this.load.image("tower_rapid_head_t1", "/art/towers/rapid-head-t1-v1.png");
    this.load.image("tower_rapid_head_t2", "/art/towers/rapid-head-t2-v1.png");
    this.load.image("tower_rapid_head_t3", "/art/towers/rapid-head-t3-v1.png");
    this.load.image("tower_sniper_base", "/art/towers/sniper-base-v1.png");
    this.load.image("tower_sniper_head_t1", "/art/towers/sniper-head-t1-v1.png");
    this.load.image("tower_sniper_head_t2", "/art/towers/sniper-head-t2-v1.png");
    this.load.image("tower_sniper_head_t3", "/art/towers/sniper-head-t3-v1.png");
    this.load.image("tower_laser_base", "/art/towers/laser-base-v1.png");
    this.load.image("tower_laser_head_t1", "/art/towers/laser-head-t1-v1.png");
    this.load.image("tower_laser_head_t2", "/art/towers/laser-head-t2-v1.png");
    this.load.image("tower_laser_head_t3", "/art/towers/laser-head-t3-v1.png");
    this.load.image("command_core", "/art/structures/command-core-v1.png");
    this.load.image("deployment_gate", "/art/structures/deployment-gate-v1.png");
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
    this.globalScoresEnabled = isPreferenceEnabled(
      storage.read(STORAGE_KEYS.globalScoresEnabled)
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

    this.playSfx = (key, opts = {}) => {
      const {
        allowDuringPause = false,
        allowDuringStart = false,
        allowDuringGameOver = false,
      } = opts;
      if (!allowDuringStart && this.isStartScreenActive) return;
      if (!allowDuringPause && this.isPaused) return;
      if (!allowDuringGameOver && this.isGameOver) return;
      const minInterval = key === "death" ? 100 : 0;
      const now = this.time?.now ?? Date.now();
      this.audioController?.play(key, { minInterval, now });
    };

    attachRunState(
      this,
      new RunState({
        startingLives: 20,
        startScreenActive: !this.startOptions?.skipStartScreen,
      })
    );
    this.runController = new RunController(this.runState);
    this.worldRenderer = new WorldRenderer(this);
    this.worldRenderer.create();
    this.path = this.worldRenderer.path;

    attachTowerSystem(
      this,
      new TowerSystem({
        scene: this,
        world: this.worldRenderer,
        runController: this.runController,
      })
    );
    attachEnemySystem(
      this,
      new EnemySystem({
        scene: this,
        path: this.path,
        runController: this.runController,
        getWave: () => this.wave,
        getDifficulty: () => this.difficulty,
        onSpawn: (enemy) =>
          Telemetry.recordEnemySpawn(this.runTelemetry, enemy?.typeKey),
        onLeak: (enemy) => this.recordEnemyLeak(enemy),
        onLifeLost: () => {
          this.triggerLifeLossFeedback();
          this.playSfx("life");
        },
        onGameOver: () => this.triggerGameOver(),
      })
    );
    this.combatSystem = new CombatSystem({
      scene: this,
      towerSystem: this.towerSystem,
      enemySystem: this.enemySystem,
      runController: this.runController,
      getDifficulty: () => this.difficulty,
      getTelemetry: () => this.runTelemetry,
    });
    attachWaveSystem(
      this,
      new WaveSystem({
        scene: this,
        runController: this.runController,
        enemySystem: this.enemySystem,
        getRunSeed: () => this.runSeed,
        showToast: (message, duration) => this.showToast(message, duration),
        showTransition: (text, tone, duration) =>
          this.showWaveTransition(text, tone, duration),
        playWaveSfx: () => this.playSfx("wave"),
        onWavesCleared: (firstWave, lastWave) =>
          this.recordBalanceCheckpoints(firstWave, lastWave),
      })
    );

    this.ui = this.add.text(14, 12, "", {
      fontFamily: "monospace",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#e8f2ff",
      backgroundColor: "rgba(5, 10, 17, 0.78)",
      padding: { x: 10, y: 7 },
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

    this.audioController = new AudioController({
      soundManager: this.sound,
      storage,
      storageKey: STORAGE_KEYS.soundEnabled,
    });
    Object.entries(SFX_CONFIG).forEach(([key, cfg]) => {
      if (!this.cache.audio.exists(key)) return;
      const volume = typeof cfg.volume === "number" ? cfg.volume : 0.4;
      const rate = typeof cfg.rate === "number" ? cfg.rate : 1;
      this.audioController.register(key, this.sound.add(key, { volume, rate }));
    });
    this.showHelp = storage.read(STORAGE_KEYS.helpOverlay) === "true";
    this.buildTowerDefs = Object.values(TOWER_DEFS).sort(
      (a, b) => Number(a.hotkey) - Number(b.hotkey)
    );
    this.domView = new GameDomView();
    this.domView.bind({
      towerDefs: this.buildTowerDefs,
      onSelectTowerType: (towerType) =>
        this.handleInputAction({
          type: GAME_ACTIONS.SELECT_TOWER_TYPE,
          towerType,
        }),
      onUpgrade: () =>
        this.handleInputAction({ type: GAME_ACTIONS.UPGRADE_SELECTED }),
      onSell: () =>
        this.handleInputAction({ type: GAME_ACTIONS.SELL_SELECTED }),
      onTarget: () =>
        this.handleInputAction({ type: GAME_ACTIONS.CYCLE_TARGETING }),
      onStartWave: () =>
        this.handleInputAction({
          type: GAME_ACTIONS.START_WAVE,
          requireConfirmation: false,
        }),
      onPlace: () =>
        this.handleInputAction({ type: GAME_ACTIONS.CONFIRM_PLACEMENT }),
      onCancel: () =>
        this.handleInputAction({ type: GAME_ACTIONS.CANCEL }),
      onPause: () =>
        this.handleInputAction({ type: GAME_ACTIONS.TOGGLE_PAUSE }),
    });
    Object.assign(this, this.domView.refs);
    this.towerStripSlots = this.domView.towerStripSlots;
    this.hudController = new HudController(this);
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
      if (this.isPaused && this.isPlacing) this.towerSystem.setPlacement(false);
      this.pauseText.setText(this.isPaused ? "PAUSED — P / ESC to resume" : "");
      this.pauseText.setVisible(this.isPaused);
      if (this.isPaused) {
        this.hudController.clearTransition();
        this.showPauseMenu();
      } else {
        this.hidePauseMenu();
      }
      this.updateUI();
    };

    this.togglePause = () => this.setPaused(!this.isPaused);

    this.inputController = new InputController({
      input: this.input,
      keyCodes: Phaser.Input.Keyboard.KeyCodes,
      onAction: (action) => this.handleInputAction(action),
    });

    this.updateUI();
    this.waveSystem.enterIntermission(true);
    this.events.once("shutdown", () => {
      this.hudController?.destroy();
      this.hudController = null;
      this.audioController?.destroy();
      this.audioController = null;
      this.overlays?.destroy();
      this.overlays = null;
      this.domView?.destroy();
      this.domView = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.towerSystem?.destroy();
      this.towerSystem = null;
      this.enemySystem?.destroy();
      this.enemySystem = null;
      this.combatSystem?.destroy();
      this.combatSystem = null;
      this.waveSystem?.destroy();
      this.waveSystem = null;
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
        this.towerSystem.setPlacement(false);
      } else if (this.selectedTower) {
        this.towerSystem.clearSelection();
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
        this.towerSystem.togglePlacement();
        break;
      case GAME_ACTIONS.SELECT_TOWER_TYPE:
        this.towerSystem.trySetPlaceType(action.towerType);
        break;
      case GAME_ACTIONS.UPGRADE_SELECTED:
        if (this.selectedTower && this.towers.includes(this.selectedTower)) {
          this.towerSystem.tryUpgradeTower(this.selectedTower);
        }
        break;
      case GAME_ACTIONS.SELL_SELECTED:
        if (this.selectedTower && this.towers.includes(this.selectedTower)) {
          this.towerSystem.trySellTower(this.selectedTower);
        }
        break;
      case GAME_ACTIONS.CYCLE_TARGETING:
        if (this.selectedTower && this.towers.includes(this.selectedTower)) {
          this.towerSystem.cycleTargetMode(this.selectedTower);
        }
        break;
      case GAME_ACTIONS.START_WAVE:
        this.handleStartWaveInput(this.time.now, action);
        break;
      case GAME_ACTIONS.CONFIRM_PLACEMENT:
        this.confirmTouchPlacement();
        break;
      case GAME_ACTIONS.TOUCH_AT:
        this.handleTouchPointer(action);
        break;
      case GAME_ACTIONS.SECONDARY_AT:
        this.handleSecondaryPointer(action.x, action.y);
        break;
      case GAME_ACTIONS.PRIMARY_AT:
        this.handlePrimaryPointer(action.x, action.y, action.modified);
        break;
      case GAME_ACTIONS.POINTER_MOVED:
        if (this.isPlacing) this.towerSystem.updateGhost(action.x, action.y);
        break;
      default:
        break;
    }
  }

  handleStartWaveInput(now, options) {
    this.waveSystem.handleStartInput(now, options);
  }

  handleTouchPointer({ x, y, phase }) {
    if (!this.isPlacing) {
      if (phase === "down") this.handlePrimaryPointer(x, y, false, true);
      return;
    }
    this.towerSystem.updateGhost(
      x,
      getTouchPlacementY(y, this.scale.height, GRID)
    );
  }

  confirmTouchPlacement() {
    if (!this.isPlacing || !this.ghostValid) return false;
    const tower = this.towerSystem.tryPlaceTowerAt(this.ghostX, this.ghostY);
    this.towerSystem.refreshGhostVisual();
    return !!tower;
  }

  handleSecondaryPointer(x, y) {
    const tower = this.towerSystem.getTowerAt(x, y);
    if (tower) {
      this.towerSystem.trySellTower(tower);
    } else if (this.isPlacing) {
      this.towerSystem.setPlacement(false);
    }
  }

  handlePrimaryPointer(x, y, modified = false, touch = false) {
    if (this.isPlacing) {
      if (this.ghostValid) {
        this.towerSystem.tryPlaceTowerAt(this.ghostX, this.ghostY);
        this.towerSystem.refreshGhostVisual();
      }
      return;
    }
    const tower = this.towerSystem.getTowerAt(x, y, { touch });
    if (tower) {
      if (modified) this.towerSystem.tryUpgradeTower(tower);
      this.towerSystem.selectTower(tower);
      if (touch) this.towerSystem.emphasizeTower(tower);
      this.updateUI();
      return;
    }
    this.towerSystem.clearSelection();
    this.updateUI();
  }

  showToast(msg, ms = 2400) {
    this.hudController.showToast(msg, ms);
  }

  updateUI() {
    this.hudController.update();
  }

  showWaveTransition(text, tone = "neutral", duration = 1100) {
    this.hudController.showTransition(text, tone, duration);
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
      soundEnabled: this.audioController.enabled,
      globalScoresEnabled: this.globalScoresEnabled,
      onToggleSound: () => this.toggleSound(),
      onStart: ({ playerName, difficultyKey, globalScoresEnabled }) => {
        const name = normalizePlayerName(playerName);
        this.playerName = name;
        storage.write(STORAGE_KEYS.playerName, name);
        this.setGlobalScoresEnabled(globalScoresEnabled);
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
      soundEnabled: this.audioController.enabled,
      globalScoresEnabled: this.globalScoresEnabled,
      onToggleSound: () => this.toggleSound(),
      onToggleGlobalScores: () =>
        this.setGlobalScoresEnabled(!this.globalScoresEnabled),
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

  setGlobalScoresEnabled(enabled) {
    this.globalScoresEnabled = enabled !== false;
    storage.write(
      STORAGE_KEYS.globalScoresEnabled,
      String(this.globalScoresEnabled)
    );
    return this.globalScoresEnabled;
  }

  toggleSound() {
    const enabled = this.audioController.toggle();
    if (enabled) {
      this.audioController.unlock();
      this.playSfx("place", {
        allowDuringPause: true,
        allowDuringStart: true,
        allowDuringGameOver: true,
      });
    }
    return enabled;
  }

  handleAppInactive() {
    if (this.isStartScreenActive || this.isGameOver || this.isPaused) {
      return false;
    }
    this.setPaused(true);
    return true;
  }

  handleAppActive() {
    this.scale?.refresh();
  }

  triggerLifeLossFeedback() {
    if (this.isStartScreenActive || this.isPaused) return;
    this.worldRenderer?.showCoreImpact(this.lives, 20);
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
    this.worldRenderer?.setCoreIntegrity(0, 20);
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
    this.hudController.clearTransition();
    this.playSfx("gameover", { allowDuringGameOver: true });
    for (const t of this.towers) {
      if (t.beam) {
        t.beam.destroy();
        t.beam = null;
      }
    }
    if (this.autoStartTimer) {
      this.waveSystem.cancelAutoStart();
    }
    if (this.isPlacing) this.towerSystem.setPlacement(false);
    this.towerSystem.clearSelection();
    this.lastLeaderboardEntry = {
      name: this.playerName,
      score: this.score,
      wave: this.wave,
      kills: this.killCount,
      difficultyKey: this.difficultyKey,
      difficultyLabel: this.difficultyLabel,
      dateISO: new Date().toISOString(),
    };
    recordLeaderboardScore({
      storage,
      entry: this.lastLeaderboardEntry,
      difficultyKey: this.difficultyKey,
      globalScoresEnabled: this.globalScoresEnabled,
    });
    this.showGameOverScreen();
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

  update(time, dt) {
    if (this.isGameOver || this.isPaused || this.isStartScreenActive) return;

    this.combatSystem.update(time, dt);
    this.enemySystem.update(dt);

    this.waveSystem.update(time);
    Telemetry.observeActiveEnemies(
      this.runTelemetry,
      this.enemies.countActive(true)
    );

    if (this.isPlacing) {
      const nowValid = this.towerSystem.canPlaceTowerAt(this.ghostX, this.ghostY);
      if (nowValid !== this.ghostValid) {
        this.ghostValid = nowValid;
        this.towerSystem.refreshGhostVisual();
      }
      const col = this.ghostValid ? 0x39ff8f : 0xff4d6d;
      const def = this.towerSystem.getPlaceDef();
      this.worldRenderer.showGhostRing(
        this.ghostX,
        this.ghostY,
        def.tiers[0].range,
        col
      );
      this.towerSystem.updatePlaceHint();
    } else if (this.selectedTower && this.towers.includes(this.selectedTower)) {
      this.worldRenderer.showTowerRange(this.selectedTower, 0x00ffff);
    } else if (this.selectedTower && !this.towers.includes(this.selectedTower)) {
      this.selectedTower = null;
      this.worldRenderer.hideRange();
    }

    this.updateUI();
  }

  recordEnemyLeak(enemy) {
    Telemetry.recordEnemyLeak(this.runTelemetry, enemy?.waveNumber);
  }

  publishRunTelemetry() {
    publishTelemetryArchive({ storage, telemetry: this.runTelemetry });
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

}

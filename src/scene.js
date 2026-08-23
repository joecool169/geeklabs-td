import Phaser from "phaser";
import {
  DIFFICULTY_CONFIG,
  TOP_UI,
} from "./game/config.js";
import * as UI from "./game/ui.js";
import * as Telemetry from "./game/telemetry.js";
import { normalizeRunSeed } from "./game/random.js";
import { ENEMY_DEFS, TOWER_DEFS } from "./constants.js";
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
import { TowerSystem, attachTowerSystem } from "./systems/TowerSystem.js";
import { EnemySystem, attachEnemySystem } from "./systems/EnemySystem.js";
import { CombatSystem } from "./systems/CombatSystem.js";
import { WaveSystem, attachWaveSystem } from "./systems/WaveSystem.js";

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
    this.waveSystem.handleStartInput(now);
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
      this.waveSystem.cancelAutoStart();
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
    return this.waveSystem.computeConfig(wave);
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
    this.waveSystem.enterIntermission(isInitial);
  }

  tryStartWave() {
    return this.waveSystem.tryStartWave();
  }

  startWave(wave) {
    this.waveSystem.startWave(wave);
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

    this.updateUI();
  }

  updateWaveSpawning(time) {
    this.waveSystem.updateSpawning(time);
  }

  enterPlacementModeIfNeeded() {
    this.towerSystem.enterPlacementModeIfNeeded();
  }

  getTowerUnlockWave(type) {
    return this.towerSystem.getTowerUnlockWave(type);
  }

  isTowerUnlocked(type) {
    return this.towerSystem.isTowerUnlocked(type);
  }

  getPlacementKeyHint() {
    return this.towerSystem.getPlacementKeyHint();
  }

  trySetPlaceType(type) {
    this.towerSystem.trySetPlaceType(type);
  }

  getPlaceDef() {
    return this.towerSystem.getPlaceDef();
  }

  setPlaceType(type) {
    this.towerSystem.setPlaceType(type);
  }

  syncTowerStripSelection() {
    this.towerSystem.syncTowerStripSelection();
  }

  togglePlacement() {
    this.towerSystem.togglePlacement();
  }

  setPlacement(on) {
    this.towerSystem.setPlacement(on);
  }

  selectTower(tower) {
    this.towerSystem.selectTower(tower);
  }

  clearSelection() {
    this.towerSystem.clearSelection();
  }

  updateGhost(worldX, worldY) {
    this.towerSystem.updateGhost(worldX, worldY);
  }

  refreshGhostVisual() {
    this.towerSystem.refreshGhostVisual();
  }

  updatePlaceHint() {
    this.towerSystem.updatePlaceHint();
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

  getTowerAt(worldX, worldY) {
    return this.towerSystem.getTowerAt(worldX, worldY);
  }

  getTowerTextureKey(type) {
    return getTowerTextureKey(type);
  }

  canPlaceTowerAt(x, y) {
    return this.towerSystem.canPlaceTowerAt(x, y);
  }

  getNextUpgradeCost(tower) {
    return this.towerSystem.getNextUpgradeCost(tower);
  }

  applyTowerTier(tower, tierIndex) {
    this.towerSystem.applyTowerTier(tower, tierIndex);
  }

  tryUpgradeTower(tower) {
    return this.towerSystem.tryUpgradeTower(tower);
  }

  tryPlaceTowerAt(x, y) {
    return this.towerSystem.tryPlaceTowerAt(x, y);
  }

  trySellTower(tower) {
    return this.towerSystem.trySellTower(tower);
  }

  cycleTargetMode(tower) {
    this.towerSystem.cycleTargetMode(tower);
  }

  spawnEnemyOfType(typeKey, opts = {}) {
    return this.enemySystem.spawn(typeKey, opts);
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

}

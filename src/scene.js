import Phaser from "phaser";
import { DIFFICULTY_CONFIG, GRID, TOP_UI } from "./game/config.js";
import { snapX, snapY } from "./game/utils.js";
import { fireBullet as fireBulletFn } from "./game/bullets.js";
import {
  advanceEnemy as advanceEnemyFn,
  findTarget as findTargetFn,
  spawnEnemyOfType as spawnEnemyOfTypeFn,
} from "./game/enemies.js";
import { showToast as showToastFn, updateUI as updateUIFn } from "./game/ui.js";
import {
  applyTowerTier as applyTowerTierFn,
  cycleTargetMode as cycleTargetModeFn,
  getNextUpgradeCost as getNextUpgradeCostFn,
  trySellTower as trySellTowerFn,
  tryUpgradeTower as tryUpgradeTowerFn,
} from "./game/towers.js";
import {
  computeWaveConfig as computeWaveConfigFn,
  enterIntermission as enterIntermissionFn,
  startWave as startWaveFn,
  tryStartWave as tryStartWaveFn,
  updateWaveSpawning as updateWaveSpawningFn,
} from "./game/waves.js";
import { TOWER_DEFS } from "./constants.js";

const PLAYER_NAME_STORAGE_KEY = "geeklabs_td_player_name_v1";
const DIFFICULTY_STORAGE_KEY = "geeklabs_td_difficulty_v1";
const LEADERBOARD_STORAGE_KEY = "geeklabs_td_leaderboard_v1";
const BRAND_LOGO_URL = "/brand/defense-protocol.png";
const BRAND_TITLE = "Defense Protocol";
const BRAND_TAGLINE = "Protocol engaged. Hold the line.";
const DEFAULT_DIFFICULTY_KEY = "easy";
const CONTROLS = [
  { key: "T", action: "Toggle placement mode" },
  { key: "Click", action: "Place tower" },
  { key: "1 / 2 / 3", action: "Select tower" },
  { key: "Space", action: "Start wave" },
  { key: "U", action: "Upgrade (selected tower)" },
  { key: "X", action: "Sell (selected tower)" },
  { key: "F", action: "Target mode (selected tower)" },
  { key: "P", action: "Pause" },
];

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    return null;
  }
  return null;
};

const normalizePlayerName = (raw) => {
  const name = (raw || "").trim();
  return name.length ? name : "Player";
};

const normalizeDifficultyKey = (key) =>
  DIFFICULTY_CONFIG[key] ? key : DEFAULT_DIFFICULTY_KEY;

const safeParseLeaderboard = () => {
  const raw = readStorage(LEADERBOARD_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Leaderboard data not array.");
    return parsed.filter((entry) => entry && typeof entry === "object");
  } catch {
    writeStorage(LEADERBOARD_STORAGE_KEY, "[]");
    return [];
  }
};

const compareLeaderboardEntries = (a, b) => {
  const scoreDiff = (Number(b.score) || 0) - (Number(a.score) || 0);
  if (scoreDiff) return scoreDiff;
  const waveDiff = (Number(b.wave) || 0) - (Number(a.wave) || 0);
  if (waveDiff) return waveDiff;
  const killsDiff = (Number(b.kills) || 0) - (Number(a.kills) || 0);
  if (killsDiff) return killsDiff;
  const dateA = typeof a.dateISO === "string" ? a.dateISO : "9999-12-31T23:59:59.999Z";
  const dateB = typeof b.dateISO === "string" ? b.dateISO : "9999-12-31T23:59:59.999Z";
  if (dateA < dateB) return -1;
  if (dateA > dateB) return 1;
  return 0;
};

const writeLeaderboard = (entries) => {
  try {
    writeStorage(LEADERBOARD_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    return null;
  }
  return null;
};

const updateLeaderboard = (entry) => {
  const entries = safeParseLeaderboard();
  entries.push(entry);
  entries.sort(compareLeaderboardEntries);
  const trimmed = entries.slice(0, 10);
  writeLeaderboard(trimmed);
  return trimmed;
};

const renderControlsList = (container) => {
  container.innerHTML = "";
  CONTROLS.forEach((control) => {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.gap = "10px";

    const key = document.createElement("span");
    key.textContent = control.key;
    key.style.color = "#f0d7c0";
    key.style.whiteSpace = "nowrap";

    const action = document.createElement("span");
    action.textContent = control.action;

    row.appendChild(key);
    row.appendChild(action);
    container.appendChild(row);
  });
};

const renderLeaderboardList = (container, currentEntry) => {
  const isCurrentRun = (entry) => {
    if (!currentEntry) return false;
    return (
      entry.dateISO === currentEntry.dateISO &&
      Number(entry.score) === Number(currentEntry.score) &&
      Number(entry.wave) === Number(currentEntry.wave) &&
      Number(entry.kills) === Number(currentEntry.kills) &&
      entry.name === currentEntry.name
    );
  };

  const entries = safeParseLeaderboard().sort(compareLeaderboardEntries);
  container.innerHTML = "";

  if (!entries.length) {
    const empty = document.createElement("div");
    empty.textContent = "No entries yet.";
    empty.style.color = "#9fb2cc";
    container.appendChild(empty);
    return;
  }

  const headerRow = document.createElement("div");
  headerRow.style.display = "grid";
  headerRow.style.gridTemplateColumns = "24px 1.6fr 1fr 1fr 1fr 1.4fr";
  headerRow.style.columnGap = "6px";
  headerRow.style.fontSize = "11px";
  headerRow.style.color = "#9fb2cc";
  headerRow.style.textTransform = "uppercase";
  headerRow.style.letterSpacing = "0.04em";
  ["#", "Name", "Score", "Wave", "Kills", "Difficulty"].forEach((label) => {
    const cell = document.createElement("div");
    cell.textContent = label;
    headerRow.appendChild(cell);
  });
  container.appendChild(headerRow);

  entries.forEach((entry, index) => {
    const row = document.createElement("div");
    row.style.display = "grid";
    row.style.gridTemplateColumns = "24px 1.6fr 1fr 1fr 1fr 1.4fr";
    row.style.columnGap = "6px";
    row.style.alignItems = "center";
    row.style.padding = "4px 0";
    row.style.borderBottom = "1px solid rgba(43, 63, 94, 0.6)";
    if (isCurrentRun(entry)) {
      row.style.background = "rgba(64, 118, 200, 0.2)";
      row.style.borderRadius = "6px";
      row.style.padding = "4px 6px";
    }

    const name = entry.name || "Player";
    const score = Number(entry.score) || 0;
    const wave = Number(entry.wave) || 0;
    const kills = Number(entry.kills) || 0;
    const difficulty = entry.difficultyLabel || entry.difficultyKey || "-";

    [index + 1, name, score, wave, kills, difficulty].forEach((value) => {
      const cell = document.createElement("div");
      cell.textContent = value;
      row.appendChild(cell);
    });
    container.appendChild(row);
  });
};

const makeBrandHeader = () => {
  const wrap = document.createElement("div");
  wrap.style.display = "flex";
  wrap.style.flexDirection = "column";
  wrap.style.alignItems = "center";
  wrap.style.marginBottom = "12px";

  const logo = document.createElement("img");
  logo.src = BRAND_LOGO_URL;
  logo.alt = "Defense Protocol logo";
  logo.style.width = "160px";
  logo.style.height = "auto";
  logo.style.marginBottom = "8px";

  const title = document.createElement("div");
  title.textContent = BRAND_TITLE;
  title.style.fontSize = "18px";
  title.style.fontWeight = "700";
  title.style.color = "#f0d7c0";
  title.style.letterSpacing = "0.03em";

  const tagline = document.createElement("div");
  tagline.textContent = BRAND_TAGLINE;
  tagline.style.fontSize = "11px";
  tagline.style.color = "#9fb2cc";
  tagline.style.marginTop = "4px";

  wrap.appendChild(logo);
  wrap.appendChild(title);
  wrap.appendChild(tagline);
  return wrap;
};

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  init(data) {
    this.startOptions = data || {};
  }

  create() {
    const overlayHost = this.game?.canvas?.parentElement;
    if (overlayHost) {
      const oldOverlay = overlayHost.querySelector("#geeklabs-td-gameover-overlay");
      if (oldOverlay) oldOverlay.remove();
    }

    this.playerName = normalizePlayerName(readStorage(PLAYER_NAME_STORAGE_KEY));
    this.difficultyKey = normalizeDifficultyKey(readStorage(DIFFICULTY_STORAGE_KEY));
    if (this.startOptions?.playerName) this.playerName = normalizePlayerName(this.startOptions.playerName);
    if (this.startOptions?.difficultyKey) this.difficultyKey = normalizeDifficultyKey(this.startOptions.difficultyKey);
    this.difficulty = DIFFICULTY_CONFIG[this.difficultyKey];
    this.difficultyLabel = this.difficulty.label;

    this.money = 0;
    this.lives = 20;
    this.killCount = 0;
    this.score = 0;

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

    this.swarmPacksRemaining = 0;
    this.swarmPackSpacingMs = 60;
    this.swarmNextPackSpawnAt = 0;

    this.path = [
      { x: -120, y: 120 + TOP_UI - GRID / 2 },
      { x: 980, y: 120 + TOP_UI - GRID / 2 },
      { x: 980, y: 520 + TOP_UI - GRID / 2 },
      { x: 140, y: 520 + TOP_UI - GRID / 2 },
      { x: 140, y: 320 + TOP_UI - GRID / 2 },
      { x: 860, y: 320 + TOP_UI - GRID / 2 },
    ];

    this.makeTextures();
    this.g = this.add.graphics();
    this.drawGrid();
    this.drawPath();

    this.towers = [];
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();

    this.selectedTower = null;
    this.rangeRing = this.add.graphics();
    this.rangeRing.setDepth(9999);
    this.rangeRing.setVisible(false);

    this.ui = this.add.text(14, 12, "", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#dbe7ff",
    });

    this.killText = this.add.text(640, 12, "Kills: 0", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#dbe7ff",

    });
    this.scoreText = this.add.text(780, 12, "Score: 0", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#dbe7ff",
    });
    this.diffText = this.add.text(920, 14, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#9fb3d8",
    });

    this.help = this.add.text(
      14,
      34,
      "T: place mode   1/2/3: type   Click: select   Shift+Click/U: upgrade   X/Right click: sell   F: target mode   SPACE: start/skip wait",
      { fontFamily: "monospace", fontSize: "13px", color: "#9fb3d8" }
    );

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

    this.isStartScreenActive = !this.startOptions?.skipStartScreen;
    this.isGameOver = false;
    this.isPaused = false;
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

    this.input.mouse?.disableContextMenu();

    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.keyU = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.setPaused = (paused) => {
      const p = !!paused;
      if (p === this.isPaused) return;
      this.isPaused = p;
      this.physics.world.isPaused = this.isPaused;
      if (this.autoStartTimer) this.autoStartTimer.paused = this.isPaused;
      if (this.isPaused && this.isPlacing) this.setPlacement(false);
      this.pauseText.setText(this.isPaused ? "PAUSED (P to resume)" : "");
      this.pauseText.setVisible(this.isPaused);
      if (this.isPaused) {
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

    this.keyT.on("down", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      this.togglePlacement();
    });

    this.keyU.on("down", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      if (this.selectedTower && this.towers.includes(this.selectedTower)) this.tryUpgradeTower(this.selectedTower);
    });

    this.keyX.on("down", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      if (this.selectedTower && this.towers.includes(this.selectedTower)) this.trySellTower(this.selectedTower);
    });

    this.keyF.on("down", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      if (this.selectedTower && this.towers.includes(this.selectedTower)) this.cycleTargetMode(this.selectedTower);
    });

    this.key1.on("down", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      this.setPlaceType("basic");
    });

    this.key2.on("down", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      this.setPlaceType("rapid");
    });

    this.key3.on("down", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      this.setPlaceType("sniper");
    });

    this.keyP.on("down", () => {
      if (this.isStartScreenActive || this.isGameOver) return;
      this.togglePause();
    });

    this.keyEsc.on("down", () => {
      if (this.isStartScreenActive || this.isGameOver) return;
      if (this.isPaused) {
        this.hidePauseMenu();
        this.setPaused(false);
        return;
      }
      if (this.isPlacing) {
        this.setPlacement(false);
        return;
      }
      if (this.selectedTower) {
        this.clearSelection();
        return;
      }
    });

    this.keySpace.on("down", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      if (this.waveState === "intermission") {
        this.nextWaveAvailableAt = Math.min(this.nextWaveAvailableAt, this.time.now);
        this.tryStartWave();
      }
    });

    this.input.on("pointerdown", (p) => {
      if (this.isStartScreenActive || this.isGameOver) return;
      const wx = p.worldX;
      const wy = p.worldY;
      if (this.isPaused) return;

      if (p.rightButtonDown()) {
        const t = this.getTowerAt(wx, wy);
        if (t) {
          this.trySellTower(t);
          return;
        }
        if (this.isPlacing) this.setPlacement(false);
        return;
      }

      if (this.isPlacing) {
        if (this.ghostValid) {
          this.tryPlaceTowerAt(this.ghostX, this.ghostY);
          this.refreshGhostVisual();
        }
        return;
      }

      const t = this.getTowerAt(wx, wy);
      if (t) {
        if (this.keyShift.isDown) this.tryUpgradeTower(t);
        this.selectTower(t);
        return;
      }
      this.clearSelection();
    });

    this.input.on("pointermove", (p) => {
      if (this.isStartScreenActive || this.isGameOver) return;
      if (this.isPaused) return;
      if (!this.isPlacing) return;
      this.updateGhost(p.worldX, p.worldY);
    });

    this.buildInspector();
    this.updateUI();
    this.enterIntermission(true);
    if (this.isStartScreenActive) {
      this.showStartScreen();
    } else {
      this.applyDifficulty(this.difficultyKey);
    }
  }

  showToast(msg, ms = 2400) {
    showToastFn.call(this, msg, ms);
  }

  updateUI() {
    updateUIFn.call(this);
  }

  applyDifficulty(key, opts = {}) {
    const { updateUi = true } = opts;
    const normalized = normalizeDifficultyKey(key);
    const cfg = DIFFICULTY_CONFIG[normalized];
    this.difficultyKey = normalized;
    this.difficulty = cfg;
    this.difficultyLabel = cfg.label;
    this.money = cfg.startingMoney;
    if (updateUi) this.updateUI();
  }

  showStartScreen() {
    const host = this.game?.canvas?.parentElement;
    if (!host) {
      this.isStartScreenActive = false;
      this.applyDifficulty(this.difficultyKey);
      return;
    }
    host.style.position = host.style.position || "relative";

    const overlay = document.createElement("div");
    const overlayId = "geeklabs-td-start-overlay";
    const existingOverlay = host.querySelector(`#${overlayId}`);
    if (existingOverlay) existingOverlay.remove();
    overlay.id = overlayId;
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "rgba(7, 12, 18, 0.88)";
    overlay.style.zIndex = "5";

    const panel = document.createElement("div");
    panel.style.minWidth = "320px";
    panel.style.padding = "22px 26px";
    panel.style.background = "rgba(11, 15, 20, 0.95)";
    panel.style.border = "1px solid #294a6a";
    panel.style.borderRadius = "10px";
    panel.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.45)";
    panel.style.color = "#dbe7ff";
    panel.style.fontFamily = "monospace";

    const brandHeader = makeBrandHeader();

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Player name";
    nameLabel.style.display = "block";
    nameLabel.style.fontSize = "12px";
    nameLabel.style.color = "#9fb3d8";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = this.playerName;
    nameInput.placeholder = "Player";
    nameInput.style.width = "100%";
    nameInput.style.marginTop = "6px";
    nameInput.style.marginBottom = "14px";
    nameInput.style.padding = "8px 10px";
    nameInput.style.borderRadius = "6px";
    nameInput.style.border = "1px solid #294a6a";
    nameInput.style.background = "#0f1623";
    nameInput.style.color = "#dbe7ff";

    const diffLabel = document.createElement("div");
    diffLabel.textContent = "Difficulty";
    diffLabel.style.fontSize = "12px";
    diffLabel.style.color = "#9fb3d8";
    diffLabel.style.marginBottom = "6px";

    const diffWrap = document.createElement("div");
    diffWrap.style.display = "grid";
    diffWrap.style.gridTemplateColumns = "1fr 1fr 1fr";
    diffWrap.style.gap = "8px";
    diffWrap.style.marginBottom = "16px";

    let selectedKey = this.difficultyKey;

    const syncAllDiffStyles = () => {
      diffWrap.querySelectorAll("label").forEach((lbl) => {
        const radio = lbl.querySelector('input[type="radio"]');
        const active = !!radio?.checked;
        lbl.style.borderColor = active ? "#39ff8f" : "#1a2a3d";
        lbl.style.background = active ? "rgba(17, 36, 28, 0.8)" : "#0f1623";
        lbl.style.color = active ? "#e4ffe8" : "#dbe7ff";
      });
    };

    const makeDiffOption = (key, label) => {
      const option = document.createElement("label");
      option.style.display = "flex";
      option.style.alignItems = "center";
      option.style.justifyContent = "center";
      option.style.padding = "8px 10px";
      option.style.border = "1px solid #1a2a3d";
      option.style.borderRadius = "6px";
      option.style.background = "#0f1623";
      option.style.cursor = "pointer";
      option.style.fontSize = "13px";

      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "difficulty";
      radio.value = key;
      radio.checked = key === selectedKey;
      radio.style.marginRight = "6px";

      const text = document.createElement("span");
      text.textContent = label;

      option.appendChild(radio);
      option.appendChild(text);

      radio.addEventListener("change", () => {
        if (!radio.checked) return;
        selectedKey = key;
        syncAllDiffStyles();
      });

      return option;
    };

    diffWrap.appendChild(makeDiffOption("easy", "Easy"));
    diffWrap.appendChild(makeDiffOption("medium", "Medium"));
    diffWrap.appendChild(makeDiffOption("hard", "Hard"));
    syncAllDiffStyles();

    const startBtn = document.createElement("button");
    startBtn.type = "button";
    startBtn.textContent = "Start";
    startBtn.style.width = "100%";
    startBtn.style.padding = "10px 12px";
    startBtn.style.borderRadius = "8px";
    startBtn.style.border = "1px solid #39ff8f";
    startBtn.style.background = "#10241c";
    startBtn.style.color = "#e4ffe8";
    startBtn.style.fontWeight = "700";
    startBtn.style.cursor = "pointer";

    const onStart = () => {
      const name = normalizePlayerName(nameInput.value);
      this.playerName = name;
      writeStorage(PLAYER_NAME_STORAGE_KEY, name);
      this.applyDifficulty(selectedKey);
      writeStorage(DIFFICULTY_STORAGE_KEY, selectedKey);
      this.isStartScreenActive = false;
      overlay.remove();
    };

    startBtn.addEventListener("click", onStart);
    nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") onStart();
    });

    panel.appendChild(brandHeader);
    panel.appendChild(nameLabel);
    panel.appendChild(nameInput);
    panel.appendChild(diffLabel);
    panel.appendChild(diffWrap);
    panel.appendChild(startBtn);
    overlay.appendChild(panel);
    host.appendChild(overlay);
  }

  showGameOverScreen() {
    const host = this.game?.canvas?.parentElement;
    if (!host) return;
    host.style.position = host.style.position || "relative";

    const overlayId = "geeklabs-td-gameover-overlay";
    const existingOverlay = host.querySelector(`#${overlayId}`);
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement("div");
    overlay.id = overlayId;
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "rgba(6, 8, 12, 0.9)";
    overlay.style.zIndex = "6";

    const panel = document.createElement("div");
    panel.style.minWidth = "360px";
    panel.style.padding = "22px 26px";
    panel.style.background = "rgba(11, 15, 20, 0.96)";
    panel.style.border = "1px solid #6a294a";
    panel.style.borderRadius = "10px";
    panel.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.5)";
    panel.style.color = "#f5d6e6";
    panel.style.fontFamily = "monospace";

    const brandHeader = makeBrandHeader();

    const title = document.createElement("div");
    title.textContent = "Game Over";
    title.style.fontSize = "20px";
    title.style.fontWeight = "700";
    title.style.marginBottom = "12px";

    const stats = document.createElement("div");
    stats.style.display = "grid";
    stats.style.gridTemplateColumns = "1fr";
    stats.style.rowGap = "6px";
    stats.style.marginBottom = "14px";
    stats.style.color = "#dbe7ff";

    const makeStat = (label, value) => {
      const row = document.createElement("div");
      row.textContent = `${label}: ${value}`;
      return row;
    };

    stats.appendChild(makeStat("Player", this.playerName));
    stats.appendChild(makeStat("Difficulty", this.difficultyLabel));
    stats.appendChild(makeStat("Wave", this.wave));
    stats.appendChild(makeStat("Total Kills", this.killCount));
    stats.appendChild(makeStat("Final Score", this.score));

    const btnWrap = document.createElement("div");
    btnWrap.style.display = "grid";
    btnWrap.style.gridTemplateColumns = "1fr";
    btnWrap.style.gap = "8px";
    btnWrap.style.marginBottom = "10px";

    const makeButton = (label, border, bg, color) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.style.width = "100%";
      btn.style.padding = "10px 12px";
      btn.style.borderRadius = "8px";
      btn.style.border = border;
      btn.style.background = bg;
      btn.style.color = color;
      btn.style.fontWeight = "700";
      btn.style.cursor = "pointer";
      return btn;
    };

    const restartBtn = makeButton("Restart", "1px solid #39ff8f", "#10241c", "#e4ffe8");
    const changeBtn = makeButton("Change name / difficulty", "1px solid #6a9ad8", "#101a28", "#dbe7ff");
    const leaderboardBtn = makeButton("Leaderboard", "1px solid #d8a96a", "#241c10", "#ffe7c8");

    const leaderboardPanel = document.createElement("div");
    leaderboardPanel.style.display = "none";
    leaderboardPanel.style.padding = "10px 12px";
    leaderboardPanel.style.border = "1px solid #2b3f5e";
    leaderboardPanel.style.borderRadius = "8px";
    leaderboardPanel.style.background = "rgba(15, 22, 35, 0.95)";
    leaderboardPanel.style.color = "#dbe7ff";
    leaderboardPanel.style.fontSize = "13px";

    const leaderboardHeader = document.createElement("div");
    leaderboardHeader.style.display = "flex";
    leaderboardHeader.style.alignItems = "center";
    leaderboardHeader.style.justifyContent = "space-between";
    leaderboardHeader.style.marginBottom = "8px";

    const leaderboardTitle = document.createElement("div");
    leaderboardTitle.textContent = "Top 10";
    leaderboardTitle.style.fontWeight = "700";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.textContent = "Clear leaderboard";
    clearBtn.style.border = "1px solid #5b3a2a";
    clearBtn.style.background = "#1a120c";
    clearBtn.style.color = "#f0d7c0";
    clearBtn.style.borderRadius = "6px";
    clearBtn.style.padding = "4px 8px";
    clearBtn.style.fontSize = "11px";
    clearBtn.style.cursor = "pointer";

    const leaderboardList = document.createElement("div");
    leaderboardList.style.display = "grid";
    leaderboardList.style.rowGap = "6px";

    const renderLeaderboard = () => {
      renderLeaderboardList(leaderboardList, this.lastLeaderboardEntry);
    };

    leaderboardHeader.appendChild(leaderboardTitle);
    leaderboardHeader.appendChild(clearBtn);
    leaderboardPanel.appendChild(leaderboardHeader);
    leaderboardPanel.appendChild(leaderboardList);

    restartBtn.addEventListener("click", () => {
      overlay.remove();
      this.scene.restart({
        skipStartScreen: true,
        playerName: this.playerName,
        difficultyKey: this.difficultyKey,
      });
    });

    changeBtn.addEventListener("click", () => {
      overlay.remove();
      this.scene.restart();
    });

    leaderboardBtn.addEventListener("click", () => {
      const shouldShow = leaderboardPanel.style.display === "none";
      leaderboardPanel.style.display = shouldShow ? "block" : "none";
      if (shouldShow) renderLeaderboard();
    });

    clearBtn.addEventListener("click", () => {
      if (!confirm("Clear leaderboard?")) return;
      writeLeaderboard([]);
      renderLeaderboard();
    });

    btnWrap.appendChild(restartBtn);
    btnWrap.appendChild(changeBtn);
    btnWrap.appendChild(leaderboardBtn);

    panel.appendChild(brandHeader);
    panel.appendChild(title);
    panel.appendChild(stats);
    panel.appendChild(btnWrap);
    panel.appendChild(leaderboardPanel);
    overlay.appendChild(panel);
    host.appendChild(overlay);
  }

  showPauseMenu() {
    if (this.isStartScreenActive || this.isGameOver) return;
    const host = this.game?.canvas?.parentElement;
    if (!host) return;
    host.style.position = host.style.position || "relative";

    const overlayId = "geeklabs-td-pause-overlay";
    const existingOverlay = host.querySelector(`#${overlayId}`);
    if (existingOverlay) existingOverlay.remove();

    const overlay = document.createElement("div");
    overlay.id = overlayId;
    overlay.style.position = "absolute";
    overlay.style.inset = "0";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.background = "rgba(6, 8, 12, 0.85)";
    overlay.style.zIndex = "6";

    const panel = document.createElement("div");
    panel.style.minWidth = "340px";
    panel.style.padding = "22px 26px";
    panel.style.background = "rgba(11, 15, 20, 0.96)";
    panel.style.border = "1px solid #3d4f6a";
    panel.style.borderRadius = "10px";
    panel.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.5)";
    panel.style.color = "#dbe7ff";
    panel.style.fontFamily = "monospace";

    const brandHeader = makeBrandHeader();

    const title = document.createElement("div");
    title.textContent = "Paused";
    title.style.fontSize = "18px";
    title.style.fontWeight = "700";
    title.style.marginBottom = "12px";

    const btnWrap = document.createElement("div");
    btnWrap.style.display = "grid";
    btnWrap.style.gridTemplateColumns = "1fr";
    btnWrap.style.gap = "8px";
    btnWrap.style.marginBottom = "10px";

    const makeButton = (label, border, bg, color) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.style.width = "100%";
      btn.style.padding = "10px 12px";
      btn.style.borderRadius = "8px";
      btn.style.border = border;
      btn.style.background = bg;
      btn.style.color = color;
      btn.style.fontWeight = "700";
      btn.style.cursor = "pointer";
      return btn;
    };

    const resumeBtn = makeButton("Resume", "1px solid #39ff8f", "#10241c", "#e4ffe8");
    const controlsBtn = makeButton("Controls", "1px solid #6a9ad8", "#101a28", "#dbe7ff");
    const leaderboardBtn = makeButton("Leaderboard", "1px solid #d8a96a", "#241c10", "#ffe7c8");
    const restartBtn = makeButton("Restart", "1px solid #39ff8f", "#10241c", "#e4ffe8");
    const changeBtn = makeButton("Change name / difficulty", "1px solid #6a9ad8", "#101a28", "#dbe7ff");

    const controlsPanel = document.createElement("div");
    controlsPanel.style.display = "none";
    controlsPanel.style.padding = "10px 12px";
    controlsPanel.style.border = "1px solid #2b3f5e";
    controlsPanel.style.borderRadius = "8px";
    controlsPanel.style.background = "rgba(15, 22, 35, 0.95)";
    controlsPanel.style.color = "#dbe7ff";
    controlsPanel.style.fontSize = "13px";

    const controlsList = document.createElement("div");
    controlsList.style.display = "grid";
    controlsList.style.rowGap = "6px";
    renderControlsList(controlsList);
    controlsPanel.appendChild(controlsList);

    const leaderboardPanel = document.createElement("div");
    leaderboardPanel.style.display = "none";
    leaderboardPanel.style.padding = "10px 12px";
    leaderboardPanel.style.border = "1px solid #2b3f5e";
    leaderboardPanel.style.borderRadius = "8px";
    leaderboardPanel.style.background = "rgba(15, 22, 35, 0.95)";
    leaderboardPanel.style.color = "#dbe7ff";
    leaderboardPanel.style.fontSize = "13px";

    const leaderboardList = document.createElement("div");
    leaderboardList.style.display = "grid";
    leaderboardList.style.rowGap = "6px";
    leaderboardPanel.appendChild(leaderboardList);

    resumeBtn.addEventListener("click", () => {
      this.setPaused(false);
    });

    controlsBtn.addEventListener("click", () => {
      const shouldShow = controlsPanel.style.display === "none";
      controlsPanel.style.display = shouldShow ? "block" : "none";
      if (shouldShow) leaderboardPanel.style.display = "none";
    });

    leaderboardBtn.addEventListener("click", () => {
      const shouldShow = leaderboardPanel.style.display === "none";
      leaderboardPanel.style.display = shouldShow ? "block" : "none";
      if (shouldShow) controlsPanel.style.display = "none";
      if (shouldShow) renderLeaderboardList(leaderboardList, null);
    });

    restartBtn.addEventListener("click", () => {
      this.setPaused(false);
      this.hidePauseMenu();
      this.scene.restart({
        skipStartScreen: true,
        playerName: this.playerName,
        difficultyKey: this.difficultyKey,
      });
    });

    changeBtn.addEventListener("click", () => {
      this.setPaused(false);
      this.hidePauseMenu();
      this.scene.restart();
    });

    btnWrap.appendChild(resumeBtn);
    btnWrap.appendChild(controlsBtn);
    btnWrap.appendChild(leaderboardBtn);
    btnWrap.appendChild(restartBtn);
    btnWrap.appendChild(changeBtn);

    panel.appendChild(brandHeader);
    panel.appendChild(title);
    panel.appendChild(btnWrap);
    panel.appendChild(controlsPanel);
    panel.appendChild(leaderboardPanel);
    overlay.appendChild(panel);
    host.appendChild(overlay);
  }

  hidePauseMenu() {
    const host = this.game?.canvas?.parentElement;
    if (!host) return;
    const existingOverlay = host.querySelector("#geeklabs-td-pause-overlay");
    if (existingOverlay) existingOverlay.remove();
  }

  triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    if (this.autoStartTimer) {
      this.autoStartTimer.remove(false);
      this.autoStartTimer = null;
    }
    if (this.isPlacing) this.setPlacement(false);
    this.clearSelection();
    this.setInspectorVisible(false);
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
    updateLeaderboard(this.lastLeaderboardEntry);
    this.showGameOverScreen();
  }

  computeWaveConfig(wave) {
    return computeWaveConfigFn.call(this, wave);
  }

  enterIntermission(isInitial = false) {
    enterIntermissionFn.call(this, isInitial);
  }

  tryStartWave() {
    tryStartWaveFn.call(this);
  }

  startWave(wave) {
    startWaveFn.call(this, wave);
  }

  buildInspector() {
    const pad = 14;
    const w = 300;
    const h = 190;
    this.inspectorW = w;
    this.inspectorH = h;
    this.inspectorX = this.scale.width - w - pad;
    this.inspectorY = this.scale.height - h - pad;

    this.inspectorBg = this.add.graphics();
    this.inspectorBg.setDepth(10000);

    this.panel = this.add.text(this.inspectorX + 12, this.inspectorY + 10, "", {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#dbe7ff",
    });
    this.panel.setDepth(10001);

    const btnY = this.inspectorY + h - 44;
    const btnH = 28;
    const gap = 10;
    const btnW = Math.floor((w - 24 - gap * 2) / 3);

    this.upgradeBtn = this.makeButton(this.inspectorX + 12, btnY, btnW, btnH, "Upgrade (U)", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      if (this.selectedTower && this.towers.includes(this.selectedTower)) this.tryUpgradeTower(this.selectedTower);
    });

    this.sellBtn = this.makeButton(this.inspectorX + 12 + btnW + gap, btnY, btnW, btnH, "Sell (X)", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      if (this.selectedTower && this.towers.includes(this.selectedTower)) this.trySellTower(this.selectedTower);
    });

    this.targetBtn = this.makeButton(this.inspectorX + 12 + (btnW + gap) * 2, btnY, btnW, btnH, "Target (F)", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      if (this.selectedTower && this.towers.includes(this.selectedTower)) this.cycleTargetMode(this.selectedTower);
    });

    this.setInspectorVisible(false);
    this.drawInspectorBg(false);
  }

  makeButton(x, y, w, h, label, onClick) {
    const bg = this.add.graphics();
    bg.setDepth(10002);

    const text = this.add.text(x + w / 2, y + h / 2, label, {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#dbe7ff",
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(10003);

    const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x000000, 0);
    hit.setDepth(10004);
    hit.setInteractive({ useHandCursor: true });

    const draw = (enabled, hover = false, down = false) => {
      bg.clear();
      const fill = enabled ? 0x101a2a : 0x0a0f18;
      const alpha = enabled ? (hover ? 0.92 : 0.78) : 0.55;
      const stroke = enabled ? (hover ? 0x39ff8f : 0x294a6a) : 0x1a2a3d;

      bg.fillStyle(fill, alpha);
      bg.fillRoundedRect(x, y, w, h, 6);

      bg.lineStyle(down ? 2 : 1, stroke, 1);
      bg.strokeRoundedRect(x, y, w, h, 6);

      text.setAlpha(enabled ? 1 : 0.5);
    };

    hit.on("pointerover", () => draw(hit.enabled, true, false));
    hit.on("pointerout", () => draw(hit.enabled, false, false));
    hit.on("pointerdown", () => draw(hit.enabled, true, true));
    hit.on("pointerup", () => {
      draw(hit.enabled, true, false);
      if (hit.enabled) onClick();
    });

    hit.enabled = true;
    draw(true, false, false);
    return { bg, text, hit, draw };
  }

  setInspectorVisible(v) {
    this.inspectorVisible = v;
    this.inspectorBg.setVisible(v);
    this.panel.setVisible(v);
    this.upgradeBtn.bg.setVisible(v);
    this.upgradeBtn.text.setVisible(v);
    this.upgradeBtn.hit.setVisible(v);
    this.sellBtn.bg.setVisible(v);
    this.sellBtn.text.setVisible(v);
    this.sellBtn.hit.setVisible(v);
    this.targetBtn.bg.setVisible(v);
    this.targetBtn.text.setVisible(v);
    this.targetBtn.hit.setVisible(v);
  }

  drawInspectorBg(hasSelection) {
    this.inspectorBg.clear();
    const x = this.inspectorX;
    const y = this.inspectorY;
    const w = this.inspectorW;
    const h = this.inspectorH;

    this.inspectorBg.fillStyle(0x0b0f14, 0.72);
    this.inspectorBg.fillRoundedRect(x, y, w, h, 10);

    this.inspectorBg.lineStyle(1, hasSelection ? 0x294a6a : 0x1a2a3d, 1);
    this.inspectorBg.strokeRoundedRect(x, y, w, h, 10);
  }

  update(time, dt) {
    if (this.isGameOver || this.isPaused || this.isStartScreenActive) return;

    for (const t of this.towers) {
      if (time < t.nextShotAt) continue;
      const target = findTargetFn.call(this, t, t.targetMode);
      if (!target) continue;
      t.nextShotAt = time + t.fireMs;
      fireBulletFn.call(this, t, target);
    }

    this.enemies.children.iterate((e) => {
      if (!e) return;
      advanceEnemyFn.call(this, e, dt);
    });

    this.updateWaveSpawning(time);

    if (this.isPlacing) {
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
      if (this.waveEnemiesSpawned >= this.waveEnemiesTotal && alive === 0) {
        const clearBonus = 6 + Math.floor(this.wave * 1.5);
        this.money += clearBonus;
        this.score += clearBonus;
        this.wave += 1;
        this.enterIntermission(false);
      }
    }

    this.updateUI();
  }

  updateWaveSpawning(time) {
    updateWaveSpawningFn.call(this, time);
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
  }
  togglePlacement() {
    this.setPlacement(!this.isPlacing);
  }

  setPlacement(on) {
    if (on === this.isPlacing) return;
    this.isPlacing = on;

    if (on) {
      this.clearSelection();
      if (!this.didShowPlaceToast) {
        this.didShowPlaceToast = true;
        this.showToast("Placement: press 1/2/3 to switch tower type.", 2600);
      }
      this.ghost = this.add.image(0, 0, this.getTowerTextureKey(this.placeType));
      this.ghost.setDepth(9000);
      this.ghost.setAlpha(0.5);
      const p = this.input.activePointer;
      this.updateGhost(p.worldX, p.worldY);
      this.hideRangeRing();
      return;
    }

    if (this.ghost) {
      this.ghost.destroy();
      this.ghost = null;
    }
    this.placeHint.setText("");
    this.hideRangeRing();
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
    this.placeHint.setText(
      `Placing: ${def.name} [${def.hotkey}]  Cost: $${tier0.cost}  Range: ${tier0.range}  ${ok}${need}   (1/2/3: switch)`
    );
  }

  showGhostRing(x, y, range, color) {
    this.rangeRing.clear();
    this.rangeRing.lineStyle(2, color, 0.9);
    this.rangeRing.strokeCircle(x, y, range);
    this.rangeRing.setVisible(true);
  }

  showRangeRing(tower, color) {
    this.rangeRing.clear();
    this.rangeRing.lineStyle(2, color, 0.9);
    this.rangeRing.strokeCircle(tower.x, tower.y, tower.range);
    this.rangeRing.setVisible(true);
  }

  hideRangeRing() {
    this.rangeRing.setVisible(false);
    this.rangeRing.clear();
  }

  makeTextures() {
    if (this.textures.exists("tower") && this.textures.exists("tower_rapid")) return;
    const g = this.add.graphics();
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 30, 30);
    g.lineStyle(2, 0x0b0f14, 1);
    g.strokeRect(0, 0, 30, 30);
    g.generateTexture("tower", 30, 30);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(15, 15, 15);
    g.lineStyle(2, 0x0b0f14, 1);
    g.strokeCircle(15, 15, 15);
    g.generateTexture("tower_rapid", 30, 30);

    g.clear();
    g.fillStyle(0xff4d6d, 1);
    g.fillRect(0, 0, 24, 24);
    g.generateTexture("enemy", 24, 24);

    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
    g.generateTexture("bullet", 8, 8);
    g.destroy();
  }

  drawGrid() {
    const w = this.scale.width;
    const h = this.scale.height;
    const gw = Math.floor(w / GRID) * GRID;
    const gx = Math.floor((w - gw) / 2);
    this.g.lineStyle(1, 0x142033, 1);
    for (let x = 0; x <= gw; x += GRID) this.g.lineBetween(gx + x, TOP_UI, gx + x, h);
    for (let y = TOP_UI; y <= h; y += GRID) this.g.lineBetween(gx, y, gx + gw, y);
    this.g.lineStyle(2, 0x294a6a, 1);
    this.g.lineBetween(0, TOP_UI, w, TOP_UI);
  }

  drawPath() {
    this.g.lineStyle(10, 0x1b2a43, 1);
    for (let i = 0; i < this.path.length - 1; i++) {
      const a = this.path[i];
      const b = this.path[i + 1];
      this.g.lineBetween(a.x, a.y, b.x, b.y);
    }
    this.g.fillStyle(0x2a3f63, 1);
    for (const p of this.path) this.g.fillCircle(p.x, p.y, 6);
  }

  isOnPath(x, y) {
    const r = 24;
    for (let i = 0; i < this.path.length - 1; i++) {
      const a = this.path[i];
      const b = this.path[i + 1];
      const d = this.pointToSegmentDistance(x, y, a.x, a.y, b.x, b.y);
      if (d <= r) return true;
    }
    return false;
  }

  pointToSegmentDistance(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;
    const ab2 = abx * abx + aby * aby;
    const t = ab2 === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));
    const cx = ax + t * abx;
    const cy = ay + t * aby;
    const dx = px - cx;
    const dy = py - cy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getTowerAt(wx, wy) {
    const x = snapX(wx);
    const y = snapY(wy);
    return this.towers.find((t) => t.x === x && t.y === y);
  }

  getTowerTextureKey(type) {
    return type === "rapid" ? "tower_rapid" : "tower";
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
    return getNextUpgradeCostFn.call(this, t);
  }

  applyTowerTier(t, tierIdx) {
    applyTowerTierFn.call(this, t, tierIdx);
  }

  tryUpgradeTower(t) {
    tryUpgradeTowerFn.call(this, t);
  }

  tryPlaceTowerAt(x, y) {
    if (!this.canPlaceTowerAt(x, y)) return;
    const def = this.getPlaceDef();
    const tier0 = def.tiers[0];
    this.money -= tier0.cost;
    const img = this.add.image(x, y, this.getTowerTextureKey(def.key));
    let badge = null;
    if (def.key === "sniper") {
      badge = this.add.text(x, y, "S", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#0b0f14",
        backgroundColor: "#ffc857",
        padding: { x: 4, y: 2 },
      });
      badge.setOrigin(0.5, 0.5);
      badge.setDepth(img.depth + 1);
    }
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
      targetMode: "close",
      sprite: img,
      badge,
    };
    img.setTint(tier0.tint);
    img.setScale(tier0.scale ?? 1);
    this.towers.push(t);
    this.selectTower(t);
  }

  trySellTower(t) {
    trySellTowerFn.call(this, t);
  }

  cycleTargetMode(t) {
    cycleTargetModeFn.call(this, t);
  }

  spawnEnemyOfType(typeKey, opts = {}) {
    return spawnEnemyOfTypeFn.call(this, typeKey, opts);
  }

  fireBullet(t, target) {
    fireBulletFn.call(this, t, target);
  }
}

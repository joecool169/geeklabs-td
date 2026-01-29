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
import * as Enemies from "./game/enemies.js";
import * as UI from "./game/ui.js";
import * as Towers from "./game/towers.js";
import * as Waves from "./game/waves.js";
import { TOWER_DEFS } from "./constants.js";

const PLAYER_NAME_STORAGE_KEY = "defense_protocol_player_name_v1";
const DIFFICULTY_STORAGE_KEY = "defense_protocol_difficulty_v1";
const LEADERBOARD_STORAGE_KEY = "defense_protocol_leaderboard_v1";
const HELP_OVERLAY_STORAGE_KEY = "defense_protocol_help_overlay_v1";
const BRAND_LOGO_URL = "/brand/defense-protocol.png";
const BRAND_TITLE = "Defense Protocol";
const BRAND_TAGLINE = "Protocol engaged. Hold the line.";
const DEFAULT_DIFFICULTY_KEY = "easy";
const SFX_CONFIG = {
  place: { url: "/sfx/place.wav", volume: 0.26 },
  upgrade: { url: "/sfx/upgrade.wav", volume: 0.26 },
  sell: { url: "/sfx/sell.wav", volume: 0.26 },
  wave: { url: "/sfx/wave.wav", volume: 0.35 },
  death: { url: "/sfx/death.wav", volume: 0.35 },
  life: { url: "/sfx/life.wav", volume: 0.35 },
  gameover: { url: "/sfx/gameover.wav", volume: 0.45 },
};
const LASER_MAX_PIERCE = 5;
const CONTROLS = [
  { key: "T", action: "Toggle placement mode" },
  { key: "Click", action: "Place tower" },
  { key: "1 / 2 / 3 / 4", action: "Select tower" },
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

const getLeaderboardStorageKey = (difficultyKey) =>
  `${LEADERBOARD_STORAGE_KEY}:${normalizeDifficultyKey(difficultyKey)}`;

const safeParseLeaderboard = (difficultyKey) => {
  const raw = readStorage(getLeaderboardStorageKey(difficultyKey));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Leaderboard data not array.");
    return parsed.filter((entry) => entry && typeof entry === "object");
  } catch {
    writeStorage(getLeaderboardStorageKey(difficultyKey), "[]");
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

const writeLeaderboard = (entries, difficultyKey) => {
  try {
    writeStorage(getLeaderboardStorageKey(difficultyKey), JSON.stringify(entries));
  } catch {
    return null;
  }
  return null;
};

const updateLeaderboard = (entry, difficultyKey) => {
  const entries = safeParseLeaderboard(difficultyKey);
  entries.push(entry);
  entries.sort(compareLeaderboardEntries);
  const trimmed = entries.slice(0, 10);
  writeLeaderboard(trimmed, difficultyKey);
  return trimmed;
};

const renderLeaderboardEntries = (container, entries, currentEntry) => {
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

const renderLeaderboardMessage = (container, message) => {
  container.innerHTML = "";
  const text = document.createElement("div");
  text.textContent = message;
  text.style.color = "#9fb2cc";
  container.appendChild(text);
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

const renderLeaderboardList = (container, currentEntry, difficultyKey) => {
  const entries = safeParseLeaderboard(difficultyKey).sort(compareLeaderboardEntries);
  renderLeaderboardEntries(container, entries, currentEntry);
};

const fetchGlobalLeaderboard = async (difficultyKey, limit = 10) => {
  const diff = normalizeDifficultyKey(difficultyKey);
  const url = `/api/leaderboard?difficulty=${encodeURIComponent(diff)}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Global leaderboard request failed");
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map((item) => {
    const key = item.difficulty || diff;
    return {
      name: item.name || "Player",
      score: Number(item.score) || 0,
      wave: Number(item.wave) || 0,
      kills: Number(item.kills) || 0,
      difficultyKey: key,
      difficultyLabel: DIFFICULTY_CONFIG[key]?.label ?? key,
      dateISO: item.created_at,
    };
  });
};

const submitGlobalScore = async (entry) => {
  const rawDifficulty = entry?.difficultyKey ?? entry?.difficultyLabel ?? DEFAULT_DIFFICULTY_KEY;
  const difficulty = normalizeDifficultyKey(rawDifficulty);
  const payload = {
    name: entry?.name,
    difficulty,
    score: entry?.score ?? 0,
    wave: entry?.wave ?? 0,
    kills: entry?.kills ?? 0,
  };
  try {
    fetch("/api/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
  } catch {
    return null;
  }
  return null;
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
    if (overlayHost) {
      const oldOverlay = overlayHost.querySelector("#defense-protocol-gameover-overlay");
      if (oldOverlay) oldOverlay.remove();
    }

    this.playerName = normalizePlayerName(readStorage(PLAYER_NAME_STORAGE_KEY));
    this.difficultyKey = normalizeDifficultyKey(readStorage(DIFFICULTY_STORAGE_KEY));
    if (this.startOptions?.playerName) this.playerName = normalizePlayerName(this.startOptions.playerName);
    if (this.startOptions?.difficultyKey) this.difficultyKey = normalizeDifficultyKey(this.startOptions.difficultyKey);
    this.difficulty = DIFFICULTY_CONFIG[this.difficultyKey];
    this.difficultyLabel = this.difficulty.label;

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
    this.activeWaves = [];
    this.spaceArmedAt = 0;
    this.spaceArmMode = null;
    this.nextWaveNumberToSpawn = this.wave;
    this.blockWaveStart = this.wave;

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

    this.isStartScreenActive = !this.startOptions?.skipStartScreen;
    this.isGameOver = false;
    this.isPaused = false;
    Object.entries(SFX_CONFIG).forEach(([key, cfg]) => {
      if (!this.cache.audio.exists(key)) return;
      const volume = typeof cfg.volume === "number" ? cfg.volume : 0.4;
      this.sfx[key] = this.sound.add(key, { volume });
    });
    this.showHelp = readStorage(HELP_OVERLAY_STORAGE_KEY) === "true";
    this.controlsSelectedEl = document.getElementById("controls-selected");
    this.controlsPlacementEl = document.getElementById("controls-placement");
    this.selectedTowerPanelEl = document.getElementById("selected-tower-panel");
    this.selectedTowerNameEl = document.getElementById("tower-name");
    this.selectedTowerTargetEl = document.getElementById("tower-target");
    this.selectedTowerDmgEl = document.getElementById("tower-dmg");
    this.selectedTowerFireEl = document.getElementById("tower-fire");
    this.selectedTowerRangeEl = document.getElementById("tower-range");
    this.selectedTowerDpsEl = document.getElementById("tower-dps");
    this.selectedTowerUpgradeEl = document.getElementById("tower-upgrade");
    this.selectedTowerSellEl = document.getElementById("tower-sell");
    this.selectedTowerUpgradeBtnEl = document.getElementById("tower-upgrade-btn");
    this.selectedTowerSellBtnEl = document.getElementById("tower-sell-btn");
    this.selectedTowerTargetBtnEl = document.getElementById("tower-target-btn");
    this.buildTowerDefs = Object.values(TOWER_DEFS).sort((a, b) => Number(a.hotkey) - Number(b.hotkey));
    this.buildMenuSectionEl = document.getElementById("build-menu");
    this.buildMenuEl = document.getElementById("build-menu-list");
    this.buildMenuSlots = [];
    if (this.buildMenuEl) {
      this.buildMenuEl.innerHTML = "";
      for (const def of this.buildTowerDefs) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "build-slot";
        btn.dataset.towerKey = def.key;
        const name = document.createElement("span");
        name.className = "build-name";
        name.textContent = def.name;
        const right = document.createElement("span");
        right.className = "build-right";
        const keycap = document.createElement("span");
        keycap.className = "keycap";
        keycap.textContent = def.hotkey;
        const meta = document.createElement("span");
        meta.className = "build-meta";
        right.appendChild(keycap);
        right.appendChild(meta);
        btn.appendChild(name);
        btn.appendChild(right);
        btn.addEventListener("click", () => {
          if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
          this.trySetPlaceType(def.key);
        });
        this.buildMenuEl.appendChild(btn);
        this.buildMenuSlots.push({ def, el: btn, metaEl: meta, wasLocked: null });
      }
    }
    this.towerStripEl = document.getElementById("tower-strip");
    this.towerStripSlots = [];
    if (this.towerStripEl) {
      this.towerStripEl.innerHTML = "";
      for (const def of this.buildTowerDefs) {
        const card = document.createElement("div");
        card.className = "tower-card";
        card.dataset.towerKey = def.key;
        const title = document.createElement("div");
        title.className = "tower-card-title";
        title.textContent = def.name;
        const desc = document.createElement("div");
        desc.className = "tower-card-desc";
        desc.textContent = def.desc || "";
        const meta = document.createElement("div");
        meta.className = "tower-card-meta";
        const metaText = document.createElement("span");
        const keycap = document.createElement("span");
        keycap.className = "keycap";
        keycap.textContent = def.hotkey;
        meta.appendChild(metaText);
        meta.appendChild(keycap);
        card.appendChild(title);
        card.appendChild(desc);
        card.appendChild(meta);
        card.addEventListener("click", () => {
          if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
          this.trySetPlaceType(def.key);
        });
        this.towerStripEl.appendChild(card);
        this.towerStripSlots.push({ def, el: card, metaEl: metaText, keyEl: keycap, wasLocked: null });
      }
    }
    if (this.selectedTowerUpgradeBtnEl) {
      this.selectedTowerUpgradeBtnEl.addEventListener("click", () => {
        if (!this.selectedTower || !this.towers.includes(this.selectedTower)) return;
        this.tryUpgradeTower(this.selectedTower);
      });
    }
    if (this.selectedTowerSellBtnEl) {
      this.selectedTowerSellBtnEl.addEventListener("click", () => {
        if (!this.selectedTower || !this.towers.includes(this.selectedTower)) return;
        this.trySellTower(this.selectedTower);
      });
    }
    if (this.selectedTowerTargetBtnEl) {
      this.selectedTowerTargetBtnEl.addEventListener("click", () => {
        if (!this.selectedTower || !this.towers.includes(this.selectedTower)) return;
        this.cycleTargetMode(this.selectedTower);
      });
    }
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

    this.input.mouse?.disableContextMenu();

    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyT = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.T);
    this.keyU = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.U);
    this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.key4 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.keyH = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.H);
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
      this.trySetPlaceType("basic");
    });

    this.key2.on("down", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      this.trySetPlaceType("rapid");
    });

    this.key3.on("down", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      this.trySetPlaceType("sniper");
    });

    this.key4.on("down", () => {
      if (this.isPaused || this.isStartScreenActive || this.isGameOver) return;
      this.trySetPlaceType("laser");
    });

    this.keyP.on("down", () => {
      if (this.isStartScreenActive || this.isGameOver) return;
      this.togglePause();
    });

    this.keyH.on("down", () => {
      if (this.isStartScreenActive || this.isGameOver) return;
      this.emphasizeControlsPanel();
      this.setHelpOverlay(!this.showHelp);
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
      const now = this.time.now;
      if (this.waveState === "intermission") {
        if (now < this.nextWaveAvailableAt) {
          if (this.spaceArmMode === "intermission" && now - this.spaceArmedAt <= WAVE_SPAM_WINDOW_MS) {
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
      if (this.waveState === "running") {
        if ((this.activeWaves?.length || 0) >= MAX_CONCURRENT_SPAWNERS) {
          this.showToast(`Spawner cap reached (${MAX_CONCURRENT_SPAWNERS}).`, 1400);
          return;
        }
        if (this.spaceArmMode === "running" && now - this.spaceArmedAt <= WAVE_SPAM_WINDOW_MS) {
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

    this.updateUI();
    this.enterIntermission(true);
    if (this.isStartScreenActive) {
      this.showStartScreen();
    } else {
      this.applyDifficulty(this.difficultyKey);
    }
  }

  showToast(msg, ms = 2400) {
    UI.showToast.call(this, msg, ms);
  }

  updateUI() {
    UI.updateUI.call(this);
  }

  applyDifficulty(key, opts = {}) {
    const normalized = normalizeDifficultyKey(key);
    const cfg = DIFFICULTY_CONFIG[normalized];
    this.difficultyKey = normalized;
    this.difficulty = cfg;
    this.difficultyLabel = cfg.label;
    this.money = cfg.startingMoney;
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
    const overlayId = "defense-protocol-start-overlay";
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
    panel.style.minWidth = "460px";
    panel.style.padding = "34px 38px";
    panel.style.background = "rgba(11, 15, 20, 0.95)";
    panel.style.border = "1px solid #294a6a";
    panel.style.borderRadius = "10px";
    panel.style.boxShadow = "0 12px 40px rgba(0, 0, 0, 0.45)";
    panel.style.color = "#dbe7ff";
    panel.style.fontFamily = "monospace";

    const brandHeader = makeBrandHeader();
    const brandLogo = brandHeader.querySelector("img");
    if (brandLogo) brandLogo.style.width = "192px";
    const brandText = brandHeader.querySelectorAll("div");
    const brandTitle = brandText[0];
    const brandTagline = brandText[1];
    if (brandTitle) {
      brandTitle.style.fontSize = "20px";
      brandTitle.style.lineHeight = "1.22";
    }
    if (brandTagline) brandTagline.style.fontSize = "13px";

    const nameLabel = document.createElement("label");
    nameLabel.textContent = "Player name";
    nameLabel.style.display = "block";
    nameLabel.style.fontSize = "14px";
    nameLabel.style.color = "#9fb3d8";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.value = this.playerName;
    nameInput.placeholder = "Player";
    nameInput.style.width = "100%";
    nameInput.style.marginTop = "8px";
    nameInput.style.marginBottom = "16px";
    nameInput.style.padding = "12px 14px";
    nameInput.style.fontSize = "14px";
    nameInput.style.borderRadius = "6px";
    nameInput.style.border = "1px solid #294a6a";
    nameInput.style.background = "#0f1623";
    nameInput.style.color = "#dbe7ff";

    const diffLabel = document.createElement("div");
    diffLabel.textContent = "Difficulty";
    diffLabel.style.fontSize = "14px";
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
      option.style.fontSize = "14px";

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
    startBtn.style.padding = "12px 16px";
    startBtn.style.borderRadius = "8px";
    startBtn.style.border = "1px solid #39ff8f";
    startBtn.style.background = "#10241c";
    startBtn.style.color = "#e4ffe8";
    startBtn.style.fontWeight = "700";
    startBtn.style.fontSize = "14px";
    startBtn.style.cursor = "pointer";

    const onStart = () => {
      const name = normalizePlayerName(nameInput.value);
      this.playerName = name;
      writeStorage(PLAYER_NAME_STORAGE_KEY, name);
      this.applyDifficulty(selectedKey);
      writeStorage(DIFFICULTY_STORAGE_KEY, selectedKey);
      this.isStartScreenActive = false;
      if (this.input?.keyboard) {
        this.input.keyboard.enabled = true;
        this.input.keyboard.enableGlobalCapture();
      }
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
    if (this.input?.keyboard) {
      this.input.keyboard.enabled = false;
      this.input.keyboard.disableGlobalCapture();
    }
    nameInput.focus();
  }

  showGameOverScreen() {
    const host = this.game?.canvas?.parentElement;
    if (!host) return;
    host.style.position = host.style.position || "relative";

    const overlayId = "defense-protocol-gameover-overlay";
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

    const makeToggleButton = (label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.style.border = "1px solid #2b3f5e";
      btn.style.borderRadius = "6px";
      btn.style.padding = "4px 8px";
      btn.style.fontSize = "11px";
      btn.style.background = "#0f1623";
      btn.style.color = "#9fb2cc";
      btn.style.cursor = "pointer";
      return btn;
    };

    const setToggleActive = (btn, active) => {
      btn.style.borderColor = active ? "#6a9ad8" : "#2b3f5e";
      btn.style.background = active ? "#101a28" : "#0f1623";
      btn.style.color = active ? "#dbe7ff" : "#9fb2cc";
    };

    const leaderboardToggle = document.createElement("div");
    leaderboardToggle.style.display = "flex";
    leaderboardToggle.style.gap = "6px";

    const localBtn = makeToggleButton("Local");
    const globalBtn = makeToggleButton("Global");
    leaderboardToggle.appendChild(localBtn);
    leaderboardToggle.appendChild(globalBtn);

    const leaderboardList = document.createElement("div");
    leaderboardList.style.display = "grid";
    leaderboardList.style.rowGap = "6px";

    let leaderboardMode = "local";
    let globalRequestId = 0;
    const renderLocal = () => {
      renderLeaderboardList(leaderboardList, this.lastLeaderboardEntry, this.difficultyKey);
    };
    const renderGlobal = () => {
      const requestId = (globalRequestId += 1);
      renderLeaderboardMessage(leaderboardList, "Loading...");
      fetchGlobalLeaderboard(this.difficultyKey, 10)
        .then((entries) => {
          if (requestId !== globalRequestId) return;
          const sorted = entries.slice().sort(compareLeaderboardEntries);
          renderLeaderboardEntries(leaderboardList, sorted, null);
        })
        .catch(() => {
          if (requestId !== globalRequestId) return;
          renderLeaderboardMessage(leaderboardList, "Global leaderboard unavailable.");
        });
    };
    const renderLeaderboard = () => {
      if (leaderboardMode === "global") {
        renderGlobal();
      } else {
        renderLocal();
      }
      setToggleActive(localBtn, leaderboardMode === "local");
      setToggleActive(globalBtn, leaderboardMode === "global");
    };

    leaderboardHeader.appendChild(leaderboardTitle);
    leaderboardHeader.appendChild(leaderboardToggle);
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

    localBtn.addEventListener("click", () => {
      leaderboardMode = "local";
      renderLeaderboard();
    });
    globalBtn.addEventListener("click", () => {
      leaderboardMode = "global";
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

    const overlayId = "defense-protocol-pause-overlay";
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

    const makeToggleButton = (label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.style.border = "1px solid #2b3f5e";
      btn.style.borderRadius = "6px";
      btn.style.padding = "4px 8px";
      btn.style.fontSize = "11px";
      btn.style.background = "#0f1623";
      btn.style.color = "#9fb2cc";
      btn.style.cursor = "pointer";
      return btn;
    };

    const setToggleActive = (btn, active) => {
      btn.style.borderColor = active ? "#6a9ad8" : "#2b3f5e";
      btn.style.background = active ? "#101a28" : "#0f1623";
      btn.style.color = active ? "#dbe7ff" : "#9fb2cc";
    };

    const leaderboardHeader = document.createElement("div");
    leaderboardHeader.style.display = "flex";
    leaderboardHeader.style.alignItems = "center";
    leaderboardHeader.style.justifyContent = "space-between";
    leaderboardHeader.style.marginBottom = "8px";

    const leaderboardTitle = document.createElement("div");
    leaderboardTitle.textContent = "Top 10";
    leaderboardTitle.style.fontWeight = "700";

    const leaderboardToggle = document.createElement("div");
    leaderboardToggle.style.display = "flex";
    leaderboardToggle.style.gap = "6px";

    const localBtn = makeToggleButton("Local");
    const globalBtn = makeToggleButton("Global");
    leaderboardToggle.appendChild(localBtn);
    leaderboardToggle.appendChild(globalBtn);

    const leaderboardList = document.createElement("div");
    leaderboardList.style.display = "grid";
    leaderboardList.style.rowGap = "6px";

    leaderboardHeader.appendChild(leaderboardTitle);
    leaderboardHeader.appendChild(leaderboardToggle);
    leaderboardPanel.appendChild(leaderboardHeader);
    leaderboardPanel.appendChild(leaderboardList);

    let leaderboardMode = "local";
    let globalRequestId = 0;
    const renderLocal = () => {
      renderLeaderboardList(leaderboardList, null, this.difficultyKey);
    };
    const renderGlobal = () => {
      const requestId = (globalRequestId += 1);
      renderLeaderboardMessage(leaderboardList, "Loading...");
      fetchGlobalLeaderboard(this.difficultyKey, 10)
        .then((entries) => {
          if (requestId !== globalRequestId) return;
          const sorted = entries.slice().sort(compareLeaderboardEntries);
          renderLeaderboardEntries(leaderboardList, sorted, null);
        })
        .catch(() => {
          if (requestId !== globalRequestId) return;
          renderLeaderboardMessage(leaderboardList, "Global leaderboard unavailable.");
        });
    };
    const renderLeaderboard = () => {
      if (leaderboardMode === "global") {
        renderGlobal();
      } else {
        renderLocal();
      }
      setToggleActive(localBtn, leaderboardMode === "local");
      setToggleActive(globalBtn, leaderboardMode === "global");
    };

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
      if (shouldShow) renderLeaderboard();
    });

    localBtn.addEventListener("click", () => {
      leaderboardMode = "local";
      renderLeaderboard();
    });
    globalBtn.addEventListener("click", () => {
      leaderboardMode = "global";
      renderLeaderboard();
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
    const existingOverlay = host.querySelector("#defense-protocol-pause-overlay");
    if (existingOverlay) existingOverlay.remove();
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
    const controls = document.getElementById("controls");
    if (!controls) return;
    controls.classList.remove("controls-emphasis");
    void controls.offsetWidth;
    controls.classList.add("controls-emphasis");
    if (this.controlsEmphasisTimer) window.clearTimeout(this.controlsEmphasisTimer);
    this.controlsEmphasisTimer = window.setTimeout(() => {
      controls.classList.remove("controls-emphasis");
    }, 1600);
  }

  triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
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
    updateLeaderboard(this.lastLeaderboardEntry, this.difficultyKey);
    submitGlobalScore(this.lastLeaderboardEntry);
    this.showGameOverScreen();
  }

  computeWaveConfig(wave) {
    return Waves.computeWaveConfig.call(this, wave);
  }

  setHelpOverlay(show) {
    this.showHelp = !!show;
    writeStorage(HELP_OVERLAY_STORAGE_KEY, this.showHelp ? "true" : "false");

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
    });

    this.updateWaveSpawning(time);

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
        for (let i = 0; i < wavesCleared; i += 1) {
          const waveNum = this.blockWaveStart + i;
          const clearBonus = 6 + Math.floor(waveNum * 1.5);
          this.money += clearBonus;
          this.score += clearBonus;
        }
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
    const gridRight = gx + gw - 1;
    this.g.lineStyle(1, 0x142033, 1);
    for (let x = 0; x < gw; x += GRID) this.g.lineBetween(gx + x + 0.5, TOP_UI, gx + x + 0.5, h);
    this.g.lineStyle(2, 0x142033, 1);
    this.g.lineBetween(gridRight + 0.5, TOP_UI, gridRight + 0.5, h);
    this.g.lineStyle(1, 0x142033, 1);
    for (let y = TOP_UI; y <= h; y += GRID) this.g.lineBetween(gx, y + 0.5, gridRight, y + 0.5);
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
      targetMode: def.defaultTargetMode ?? "first",
      sprite: img,
      badge,
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
    return Enemies.spawnEnemyOfType.call(this, typeKey, opts);
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
      tower.beam.lineStyle(2, 0xff9cf2, 0.55);
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

    const ramp = 1 + Math.min(tower.lockMs / 2000, 1.5);
    const falloff = 0.7;

    for (let i = 0; i < hits.length && i < LASER_MAX_PIERCE; i += 1) {
      const enemy = hits[i].enemy;
      if (!enemy || !enemy.active) continue;
      const base = tower.damage * ramp * Math.pow(falloff, i);
      const armor = enemy.armor || 0;
      const dmg = Math.max(1, Math.floor(base) - armor);
      enemy.hp -= dmg;
      if (enemy.hp <= 0) this.handleEnemyKilled(enemy);
    }
  }

  handleEnemyKilled(enemy) {
    const reward = enemy.reward ?? 8;
    const weight = enemy.scoreWeight ?? 1;
    if (enemy.flashTween) {
      enemy.flashTween.remove(false);
      enemy.flashTween = null;
    }
    enemy.destroy();
    this.money += reward;
    this.killCount += 1;
    const baseScoreGain = reward + Math.round(weight * 10);
    const scoreMul = this.difficulty?.scoreMul ?? 1;
    const scoreGain = Math.round(baseScoreGain * scoreMul);
    this.score += scoreGain;
  }

  fireBullet(t, target) {
    Bullets.fireBullet.call(this, t, target);
  }
}

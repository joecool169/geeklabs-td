import Phaser from "phaser";

const GRID = 40;
const TOP_UI = 120;

function snapX(v) {
  return Math.floor(v / GRID) * GRID + GRID / 2;
}

function snapY(v) {
  const vy = v - TOP_UI;
  return Math.floor(vy / GRID) * GRID + GRID / 2 + TOP_UI;
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function round1(v) {
  return Math.round(v * 10) / 10;
}

function segCircleHit(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const fx = x1 - cx;
  const fy = y1 - cy;
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - r * r;
  let disc = b * b - 4 * a * c;
  if (disc < 0) return false;
  disc = Math.sqrt(disc);
  const t1 = (-b - disc) / (2 * a);
  const t2 = (-b + disc) / (2 * a);
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}

const TOWER_DEFS = {
  basic: {
    key: "basic",
    name: "Basic",
    hotkey: "1",
    tiers: [
      { cost: 50, damage: 10, range: 95, fireMs: 260, tint: 0x3bd3ff, scale: 1.0 },
      { cost: 75, damage: 16, range: 110, fireMs: 210, tint: 0x7cf0ff, scale: 1.0 },
      { cost: 120, damage: 24, range: 130, fireMs: 170, tint: 0xb9f5ff, scale: 1.15 },
    ],
  },
  rapid: {
    key: "rapid",
    name: "Rapid",
    hotkey: "2",
    tiers: [
      { cost: 65, damage: 6, range: 85, fireMs: 140, tint: 0x39ff8f, scale: 0.95 },
      { cost: 90, damage: 8, range: 95, fireMs: 115, tint: 0x7fffc2, scale: 1.0 },
      { cost: 140, damage: 10, range: 105, fireMs: 95, tint: 0xc7ffe5, scale: 1.05 },
    ],
  },
  sniper: {
    key: "sniper",
    name: "Sniper",
    hotkey: "3",
    tiers: [
      { cost: 90, damage: 28, range: 165, fireMs: 520, tint: 0xffc857, scale: 1.05 },
      { cost: 140, damage: 42, range: 185, fireMs: 470, tint: 0xffda85, scale: 1.1 },
      { cost: 210, damage: 64, range: 205, fireMs: 420, tint: 0xffedc0, scale: 1.15 },
    ],
  },
};

const TARGET_MODES = ["close", "strong", "first"];

function nextInCycle(arr, v) {
  const i = arr.indexOf(v);
  return arr[(i + 1 + arr.length) % arr.length];
}

const ENEMY_DEFS = {
  runner: {
    key: "runner",
    name: "Runner",
    tint: 0xff4d6d,
    baseHp: 18,
    baseSpeed: 145,
    reward: 6,
    armor: 0,
    scaleHpPerWave: 0.1,
    scaleSpeedPerWave: 0.02,
    scoreWeight: 0.7,
  },
  brute: {
    key: "brute",
    name: "Brute",
    tint: 0xb54dff,
    baseHp: 70,
    baseSpeed: 60,
    reward: 12,
    armor: 0,
    scaleHpPerWave: 0.14,
    scaleSpeedPerWave: 0.01,
    scoreWeight: 1.5,
  },
  armored: {
    key: "armored",
    name: "Armored",
    tint: 0x8fb3c9,
    baseHp: 40,
    baseSpeed: 85,
    reward: 10,
    armor: 4,
    scaleHpPerWave: 0.12,
    scaleSpeedPerWave: 0.015,
    scoreWeight: 1.8,
  },
};

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function pickWeighted(rng01, entries) {
  const total = entries.reduce((s, e) => s + e.w, 0);
  if (total <= 0) return entries[0]?.key;
  let t = rng01 * total;
  for (const e of entries) {
    t -= e.w;
    if (t <= 0) return e.key;
  }
  return entries[entries.length - 1]?.key;
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.money = 120;
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
   
    this.waveHint = this.add.text(14, 114, "", {
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
    };

    this.togglePause = () => this.setPaused(!this.isPaused);

    this.ghost = null;
    this.isPlacing = false;
    this.placeType = "basic";
    this.ghostValid = false;
    this.ghostX = 0;
    this.ghostY = 0;

    this.keyT.on("down", () => {
      if (this.isPaused) return;
      this.togglePlacement();
    });

    this.keyU.on("down", () => {
      if (this.isPaused) return;
      if (this.selectedTower && this.towers.includes(this.selectedTower)) this.tryUpgradeTower(this.selectedTower);
    });

    this.keyX.on("down", () => {
      if (this.isPaused) return;
      if (this.selectedTower && this.towers.includes(this.selectedTower)) this.trySellTower(this.selectedTower);
    });

    this.keyF.on("down", () => {
      if (this.isPaused) return;
      if (this.selectedTower && this.towers.includes(this.selectedTower)) this.cycleTargetMode(this.selectedTower);
    });

    this.key1.on("down", () => {
      if (this.isPaused) return;
      this.setPlaceType("basic");
    });

    this.key2.on("down", () => {
      if (this.isPaused) return;
      this.setPlaceType("rapid");
    });

    this.key3.on("down", () => {
      if (this.isPaused) return;
      this.setPlaceType("sniper");
    });

    this.keyP.on("down", () => this.togglePause());

    this.keyEsc.on("down", () => {
      if (this.isPaused) {
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
      if (this.isPaused) return;
      if (this.waveState === "intermission") {
        this.nextWaveAvailableAt = Math.min(this.nextWaveAvailableAt, this.time.now);
        this.tryStartWave();
      }
    });

    this.input.on("pointerdown", (p) => {
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
      if (this.isPaused) return;
      if (!this.isPlacing) return;
      this.updateGhost(p.worldX, p.worldY);
    });

    this.buildInspector();
    this.updateUI();
    this.enterIntermission(true);
  }

  showToast(msg, ms = 2400) {
    this.toast.setText(msg);
    this.toast.setVisible(true);
    if (this.toastTimer) this.toastTimer.remove(false);
    this.toastTimer = this.time.delayedCall(ms, () => {
      this.toast.setVisible(false);
    });
  }

  computeWaveConfig(wave) {
    const w = Math.max(1, wave);
    const total = Math.floor(10 + w * 3 + Math.min(18, w * 1.5));
    const spawnDelayMs = Math.max(260, 650 - w * 18);
    const bruteW = clamp01((w - 10) / 10) * 0.9;
    const armoredW = clamp01((w - 20) / 10) * 0.8;
    const weights = [{ key: "runner", w: 1.6 }];
    if (w >= 10) weights.push({ key: "brute", w: 0.6 + bruteW });
    if (w >= 20) weights.push({ key: "armored", w: 0.15 + armoredW });
    const packEvery = Math.max(9, 14 - Math.floor(w / 2));
    const packSize = Math.min(7, 3 + Math.floor(w / 3));
    return {
      total,
      spawnDelayMs,
      weights,
      packEvery,
      packSize,
      intermissionMs: this.intermissionMs,
    };
  }

  enterIntermission(isInitial = false) {
    this.waveState = "intermission";
    this.waveEnemiesTotal = 0;
    this.waveEnemiesSpawned = 0;
    this.waveNextSpawnAt = 0;
    this.swarmPacksRemaining = 0;
    this.swarmNextPackSpawnAt = 0;

    if (this.autoStartTimer) {
      this.autoStartTimer.remove(false);
      this.autoStartTimer = null;
    }

    if (isInitial && !this.didStartFirstWave) {
      this.nextWaveAvailableAt = this.time.now;
      return;
    }

    this.nextWaveAvailableAt = this.time.now + this.intermissionMs;

    if (this.autoStartWaves) {
      this.autoStartTimer = this.time.delayedCall(this.intermissionMs, () => {
        if (this.isPaused) return;
        if (this.waveState !== "intermission") return;
        this.startWave(this.wave);
      });
    }
  }

  tryStartWave() {
    if (this.waveState !== "intermission") return;
    if (this.time.now < this.nextWaveAvailableAt) return;
    this.startWave(this.wave);
    if (!this.didStartFirstWave) this.didStartFirstWave = true;
  }

  startWave(wave) {
    const cfg = this.computeWaveConfig(wave);
    this.waveState = "running";
    this.waveEnemiesTotal = cfg.total;
    this.waveEnemiesSpawned = 0;
    this.waveSpawnDelayMs = cfg.spawnDelayMs;
    this.waveNextSpawnAt = this.time.now + 250;
    this.waveCfg = cfg;
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
      if (this.isPaused) return;
      if (this.selectedTower && this.towers.includes(this.selectedTower)) this.tryUpgradeTower(this.selectedTower);
    });

    this.sellBtn = this.makeButton(this.inspectorX + 12 + btnW + gap, btnY, btnW, btnH, "Sell (X)", () => {
      if (this.isPaused) return;
      if (this.selectedTower && this.towers.includes(this.selectedTower)) this.trySellTower(this.selectedTower);
    });

    this.targetBtn = this.makeButton(this.inspectorX + 12 + (btnW + gap) * 2, btnY, btnW, btnH, "Target (F)", () => {
      if (this.isPaused) return;
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
    if (this.isPaused) return;

    for (const t of this.towers) {
      if (time < t.nextShotAt) continue;
      const target = this.findTarget(t, t.targetMode);
      if (!target) continue;
      t.nextShotAt = time + t.fireMs;
      this.fireBullet(t, target);
    }

    this.enemies.children.iterate((e) => {
      if (!e) return;
      this.advanceEnemy(e, dt);
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
        const clearBonus = 10 + Math.floor(this.wave * 2);
        this.money += clearBonus;
        this.score += clearBonus;
        this.wave += 1;
        this.enterIntermission(false);
      }
    }

    this.updateUI();
  }

  updateWaveSpawning(time) {
    if (this.waveState !== "running") return;

    if (this.swarmPacksRemaining > 0 && time >= this.swarmNextPackSpawnAt) {
      this.spawnEnemyOfType("runner", { isSwarm: true });
      this.waveEnemiesSpawned += 1;
      this.swarmPacksRemaining -= 1;
      this.swarmNextPackSpawnAt = time + this.swarmPackSpacingMs;
      return;
    }

    if (this.waveEnemiesSpawned >= this.waveEnemiesTotal) return;
    if (time < this.waveNextSpawnAt) return;

    const cfg = this.waveCfg || this.computeWaveConfig(this.wave);
    const shouldPack = cfg.packEvery > 0 && this.waveEnemiesSpawned > 0 && this.waveEnemiesSpawned % cfg.packEvery === 0;

    if (shouldPack) {
      const toSpawn = Math.min(cfg.packSize, this.waveEnemiesTotal - this.waveEnemiesSpawned);
      this.spawnEnemyOfType("runner", { isSwarm: true });
      this.waveEnemiesSpawned += 1;
      this.swarmPacksRemaining = Math.max(0, toSpawn - 1);
      this.swarmNextPackSpawnAt = time + this.swarmPackSpacingMs;
    } else {
      const r = Math.random();
      const type = pickWeighted(r, cfg.weights) || "runner";
      this.spawnEnemyOfType(type);
      this.waveEnemiesSpawned += 1;
    }

    this.waveNextSpawnAt = time + this.waveSpawnDelayMs;
  }

  getPlaceDef() {
    return TOWER_DEFS[this.placeType] || TOWER_DEFS.basic;
  }

  setPlaceType(type) {
    if (!TOWER_DEFS[type]) return;
    this.placeType = type;
    if (this.isPlacing) this.refreshGhostVisual();
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
      this.ghost = this.add.image(0, 0, "tower");
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
    if (this.textures.exists("tower")) return;
    const g = this.add.graphics();
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, 30, 30);
    g.lineStyle(2, 0x0b0f14, 1);
    g.strokeRect(0, 0, 30, 30);
    g.generateTexture("tower", 30, 30);

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
    const def = TOWER_DEFS[t.type];
    if (!def) return null;
    if (t.tier >= def.tiers.length) return null;
    return def.tiers[t.tier]?.cost ?? null;
  }

  applyTowerTier(t, tierIdx) {
    const def = TOWER_DEFS[t.type];
    const tier = def.tiers[tierIdx];
    t.tier = tierIdx + 1;
    t.damage = tier.damage;
    t.range = tier.range;
    t.fireMs = tier.fireMs;
    t.sprite.setTint(tier.tint);
    t.sprite.setScale(tier.scale ?? 1);
    if (t.badge) t.badge.setDepth(t.sprite.depth + 1);
  }

  tryUpgradeTower(t) {
    const nextCost = this.getNextUpgradeCost(t);
    if (nextCost === null) return;
    if (this.money < nextCost) return;
    this.money -= nextCost;
    t.spent += nextCost;
    this.applyTowerTier(t, t.tier);
    if (this.selectedTower === t) this.showRangeRing(t, 0x00ffff);
  }

  tryPlaceTowerAt(x, y) {
    if (!this.canPlaceTowerAt(x, y)) return;
    const def = this.getPlaceDef();
    const tier0 = def.tiers[0];
    this.money -= tier0.cost;
    const img = this.add.image(x, y, "tower");
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
    if (!t) return;
    const idx = this.towers.indexOf(t);
    if (idx === -1) return;
    const refund = Math.floor((t.spent || 0) * 0.7);
    if (t.badge) t.badge.destroy();
    t.sprite.destroy();
    this.towers.splice(idx, 1);
    this.money += refund;
    if (this.selectedTower === t) this.clearSelection();
  }

  cycleTargetMode(t) {
    t.targetMode = nextInCycle(TARGET_MODES, t.targetMode);
  }

  spawnEnemyOfType(typeKey, opts = {}) {
    const def = ENEMY_DEFS[typeKey] || ENEMY_DEFS.runner;
    const start = this.path[0];
    const e = this.physics.add.image(start.x, start.y, "enemy");
    e.setCollideWorldBounds(false);
    e.body.setAllowGravity(false);
    const w = Math.max(1, this.wave);
    const hpMul = 1 + (w - 1) * (def.scaleHpPerWave ?? 0.12);
    const spMul = 1 + (w - 1) * (def.scaleSpeedPerWave ?? 0.02);
    e.typeKey = def.key;
    e.setTint(def.tint);
    e.hp = Math.max(1, Math.floor(def.baseHp * hpMul));
    e.maxHp = e.hp;
    e.speed = Math.floor(def.baseSpeed * spMul);
    e.armor = def.armor || 0;
    e.reward = def.reward || 8;
    e.scoreWeight = def.scoreWeight ?? 1;
    e.pathIndex = 0;
    e.isSwarm = !!opts.isSwarm;
    this.enemies.add(e);
    return e;
  }

  advanceEnemy(e, dt) {
    const i = e.pathIndex;
    if (i >= this.path.length - 1) {
      e.destroy();
      this.lives -= 1;
      if (this.lives <= 0) this.scene.restart();
      return;
    }
    const a = this.path[i];
    const b = this.path[i + 1];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const len = Math.sqrt(vx * vx + vy * vy) || 1;
    const ux = vx / len;
    const uy = vy / len;
    const move = (e.speed * dt) / 1000;
    e.x += ux * move;
    e.y += uy * move;
    if (dist2(e.x, e.y, b.x, b.y) < 14 * 14) {
      e.pathIndex += 1;
      e.x = b.x;
      e.y = b.y;
    }
  }

  enemyProgressScore(e) {
    const i = e.pathIndex;
    const next = this.path[Math.min(i + 1, this.path.length - 1)];
    const d = Math.sqrt(dist2(e.x, e.y, next.x, next.y));
    return i * 100000 - d;
  }

  findTarget(tower, mode) {
    const r2 = tower.range * tower.range;
    let best = null;
    let bestMetric = -Infinity;
    this.enemies.children.iterate((e) => {
      if (!e) return;
      const d = dist2(tower.x, tower.y, e.x, e.y);
      if (d > r2) return;
      if (mode === "close") {
        const m = -d;
        if (m > bestMetric) {
          bestMetric = m;
          best = e;
        }
        return;
      }
      if (mode === "strong") {
        const m = e.hp;
        if (m > bestMetric) {
          bestMetric = m;
          best = e;
        }
        return;
      }
      if (mode === "first") {
        const m = this.enemyProgressScore(e);
        if (m > bestMetric) {
          bestMetric = m;
          best = e;
        }
      }
    });
    return best;
  }

  fireBullet(t, target) {
    const x = t.x;
    const y = t.y;
    const b = this.add.circle(x, y, 6, 0x00ffff, 1);
    b.setDepth(50);
    const spd = 780;
    const hitR = 14;
    const step = (_time, dt) => {
      if (!b.active) return;
      const x0 = b.x;
      const y0 = b.y;
      if (!target.active) {
        b.destroy();
        return;
      }
      const dx = target.x - b.x;
      const dy = target.y - b.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const vx = (dx / len) * spd;
      const vy = (dy / len) * spd;
      b.x += (vx * dt) / 1000;
      b.y += (vy * dt) / 1000;
      if (segCircleHit(x0, y0, b.x, b.y, target.x, target.y, hitR)) {
        const armor = target.armor || 0;
        const dmg = Math.max(1, t.damage - armor);
        target.hp -= dmg;
        if (target.hp <= 0) {
          const reward = target.reward ?? 8;
          const weight = target.scoreWeight ?? 1;
          target.destroy();
          this.money += reward;
          this.killCount += 1;
          const scoreGain = reward + Math.round(weight * 10);
          this.score += scoreGain;
          this.killText.setText(`Kills: ${this.killCount}`);
          this.scoreText.setText(`Score: ${this.score}`);
        }
        b.destroy();
      }
    };
    b.update = step;
    if (!this.bulletsPlain) {
      this.bulletsPlain = [];
      this.events.on("update", (time, dt) => {
        for (const obj of this.bulletsPlain) {
          if (obj.active && obj.update) obj.update(time, dt);
        }
        this.bulletsPlain = this.bulletsPlain.filter((o) => o.active);
      });
    }
    this.bulletsPlain.push(b);
    this.time.delayedCall(900, () => {
      if (b.active) b.destroy();
    });
  }

  updateUI() {
    if (this.waveState === "intermission") {
      const wait = Math.max(0, this.nextWaveAvailableAt - this.time.now);
      const ready = wait <= 0;
      const sec = Math.ceil(wait / 1000);
      this.waveHint.setVisible(true);

      if (!this.didStartFirstWave) {
      this.waveHint.setText(`Wave ${this.wave} ready. Press SPACE to start.`);
    } else if (ready) {
      this.waveHint.setText(
        this.autoStartWaves
          ? `Wave ${this.wave} starting...`
          : `Wave ${this.wave} ready. Press SPACE to start.`
      );
    } else {
      this.waveHint.setText(
        this.autoStartWaves
          ? `Next wave in ${sec}s... (SPACE to start now)`
          : `Wave ${this.wave} ready in ${sec}s... (SPACE to start when ready)`
      );
    }
  } else {
    this.waveHint.setVisible(true);
    this.waveHint.setText(
      `Wave ${this.wave} running: ${this.waveEnemiesSpawned}/${this.waveEnemiesTotal}`
    );
  }

  this.ui.setText(
    `Money: $${this.money}    Lives: ${this.lives}    Towers: ${this.towers.length}    Wave: ${this.wave}`
  );
  this.killText.setText(`Kills: ${this.killCount}`);
  this.scoreText.setText(`Score: ${this.score}`);

  if (!this.selectedTower || !this.towers.includes(this.selectedTower)) {
    this.setInspectorVisible(false);
    this.panel.setText("");
    return;
  }

    this.setInspectorVisible(true);
    this.drawInspectorBg(true);
    const t = this.selectedTower;
    const def = TOWER_DEFS[t.type];
    const sps = 1000 / t.fireMs;
    const dps = t.damage * sps;
    const nextCost = this.getNextUpgradeCost(t);
    const nextText = nextCost === null ? "Max" : `$${nextCost}`;
    const refund = Math.floor((t.spent || 0) * 0.7);
    const targetLabel = t.targetMode === "close" ? "Close" : t.targetMode === "strong" ? "Strong" : "First";
    this.panel.setText(
      `${def.name} Tower (Tier ${t.tier})
Target: ${targetLabel}
Damage: ${t.damage}
Fire: ${t.fireMs}ms (${round1(sps)}/s)
Range: ${t.range}
DPS: ${round1(dps)}
Upgrade: ${nextText}
Sell: $${refund}`
    );
    const canUpgrade = nextCost !== null && this.money >= nextCost;
    this.upgradeBtn.hit.enabled = !!canUpgrade;
    this.upgradeBtn.draw(!!canUpgrade, false, false);
    this.sellBtn.hit.enabled = true;
    this.sellBtn.draw(true, false, false);
    this.targetBtn.hit.enabled = true;
    this.targetBtn.draw(true, false, false);
  }
}

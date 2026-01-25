import Phaser from "phaser";
import { GRID, TOP_UI } from "./game/config.js";
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
    showToastFn.call(this, msg, ms);
  }

  updateUI() {
    updateUIFn.call(this);
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

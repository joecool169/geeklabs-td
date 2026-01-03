import Phaser from "phaser";

const GRID = 40;

function snap(v) {
  return Math.floor(v / GRID) * GRID + GRID / 2;
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");
  }

  create() {
    this.money = 120;
    this.lives = 20;
    this.wave = 1;

    this.path = [
      { x: 80, y: 120 },
      { x: 980, y: 120 },
      { x: 980, y: 520 },
      { x: 140, y: 520 },
      { x: 140, y: 320 },
      { x: 860, y: 320 },
    ];

    this.makeTextures();

    this.g = this.add.graphics();
    this.drawGrid();
    this.drawPath();

    this.towers = [];
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();

    this.ui = this.add.text(14, 12, "", {
      fontFamily: "monospace",
      fontSize: "16px",
      color: "#dbe7ff",
    });

    this.help = this.add.text(
      14,
      34,
      "Left click: place tower ($50)   Right click: sell tower (+$35)",
      { fontFamily: "monospace", fontSize: "13px", color: "#9fb3d8" }
    );

    this.input.mouse?.disableContextMenu();

    this.input.on("pointerdown", (p) => {
      if (p.rightButtonDown()) {
        this.trySellTower(p.worldX, p.worldY);
        return;
      }
      this.tryPlaceTower(p.worldX, p.worldY);
    });

    this.physics.add.overlap(this.bullets, this.enemies, (b, e) => {
      b.destroy();
      e.hp -= 10;
      if (e.hp <= 0) {
        e.destroy();
        this.money += 8;
      }
    });

    this.spawnTimer = this.time.addEvent({
      delay: 650,
      loop: true,
      callback: () => this.spawnEnemy(),
    });

    this.updateUI();
  }

  update(time, dt) {
    for (const t of this.towers) {
      if (time < t.nextShotAt) continue;
      const target = this.findTarget(t.x, t.y, t.range);
      if (!target) continue;
      t.nextShotAt = time + t.fireMs;
      this.fireBullet(t.x, t.y, target);
    }

    this.enemies.children.iterate((e) => {
      if (!e) return;
      this.advanceEnemy(e, dt);
    });

    this.updateUI();
  }

  makeTextures() {
    if (this.textures.exists("tower")) return;

    const g = this.add.graphics();

    g.clear();
    g.fillStyle(0x3bd3ff, 1);
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
    this.g.lineStyle(1, 0x142033, 1);
    for (let x = 0; x <= w; x += GRID) this.g.lineBetween(x, 0, x, h);
    for (let y = 0; y <= h; y += GRID) this.g.lineBetween(0, y, w, y);
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

  tryPlaceTower(wx, wy) {
    const x = snap(wx);
    const y = snap(wy);
    if (this.money < 50) return;
    if (
      x < GRID / 2 ||
      y < GRID / 2 ||
      x > this.scale.width - GRID / 2 ||
      y > this.scale.height - GRID / 2
    )
      return;
    if (this.isOnPath(x, y)) return;
    for (const t of this.towers) {
      if (t.x === x && t.y === y) return;
    }

    this.money -= 50;

    const img = this.add.image(x, y, "tower");

    this.towers.push({
      x,
      y,
      range: 190,
      fireMs: 260,
      nextShotAt: 0,
      sprite: img,
    });
  }

  trySellTower(wx, wy) {
    const x = snap(wx);
    const y = snap(wy);
    const idx = this.towers.findIndex((t) => t.x === x && t.y === y);
    if (idx === -1) return;
    const t = this.towers[idx];
    t.sprite.destroy();
    this.towers.splice(idx, 1);
    this.money += 35;
  }

  spawnEnemy() {
    const start = this.path[0];

    const e = this.physics.add.image(start.x, start.y, "enemy");
    e.setCollideWorldBounds(false);
    e.body.setAllowGravity(false);

    e.hp = 30 + Math.floor((this.wave - 1) * 5);
    e.speed = 90 + Math.min(70, (this.wave - 1) * 6);
    e.pathIndex = 0;

    this.enemies.add(e);

    if (this.time.now > this.wave * 18000) this.wave += 1;
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

  findTarget(x, y, range) {
    const r2 = range * range;
    let best = null;
    let bestD = Infinity;

    this.enemies.children.iterate((e) => {
      if (!e) return;
      const d = dist2(x, y, e.x, e.y);
      if (d <= r2 && d < bestD) {
        bestD = d;
        best = e;
      }
    });

    return best;
  }

fireBullet(x, y, target) {
  const b = this.add.circle(x, y, 6, 0x00ffff, 1);
  b.setDepth(50);

  const spd = 780;
  const dx = target.x - x;
  const dy = target.y - y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  const vx = (dx / len) * spd;
  const vy = (dy / len) * spd;

  const step = (t, dt) => {
    if (!b.active) return;

    b.x += (vx * dt) / 1000;
    b.y += (vy * dt) / 1000;

    if (!target.active) {
      b.destroy();
      return;
    }

    const dd = (b.x - target.x) * (b.x - target.x) + (b.y - target.y) * (b.y - target.y);
    if (dd < 14 * 14) {
      target.hp -= 10;
      if (target.hp <= 0) {
        target.destroy();
        this.money += 8;
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
    this.ui.setText(
      `Money: $${this.money}    Lives: ${this.lives}    Towers: ${this.towers.length}    Wave: ${this.wave}`
    );
  }
}

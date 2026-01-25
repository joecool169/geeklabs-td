import { GRID, TOP_UI } from "./config.js";

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

export { snapX, snapY, dist2, round1, segCircleHit };

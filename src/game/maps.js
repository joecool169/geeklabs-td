import { GRID, TOP_UI } from "./config.js";

const DEFAULT_MAP_KEY = "classic";
const MAPS = Object.freeze({
  classic: Object.freeze({
    key: "classic", label: "Defense Grid",
    description: "The original route. Hold the inner turn.",
    path: Object.freeze([
      [-120, 120], [980, 120], [980, 520], [140, 520], [140, 320], [860, 320],
    ].map(([x, y]) => Object.freeze({ x, y: y + TOP_UI - GRID / 2 }))),
  }),
  "relay-yard": Object.freeze({
    key: "relay-yard", label: "Relay Yard",
    description: "A broad S through a power yard. Build between passes.",
    path: Object.freeze([
      [-120, 120], [980, 120], [980, 320], [60, 320], [60, 520], [900, 520],
    ].map(([x, y]) => Object.freeze({ x, y: y + TOP_UI - GRID / 2 }))),
  }),
});

function normalizeMapKey(key) {
  return Object.hasOwn(MAPS, key) ? key : DEFAULT_MAP_KEY;
}
function getMap(key) { return MAPS[normalizeMapKey(key)]; }
function createMapPath(key) { return getMap(key).path.map(point => ({ ...point })); }

export { DEFAULT_MAP_KEY, MAPS, normalizeMapKey, getMap, createMapPath };

import { DIFFICULTY_CONFIG } from "../game/config.js";
import {
  compareLeaderboardEntries,
  fetchGlobalLeaderboard,
  readLocalLeaderboard,
} from "../services/leaderboard.js";

const BRAND_LOGO_URL = "/brand/defense-protocol.png";
const CONTROLS = Object.freeze([
  ["T", "Toggle placement mode"],
  ["Click", "Place tower"],
  ["1 / 2 / 3 / 4", "Select tower"],
  ["Space", "Start wave"],
  ["U", "Upgrade (selected tower)"],
  ["X", "Sell (selected tower)"],
  ["F", "Target mode (selected tower)"],
  ["P", "Pause"],
]);

const element = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function makeBrandHeader(large = false) {
  const header = element(
    "div",
    `game-overlay-brand${large ? " is-large" : ""}`
  );
  const logo = element("img");
  logo.src = BRAND_LOGO_URL;
  logo.alt = "Defense Protocol logo";
  header.append(
    logo,
    element("div", "game-overlay-brand-title", "Defense Protocol"),
    element(
      "div",
      "game-overlay-brand-tagline",
      "Protocol engaged. Hold the line."
    )
  );
  return header;
}

const makeButton = (label, tone = "neutral") => {
  const button = element("button", `game-overlay-button is-${tone}`, label);
  button.type = "button";
  return button;
};

function renderLeaderboardEntries(container, entries, currentEntry) {
  container.replaceChildren();
  if (!entries.length) {
    container.append(element("div", "game-overlay-muted", "No entries yet."));
    return;
  }

  const header = element("div", "leaderboard-row leaderboard-header");
  ["#", "Name", "Score", "Wave", "Kills", "Difficulty"].forEach((label) =>
    header.append(element("div", null, label))
  );
  container.append(header);

  const isCurrentRun = (entry) =>
    currentEntry &&
    entry.dateISO === currentEntry.dateISO &&
    Number(entry.score) === Number(currentEntry.score) &&
    Number(entry.wave) === Number(currentEntry.wave) &&
    Number(entry.kills) === Number(currentEntry.kills) &&
    entry.name === currentEntry.name;

  entries.forEach((entry, index) => {
    const row = element(
      "div",
      `leaderboard-row${isCurrentRun(entry) ? " is-current" : ""}`
    );
    const values = [
      index + 1,
      entry.name || "Player",
      Number(entry.score) || 0,
      Number(entry.wave) || 0,
      Number(entry.kills) || 0,
      entry.difficultyLabel || entry.difficultyKey || "-",
    ];
    values.forEach((value) => row.append(element("div", null, value)));
    container.append(row);
  });
}

function makeLeaderboardPanel(storage, difficultyKey, currentEntry = null) {
  const panel = element("div", "game-overlay-subpanel");
  panel.hidden = true;
  const header = element("div", "game-overlay-subpanel-header");
  header.append(element("div", "game-overlay-subpanel-title", "Top 10"));
  const toggles = element("div", "game-overlay-toggles");
  const localButton = makeButton("Local", "toggle");
  const globalButton = makeButton("Global", "toggle");
  toggles.append(localButton, globalButton);
  header.append(toggles);
  const list = element("div", "leaderboard-list");
  panel.append(header, list);

  let mode = "local";
  let requestId = 0;
  const render = () => {
    localButton.classList.toggle("is-active", mode === "local");
    globalButton.classList.toggle("is-active", mode === "global");
    if (mode === "local") {
      const entries = readLocalLeaderboard(storage, difficultyKey).sort(
        compareLeaderboardEntries
      );
      renderLeaderboardEntries(list, entries, currentEntry);
      return;
    }
    const currentRequest = (requestId += 1);
    list.replaceChildren(
      element("div", "game-overlay-muted", "Loading...")
    );
    fetchGlobalLeaderboard(difficultyKey, 10)
      .then((entries) => {
        if (currentRequest !== requestId) return;
        renderLeaderboardEntries(
          list,
          entries.slice().sort(compareLeaderboardEntries),
          null
        );
      })
      .catch(() => {
        if (currentRequest !== requestId) return;
        list.replaceChildren(
          element(
            "div",
            "game-overlay-muted",
            "Global leaderboard unavailable."
          )
        );
      });
  };

  localButton.addEventListener("click", () => {
    mode = "local";
    render();
  });
  globalButton.addEventListener("click", () => {
    mode = "global";
    render();
  });

  return {
    element: panel,
    toggle() {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) render();
      return !panel.hidden;
    },
    hide() {
      panel.hidden = true;
    },
  };
}

function makeControlsPanel() {
  const panel = element("div", "game-overlay-subpanel controls-list");
  panel.hidden = true;
  CONTROLS.forEach(([key, action]) => {
    const row = element("div", "game-overlay-control-row");
    row.append(
      element("span", "game-overlay-control-key", key),
      element("span", null, action)
    );
    panel.append(row);
  });
  return panel;
}

class OverlayManager {
  constructor({ host, storage }) {
    this.host = host;
    this.storage = storage;
    this.active = new Map();
    if (this.host) this.host.style.position ||= "relative";
    this.destroy();
  }

  mount(id, tone, panelClass = "") {
    this.remove(id);
    const overlay = element("div", `game-overlay is-${tone}`);
    overlay.id = id;
    const panel = element("div", `game-overlay-panel ${panelClass}`.trim());
    overlay.append(panel);
    this.host?.append(overlay);
    this.active.set(id, overlay);
    return { overlay, panel };
  }

  remove(id) {
    this.host?.querySelector(`#${id}`)?.remove();
    this.active.delete(id);
  }

  destroy() {
    [
      "defense-protocol-start-overlay",
      "defense-protocol-pause-overlay",
      "defense-protocol-gameover-overlay",
    ].forEach((id) => this.remove(id));
  }

  showStart({
    playerName,
    difficultyKey,
    soundEnabled = true,
    onToggleSound = () => soundEnabled,
    onStart,
  }) {
    if (!this.host) return false;
    const { overlay, panel } = this.mount(
      "defense-protocol-start-overlay",
      "start",
      "is-start"
    );
    const nameLabel = element("label", "game-overlay-label", "Player name");
    const nameInput = element("input", "game-overlay-input");
    nameInput.type = "text";
    nameInput.value = playerName;
    nameInput.placeholder = "Player";
    nameLabel.append(nameInput);

    const difficultyLabel = element(
      "div",
      "game-overlay-label",
      "Difficulty"
    );
    const difficultyOptions = element("div", "difficulty-options");
    let selectedDifficulty = difficultyKey;
    Object.entries(DIFFICULTY_CONFIG).forEach(([key, config]) => {
      const option = element("label", "difficulty-option");
      const radio = element("input");
      radio.type = "radio";
      radio.name = "difficulty";
      radio.value = key;
      radio.checked = key === selectedDifficulty;
      radio.addEventListener("change", () => {
        if (!radio.checked) return;
        selectedDifficulty = key;
        difficultyOptions
          .querySelectorAll(".difficulty-option")
          .forEach((node) =>
            node.classList.toggle(
              "is-active",
              node.querySelector("input")?.checked
            )
          );
      });
      option.classList.toggle("is-active", radio.checked);
      option.append(radio, element("span", null, config.label));
      difficultyOptions.append(option);
    });

    const startButton = makeButton("Start", "primary");
    const soundButton = makeButton("", "neutral");
    let isSoundEnabled = soundEnabled !== false;
    const renderSoundButton = () => {
      soundButton.textContent = `Sound: ${isSoundEnabled ? "On" : "Off"}`;
      soundButton.setAttribute("aria-pressed", String(isSoundEnabled));
    };
    renderSoundButton();
    soundButton.addEventListener("click", () => {
      isSoundEnabled = onToggleSound() !== false;
      renderSoundButton();
    });
    const start = () =>
      onStart({
        playerName: nameInput.value,
        difficultyKey: selectedDifficulty,
      });
    startButton.addEventListener("click", start);
    nameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") start();
    });
    panel.append(
      makeBrandHeader(true),
      nameLabel,
      difficultyLabel,
      difficultyOptions,
      startButton,
      soundButton
    );
    if (!document.documentElement.classList.contains("touch-ui")) {
      nameInput.focus();
    }
    return overlay;
  }

  showGameOver({ result, currentEntry, onRestart, onChange }) {
    if (!this.host) return false;
    const { overlay, panel } = this.mount(
      "defense-protocol-gameover-overlay",
      "gameover"
    );
    const title = element("div", "game-overlay-title is-danger", "GAME OVER");
    const detail = element(
      "div",
      "game-overlay-detail is-danger",
      "DEFENSE LINE BREACHED"
    );
    const stats = element("div", "game-overlay-stats");
    [
      ["Player", result.playerName],
      ["Difficulty", result.difficultyLabel],
      ["Wave", result.wave],
      ["Total Kills", result.kills],
      ["Final Score", result.score],
    ].forEach(([label, value]) =>
      stats.append(element("div", null, `${label}: ${value}`))
    );

    const buttons = element("div", "game-overlay-actions");
    const restart = makeButton("Restart", "primary");
    const change = makeButton("Change name / difficulty", "neutral");
    const leaderboard = makeButton("Leaderboard", "gold");
    const leaderboardPanel = makeLeaderboardPanel(
      this.storage,
      result.difficultyKey,
      currentEntry
    );
    restart.addEventListener("click", () => {
      overlay.remove();
      onRestart();
    });
    change.addEventListener("click", () => {
      overlay.remove();
      onChange();
    });
    leaderboard.addEventListener("click", () => leaderboardPanel.toggle());
    buttons.append(restart, change, leaderboard);
    panel.append(
      makeBrandHeader(),
      title,
      detail,
      stats,
      buttons,
      leaderboardPanel.element
    );
    return overlay;
  }

  showPause({
    difficultyKey,
    soundEnabled = true,
    onToggleSound = () => soundEnabled,
    onResume,
    onRestart,
    onChange,
  }) {
    if (!this.host) return false;
    const { panel } = this.mount(
      "defense-protocol-pause-overlay",
      "pause"
    );
    const title = element("div", "game-overlay-title", "PAUSED");
    const detail = element(
      "div",
      "game-overlay-detail",
      "P / ESC TO RESUME"
    );
    const buttons = element("div", "game-overlay-actions");
    const resume = makeButton("Resume", "primary");
    const controls = makeButton("Controls", "neutral");
    const leaderboard = makeButton("Leaderboard", "gold");
    const restart = makeButton("Restart", "primary");
    const change = makeButton("Change name / difficulty", "neutral");
    const sound = makeButton("", "neutral");
    let isSoundEnabled = soundEnabled !== false;
    const renderSoundButton = () => {
      sound.textContent = `Sound: ${isSoundEnabled ? "On" : "Off"}`;
      sound.setAttribute("aria-pressed", String(isSoundEnabled));
    };
    renderSoundButton();
    sound.addEventListener("click", () => {
      isSoundEnabled = onToggleSound() !== false;
      renderSoundButton();
    });
    const controlsPanel = makeControlsPanel();
    const leaderboardPanel = makeLeaderboardPanel(
      this.storage,
      difficultyKey
    );

    resume.addEventListener("click", onResume);
    controls.addEventListener("click", () => {
      controlsPanel.hidden = !controlsPanel.hidden;
      if (!controlsPanel.hidden) leaderboardPanel.hide();
    });
    leaderboard.addEventListener("click", () => {
      const visible = leaderboardPanel.toggle();
      if (visible) controlsPanel.hidden = true;
    });
    restart.addEventListener("click", onRestart);
    change.addEventListener("click", onChange);
    buttons.append(resume, sound, controls, leaderboard, restart, change);
    panel.append(
      makeBrandHeader(),
      title,
      detail,
      buttons,
      controlsPanel,
      leaderboardPanel.element
    );
    return true;
  }

  hidePause() {
    this.remove("defense-protocol-pause-overlay");
  }
}

export { OverlayManager };

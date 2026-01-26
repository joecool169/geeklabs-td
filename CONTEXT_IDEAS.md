# GeekLabs‑TD – Gameplay Roadmap (Options & Ideas)

> **Status:** Exploratory / Non‑binding
>
> This document captures _possible_ design directions and systems for GeekLabs‑TD.
> Nothing here is a commitment. These are options to consider, mix, defer, or discard.
>
> The purpose of this file is to preserve design thinking so it can be reused as **AI context** without assuming implementation intent.

---

## Background Problem Statement

Current gameplay reaches a saturation point between approximately **Wave 50–100** where:

- The grid becomes fully populated
- Towers are fully upgraded
- Money ceases to present meaningful choices
- Optimal play trends toward passive observation rather than active decision‑making

This is a known late‑game issue in tower defense design. Solving it requires **new decision pressure**, not just higher enemy stats.

---

## Design Goals

Any future system should aim to:

- Preserve the _mechanics‑first_ philosophy
- Increase late‑game engagement without excessive micromanagement
- Introduce tradeoffs rather than raw power creep
- Remain readable and testable with minimal visual complexity

---

## Category 1: Late‑Game Pressure Systems

These systems add ongoing decision‑making even when the map is saturated.

### Option A — Soft Tower Decay / Maintenance

**Concept:**
Towers gradually lose effectiveness after a certain wave threshold unless maintained.

**Possible Forms:**

- Fire rate degradation
- Range shrink
- Accuracy variance

**Counterplay Options:**

- Manual repair / recalibration action
- Support structures that stabilize nearby towers
- Automatic maintenance cost drain

**Design Notes:**

- Power is not removed; attention is required
- Encourages selling, repositioning, or reinvestment
- Keeps late‑game economy relevant

---

### Option B — Wave Modifiers / Global Conditions

**Concept:**
Waves introduce temporary rule changes that alter optimal strategies.

**Examples:**

- Armor regeneration on enemies
- Reduced effectiveness of specific tower types
- Enemy death effects (split, shield, surge)
- Modified pierce, ramp, or targeting rules

**Design Notes:**

- Modifiers should invalidate _some_ dominant strategies, not all
- Encourages adaptation and experimentation
- Naturally synergizes with achievements and score tracking

---

## Category 2: Player‑Driven Risk / Reward

These systems allow skilled players to opt into danger for advantage.

### Option C — Overclock / Overdrive Systems

**Concept:**
Temporary boosts that introduce long‑term consequences.

**Examples:**

- Overclock a tower for massive DPS at the cost of self‑damage
- Global overdrive that buffs both towers and enemies
- Emergency resource conversion (lives → money or damage)

**Design Notes:**

- Adds timing‑based skill without constant micromanagement
- Creates memorable “clutch” moments
- Requires careful tuning to avoid trivialization

---

### Option D — Voluntary Constraints (“Contracts”)

**Concept:**
Optional challenges offered mid‑run in exchange for bonuses.

**Examples:**

- No selling for N waves
- Restricted tower types
- Increased spawn rate or enemy count

**Design Notes:**

- Entirely optional
- Scales difficulty by player choice
- Excellent for leaderboard differentiation

---

## Category 3: Map Saturation Mitigations

These systems address the problem of full‑grid optimization.

### Option E — Tower Caps by Type

**Concept:**
Limit the number of towers per category.

**Examples:**

- Maximum number of snipers
- Power‑grid limits for laser towers

**Design Notes:**

- Forces composition decisions
- Makes selling meaningful
- Hard caps must be clearly justified to players

---

### Option F — Tower Health + Saboteur Enemies

**Concept:**
Introduce enemies that damage towers while moving along the path.

**Supporting Systems:**

- Tower HP
- Repair or shield structures
- Target‑priority decisions (enemy vs structure protection)

**Design Notes:**

- Converts static defenses into vulnerable assets
- Restores spatial strategy in late game
- Larger system impact than most other options

---

## Category 4: Achievements (Motivational Layer)

Achievements should reward **mastery, creativity, or constraint**, not grind.

### Suggested Achievement Categories

**Skill‑Based**

- Clear early waves without life loss
- High multi‑kill events
- Precision or timing challenges

**Constraint‑Based**

- Win with restricted tower sets
- No selling, no upgrades, or delayed upgrades

**System Discovery**

- Trigger rare modifiers
- Survive special enemy combinations

**Meta Progression**

- Reach specific waves on all difficulties
- Comparative scores across modes

**Design Notes:**

- Achievements should listen to events, not drive gameplay
- Persist via local storage
- Surface primarily at game‑over or summary screens

---

## Possible Sequencing (Non‑Binding)

One potential order that minimizes system thrash:

1. Wave modifiers / conditions
2. Achievement framework (lightweight)
3. Voluntary contracts
4. Overclock or emergency mechanics
5. One structural pressure system (tower decay _or_ saboteurs, not both initially)

---

## Guiding Principle

> If the optimal late‑game strategy is to stop making decisions, the system has failed.

The goal of all options above is to preserve **player agency** deep into a run without overwhelming complexity.

---

## Notes for AI Context Usage

- This document describes **options**, not plans
- No system listed here should be assumed to exist
- References are conceptual, not architectural
- Implementation details are intentionally incomplete

This file is intended to support future design discussions, refactors, or AI‑assisted planning without locking in direction.

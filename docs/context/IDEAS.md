# Defense Protocol — Gameplay Options and Ideas

> **Status:** Exploratory / Non‑binding
>
> This document captures _possible_ design directions and systems for Defense Protocol.
> Nothing here is a commitment. These are options to consider, mix, defer, or discard.
>
> The purpose of this file is to preserve design thinking so it can be reused as **AI context** without assuming implementation intent.

---

## Owner-requested future features — September 20, 2026

The owner wants to add a **rocket turret** and **turret linking** at some point.
These are recorded future directions. Initial linking rules are agreed below;
implementation date, priority, detailed attack behavior, and balance values
remain open. They are not implemented by this entry.

The original product intent was to combine features the owner enjoys in other
tower-defense games. **Onslaught 2** is one of their favorites and a named
inspiration. Ask which interactions they want to capture before assuming how
its mechanics should translate to Defense Protocol. No reference-game behavior
has been verified for this note.

### New map — broad S route selected

The owner selected **Option A: Broad S** from the two schematic route concepts.
The alternative tight five-pass serpentine was not selected.

- One entrance, one exit, and one fixed route with three horizontal passes
  joined by two bends.
- Entry at the upper left; route crosses the upper section, doubles back
  through the middle, and crosses the lower section toward the core.
- Broad building areas between passes leave room for turret groups and
  potential future linking. Outer positions should remain useful too.
- This is an additional map concept, not a replacement for the existing map.
- Use existing towers and waves as the initial comparison baseline; validate
  route length, coverage overlap, buildable space, and difficulty through web
  playtesting before accepting balance. The sketch is not a measured layout.
- Exact dimensions, name, setting/artwork, map selection, and score comparison
  rules remain undecided. The map should not require unimplemented rocket or
  linking features to be playable.

Selection records design direction only; no implementation or deployment has
been authorized by this preference.

### Rocket turret

- Define a distinct tactical role alongside Basic, Rapid, Sniper, and Laser.
- Discuss whether rockets should be single-target, splash damage, homing,
  volleys, or another model; none of these mechanics is selected yet.
- Decide unlock wave, cost, upgrades, targeting, and tradeoffs through design
  and web playtesting. Preserve existing tower roles rather than simply adding
  a stronger replacement.

### Turret linking

Owner-defined general rules (laser-to-laser exception below):

- Participating turrets must be nearby and at their maximum upgrade level.
- Linking is explicitly **player-activated**, not automatic.
- While linked, the **combined attack replaces the participating turrets' normal
  attacks**; they do not continue firing those attacks alongside it.
- Turrets need a **link range** that determines which nearby turrets are
  eligible. Its value and whether it varies by turret type remain undecided;
  do not assume it equals attack range.
- Linking creates combination attacks. The first specified example is
  **Rocket + Laser → rockets with lasers**. The exact projectile/beam behavior
  and which turret fires the combined attack still need definition.

#### Laser-to-laser linking exception

The owner wants nearby laser turrets to combine into a stronger laser attack
once linking is implemented:

- Laser-to-laser linking is **automatic** when eligible turrets are within link
  range. Other combinations remain player-activated.
- Design rationale: the owner intends the amplified attack to be strong enough
  that activating an eligible laser link is always desirable. This is a balance
  goal to validate, not a measured result.

- A supporting laser turret fires into the nearest eligible laser turret
  instead of directly attacking an enemy.
- The receiving laser turret that attacks the enemy becomes substantially
  more powerful while retaining the existing laser attack features.
- The supporting turret redirects its attack; it does not also fire a separate
  normal attack at enemies. The receiving turret delivers the amplified beam.
- Exact amplification and how existing laser properties scale remain undefined.

Clarify whether laser-to-laser linking also exempts turrets from maximum-upgrade
eligibility; lower-tier linking has not been agreed. Link-range values, selection
of the final attacking turret, multi-turret chains, prevention of circular links,
and interaction with player-activated mixed-turret links remain open. This is future design intent, not implemented behavior.

#### Open design questions

- Other eligible combinations, link costs, and maximum links per turret.
- Whether links can be removed or reassigned, and what selling a linked turret does.
- How link range, eligible partners, and active links are shown clearly with
  both mouse and touch controls.

Follow the web-first testing and later native-release workflow. These rules
record future design intent, not approval to implement or deploy the feature.

These owner requests do not adopt the older speculative sequencing below.

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

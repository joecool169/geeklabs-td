# Web-first release strategy

Recorded September 20, 2026. The owner wants features and updates tested on the
web before later App Store releases, with the web game likely always free and
open source. This document recommends the Git procedure for that direction.

## One shared codebase, two release schedules

| Reference | Purpose |
| --- | --- |
| `main` | Reviewed integration branch and source of authorized web deployments |
| `codex/<feature>` | Short-lived development and testing before merge |
| `codex/release-ios-<version>` | Temporary stabilization branch from a web-tested commit |
| `web/v<version>` | Immutable tag identifying a verified deployed web revision |
| `ios/v<version>-build-<number>` | Immutable tag identifying the exact source of an uploaded native build |

The naming patterns above define the workflow. On September 20, 2026,
`codex/release-ios-1.0` was created from `87e4715`, the recorded build-3 source,
and pushed to Forgejo and GitHub before deploying Relay Yard from main.
Keep this branch frozen except for explicitly requested iOS release fixes.
The current App Store upload is unchanged by web deployments.
Keep existing historical tags. Web and App Store version numbers may differ;
record both along with the commit SHA instead of assuming equal versions mean
equal code. Forgejo is authoritative; mirror reviewed branches/tags to GitHub.
Push specific release tags to both remotes; do not move or reuse published tags.

## Normal delivery

1. Develop on a feature branch; run relevant tests and browser checks. Keep
   unfinished experiments on that branch or a local preview until playable.
2. Merge reviewed work into `main`. Deploy to `play.geeklabs.io` only with
   release authorization using the existing main-only deployment workflow.
   Merging or pushing alone does not deploy. This is a public game, so basic
   quality checks still precede web playtesting.
3. Verify the served build and record its source SHA, web tag, and playtest
   results in `CURRENT_STATE.md`. Iterate fixes on web first.
4. When a version is accepted for mobile, create its iOS release branch from
   that exact tested commit, even if `main` has since advanced. Restrict the
   branch to release fixes, native integration, metadata, and version/build
   changes. Do not merge new unrelated `main` features into it.
5. On the Mac, install locked dependencies, build/sync Capacitor, and run native
   validation, physical-device checks, and TestFlight. Commit source and native
   configuration before the final archive; confirm the archive matches those
   committed inputs. Record archive location, version/build, and source SHA.
6. Tag the exact uploaded source revision. Every replacement upload gets a new
   build number and tag; never retag an older upload. Submit/release only with
   authorization. Manual App Store release remains the recorded setting.
7. Port release fixes back to `main` promptly, by a reviewed merge or selective
   cherry-pick when version metadata differs. Document that correspondence.
   Retire the release branch when no longer needed; retain release tags.

An urgent iOS-only fix may start from its shipped tag without pulling in new
web features. Shared gameplay fixes should receive web validation before the
next native release when practical. The existing web deployment script remains
main-only; do not run it from an iOS branch or bypass its checks.

## Compatibility while versions differ

The installed app can remain older than the web game for a long time. Keep the
leaderboard API compatible with supported app versions. Plan API/save migrations
explicitly, preserve local scores/preferences, and test older native clients
before a service change. If balance or scoring changes make scores incomparable,
decide on a score-version/season policy before combining them in one leaderboard.
Separate platform adapters are appropriate; permanent divergent web/iOS gameplay
branches would make fixes and validation harder and are not recommended.

## Monetization: existing direction, decisions still needed

The July 26 decision proposes a free or limited mobile trial with one permanent
full-game unlock, after evidence that players finish sessions, restart, and
return. It discourages subscriptions, energy systems, aggressive consumables,
and balance-distorting purchases initially. No StoreKit purchase integration
was found in the inspected native/platform code or package dependencies. The
September submission records free app pricing; it does not establish a paid plan.

Apple's [non-consumable purchase type](https://developer.apple.com/help/app-store-connect/reference/in-app-purchases-and-subscriptions/in-app-purchase-types)
is a one-time purchase that does not expire, matching the proposed permanent
unlock. This is a candidate implementation, not a selected price or paid scope.

Before implementation, decide:

- Whether to keep the initial edition free, charge upfront for a future edition,
  or offer a free download with a permanent unlock.
- What the paid mobile experience includes and what the trial permits.
- How existing free users retain access; do not silently remove their current
  functionality when introducing payment.
- Price, purchase restoration, offline access, refund/revocation behavior,
  and testing/release requirements for the chosen model.

Keep web access free under the current direction. Put any eventual native
purchase and entitlement handling behind a platform boundary, with the web
adapter granting its intended free experience. Purchase behavior still requires
native sandbox/TestFlight testing; web testing cannot prove StoreKit behavior.
No licensing, store pricing, purchase products, or paid features changed here.

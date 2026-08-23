# Development, Git, and Deployment Workflow

## Source of truth

Git is authoritative for Defense Protocol. Forgejo is the primary remote and GitHub is a secondary mirror. Project context files summarize a committed revision; they never override current source or Git history.

## Starting a development session

```bash
cd /Users/joe/projects/geeklabs-td
git fetch --all --prune
git status --short --branch
git pull --rebase forgejo main
```

Do not pull or rebase across unreviewed local changes.

## Change workflow

1. Inspect current source and context before making project-specific claims.
2. Make one coherent change at a time.
3. Review the diff.
4. Verify the affected behavior.
5. Run validation appropriate to the change.
6. Commit the reviewed revision.
7. Push Forgejo first, then mirror the same commit to GitHub.

```bash
git diff --stat
git diff
npm test
npm run build
git diff --check
git add -A
git commit -m "concise description"
git push forgejo main
git push origin main
```

Documentation-only changes do not require npm validation unless they also modify executable or package files.

## Refactor rules

- One subsystem or concern per change.
- Preserve visible behavior during structural refactors.
- Do not tune balance in the same commit as code movement.
- Record intended invariants before moving code.
- Build after module or import changes.
- Prefer small independently reviewable commits over broad directory rewrites.

## Balance workflow

- Preserve the current coordinated pass as `v0.3.0-balance-checkpoint`.
- Checkpoint telemetry, final snapshots, and seedable wave composition are available for future controlled tuning.
- Compare mixed-specialist and Basic-heavy Hard runs at Waves 10, 15, 20, 25, 30, 35, 40, 45, and 50.
- Record lives, cash, tower composition and tiers, first leak, peak active enemies, and damage/kills/investment by tower type.
- Make one coordinated evidence-based correction.
- Keep balance changes separate from structural refactors.

## Deployment

Production is served from:

```text
joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/
```

The deployment script refuses a dirty working tree, builds the committed revision, rsyncs `dist/`, and performs a checksum dry run afterward:

```bash
npm run deploy
```

Deploy only a reviewed revision that has been pushed to Forgejo and passed the relevant tests, build, live smoke, and documentation review.

To verify parity again without changing production:

```bash
npm run build
rsync -avnc --delete dist/ joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/
```

No file entries means production content matches the local build. Directory-only entries are not content differences. Record the deployed commit in `CURRENT_STATE.md` when deployment occurs.

## Portable exports

Portable ZIPs are optional transport artifacts, not project authority and not a routine completion requirement. See `PORTABLE_EXPORT.md` when repository access is unavailable.

## Completion criteria

- The relevant source and context were inspected.
- Changes are coherent and reviewed.
- Appropriate tests and builds pass.
- The working tree contains no accidental artifacts.
- The revision is committed and pushed to Forgejo.
- GitHub mirrors the same revision when mirror access is available.
- Deployment status is stated explicitly rather than inferred from repository state.

# Development, Git, and Deployment Workflow

## Source of truth

Git is authoritative for Defense Protocol. Forgejo is the primary remote and GitHub is a secondary mirror. Project context files summarize a committed revision; they never override current source or Git history.

## Starting a development session

```bash
cd /path/to/geeklabs-td
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

Production runs on a dedicated VM in the shared GeekLabs Docker stack. Keep the
machine-specific SSH alias and remote paths in the ignored local configuration:

```bash
cp -n scripts/deploy.env.example scripts/deploy.local.env
# Edit scripts/deploy.local.env for this workstation.
```

The required variables are `DEPLOY_HOST`, `REMOTE_REPO`, and `REMOTE_STACK`.
`DEPLOY_BRANCH` and `SOURCE_REMOTE` retain their normal tracked defaults.

The deployment script refuses a dirty working tree or non-`main` branch, runs
the tests and production build on the Mac, pushes the exact commit to Forgejo,
fast-forwards the VM checkout, rebuilds only the game container, refreshes the
gateway, and checks the public game and leaderboard API:

```bash
npm run deploy
```

Deploy only a reviewed revision. The script publishes that revision to Forgejo
as part of the deployment and refuses to continue if the VM cannot match the
same commit exactly.

The deploy script does **not** push GitHub. After a successful deployment,
mirror the reviewed commit explicitly:

```bash
git push origin main
```

To inspect the live deployment without changing it:

```bash
set -a
source scripts/deploy.local.env
set +a
ssh "$DEPLOY_HOST" "git -C '$REMOTE_REPO' status -sb"
ssh "$DEPLOY_HOST" "cd '$REMOTE_STACK' && sudo docker compose ps game gateway"
curl --fail https://play.geeklabs.io/
```

At deploy time, the script verifies that the VM checkout matches the exact local
commit. A later documentation-only commit or manual checkout update can make the
two branch tips differ without changing the running game image, so repository
state alone is not durable proof of the deployed artifact. Record the verified
game revision and any material production change in `CURRENT_STATE.md`.

## Context maintenance

Use the ownership and update triggers in [README.md](README.md). In particular,
refresh `CURRENT_STATE.md` after material releases, deployments, device results,
or operational changes; do not copy its volatile test counts and commit IDs into
stable architecture or workflow documents.

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

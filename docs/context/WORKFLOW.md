# Development Workflow

## Core principle

Git is the source of truth for game code. The context bundle is a portable snapshot for ChatGPT and documentation updates; it is not a replacement for GitHub.

## Starting a session

From the project directory:

```bash
cd ~/projects/geeklabs-td
git fetch --all --prune
git status --short --branch
```

If the tree is clean and the branch is behind its upstream:

```bash
git pull --rebase
```

Do not pull across unreviewed local changes.

## ChatGPT + Codex loop

1. Discuss and define one concrete change in ChatGPT.
2. ChatGPT provides one focused Codex prompt.
3. Codex performs the edit from the repository root.
4. Inspect the result:

```bash
git diff --stat
git diff
```

5. Paste the diff into ChatGPT for review.
6. Verify behavior in the already-running development server.
7. Run the production build:

```bash
npm run build
```

8. Commit one coherent change.
9. Push before switching devices or ending the session.

## Refactor rules

- One subsystem or concern per change.
- Preserve visible behavior during structural refactors.
- Do not tune balance in the same commit as code movement.
- Record intended invariants before moving code.
- Build after every module/import change.
- Prefer another focused Codex prompt for multi-line corrections.
- Use a surgical one-liner only for a truly narrow correction.

## Recommended refactor verification checklist

For each stage, confirm:

- game starts
- name/difficulty screen works
- towers can be selected and placed
- invalid placement remains blocked
- upgrades, selling, and target cycling work
- waves begin and complete
- pause/resume works
- game-over and leaderboards work
- SFX and feedback still fire
- `npm run build` succeeds

## Deployment

Preferred command:

```bash
npm run deploy
```

The current deploy script builds and rsyncs `dist/` to:

```text
joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/
```

Manual equivalent:

```bash
npm run build
rsync -av --delete dist/ joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/
```

Deploy only a reviewed, committed state.

## Verify live deployment

After building, compare the local build against production without changing production:

```bash
rsync -avnc --delete dist/ joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/
```

No file entries means the contents match. Directory-only entries are not content differences.

## Context bundle workflow

Bundle name:

```text
geeklabs-context.zip
```

The bundle should contain:

- tracked source and project metadata
- `AI_CONTEXT.md`
- `docs/context/`
- relevant lightweight public assets

Exclude:

- `.git/`
- `node_modules/`
- `dist/`
- caches, logs, coverage, and editor artifacts

### Applying a newly generated bundle

Only apply a context bundle that was generated from the current verified repository state.

From the MacBook after downloading:

```bash
scp ~/Downloads/geeklabs-context.zip arch-desktop:/tmp/ && ssh arch-desktop 'cd ~/projects/geeklabs-td && unzip -o /tmp/geeklabs-context.zip'
```

Then inspect before committing:

```bash
ssh arch-desktop 'cd ~/projects/geeklabs-td && git status --short && git diff -- AI_CONTEXT.md docs/context'
```

Because this bundle also contains source files for AI inspection, applying a stale bundle could overwrite newer work. Verify the bundle baseline before extraction.

## Generating a fresh source snapshot for ChatGPT

From the MacBook:

```bash
ssh arch-desktop 'cd ~/projects/geeklabs-td && git archive --format=zip --output=/tmp/geeklabs-td-source.zip HEAD' && scp arch-desktop:/tmp/geeklabs-td-source.zip ~/Downloads/
```

Upload that archive to ChatGPT whenever the current code needs to be re-analyzed.

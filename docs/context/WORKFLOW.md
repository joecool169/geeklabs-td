# Development and Context-Bundle Workflow

## Core principle

Git remains the authoritative history for Defense Protocol. The complete project ZIP is the portable handoff used to update the local repository and to provide the next ChatGPT conversation with the exact current source and context.

The ZIP is a complete replacement bundle, not a patch.

## Starting a development session

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

1. Define one concrete change in ChatGPT.
2. Use one focused Codex prompt.
3. Let Codex edit from the repository root.
4. Inspect the result:

```bash
git diff --stat
git diff
```

5. Verify the affected behavior in the running game.
6. Run only the validation appropriate to the change.
7. Commit one coherent change.
8. Push before switching devices or ending the session.

Typical source validation:

```bash
npm test
npm run build
git diff --check
```

Documentation-only changes do not require npm validation unless they also modify executable project files.

## Refactor rules

- One subsystem or concern per change.
- Preserve visible behavior during structural refactors.
- Do not tune balance in the same commit as code movement.
- Record intended invariants before moving code.
- Build after module/import changes.
- Prefer another focused Codex prompt for multi-line corrections.
- Use a surgical one-liner only for a truly narrow correction.

## Deployment

Deployment is separate from the context-bundle workflow.

Preferred command:

```bash
npm run deploy
```

The current script builds and rsyncs `dist/` to:

```text
joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/
```

Manual equivalent:

```bash
npm run build
rsync -av --delete dist/ joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/
```

Deploy only a reviewed, committed state.

Verify local build parity without modifying production:

```bash
rsync -avnc --delete dist/ joe@192.168.7.25:/opt/docker/stacks/nginx-static/html/td/
```

No file entries means the contents match. Directory-only entries are not content differences.

## Complete project bundle workflow

### Objective

At the end of meaningful work, ChatGPT returns one complete ZIP that can be used for both:

1. updating `~/projects/geeklabs-td`
2. direct upload into a new ChatGPT conversation

Stable bundle name:

```text
geeklabs-td-context.zip
```

### Required contents

The bundle includes the complete current tracked project structure, including source, tests, scripts, documentation, project metadata, and lightweight public assets.

It excludes:

- `.git/`
- `node_modules/`
- `dist/`
- coverage and caches
- editor artifacts
- temporary screenshots and logs
- environment files or secrets

The archive uses repository-relative paths at its root so it can be extracted directly over `~/projects/geeklabs-td`.

### ChatGPT responsibility

ChatGPT must:

1. start from the latest complete uploaded project bundle
2. inspect the relevant current files before making project-specific claims
3. preserve valid source and documentation
4. update outdated context when the conversation establishes a newer state
5. incorporate all completed source, test, workflow, and documentation changes available in the uploaded baseline
6. return one complete replacement ZIP, not a patch
7. provide a direct download link
8. never instruct the user to regenerate a ZIP that ChatGPT has already supplied

ChatGPT must not call a bundle authoritative if locally changed files were never uploaded or otherwise made fully available. In that case, request a fresh current repository archive first.

### Applying the completed bundle locally

After downloading the ZIP supplied by ChatGPT:

```bash
cd ~/projects/geeklabs-td
unzip -o ~/Downloads/geeklabs-td-context.zip
git status --short
git add -A
git diff --cached --stat
git commit -m "docs: update Defense Protocol project context"
git push
```

Use a different concise commit message when the bundle contains source changes rather than documentation only.

Do not recreate or regenerate the downloaded ZIP. The downloaded ZIP is the completed authoritative handoff for that session.

### New ChatGPT conversation

Upload the same `geeklabs-td-context.zip` directly into the new conversation.

The assistant should:

- inspect the bundle before answering project-specific questions
- treat current file contents as the primary source of truth
- distinguish implemented, deployed, planned, deferred, retired, and unresolved work
- avoid claiming the bundle was reviewed unless the relevant files were actually inspected
- cite exact files and code locations when describing implementation

## Command preferences

- Assume commands run in the current Arch/tmux environment unless cross-host execution is explicitly required.
- Begin repository workflows with `cd ~/projects/geeklabs-td`.
- Give one logical troubleshooting or verification step at a time.
- Warn before long-running, destructive, service-restarting, or production-deploying commands.
- Preserve established workflows unless there is a concrete reason to change them.
- Never fabricate command output, tests, file contents, or deployment verification.

## Completion criteria

The context update is complete only when:

- ChatGPT used the latest full project baseline
- relevant source and context changes were incorporated
- a complete replacement ZIP was produced
- a working download link was supplied
- the ZIP extracts directly over `~/projects/geeklabs-td`
- the extracted files can be staged with `git add -A`
- the same ZIP can be uploaded into the next ChatGPT conversation
- no second local ZIP-generation step is required

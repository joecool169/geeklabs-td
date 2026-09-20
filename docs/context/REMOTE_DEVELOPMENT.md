# Remote development handoff — September 20, 2026

## Working locations and source of truth

| Purpose | Location |
| --- | --- |
| Linux development | SSH `geeklabs-td`, `/home/joe/projects/geeklabs-td-dev` |
| Production game checkout | Same host, `/home/joe/projects/geeklabs-td` |
| Production site/API repository | Same host, `/home/joe/projects/geeklabs-site` |
| Production Compose stack | Same host, `/opt/docker/stacks/geeklabs-web` |
| Mac iOS/release checkout | `/Users/joe/projects/geeklabs-td` |

Forgejo remains authoritative. Remote `forgejo` uses the existing server SSH
identity; `origin` fetches the public GitHub mirror through HTTPS. Its push URL
uses GitHub SSH, which is not yet configured on this server. Until configured,
mirror reviewed Forgejo commits from the Mac. Do not copy private SSH keys from
the Mac. If direct GitHub pushes are wanted, authorize a server-specific key
and verify GitHub's host key through a trusted source.

The development directory is separate because the old server checkout is used
by the deployment script and production image build. Its observed revision on
September 20 was `7bf5fb0`; it was clean and was left untouched. This is checkout
evidence, not a fresh verification of the running image. The site checkout had
an untracked Python cache directory, also left untouched.

## Server setup

Node.js 22.23.2 was installed in the user's `~/.local/opt` directory using the
official Node distribution and its SHA-256 checksum. `node`, `npm`, and `npx`
are linked from `~/.local/bin`; the existing login profile adds that directory.
No system Node package or production container was changed.

```bash
export PATH="$HOME/.local/bin:$PATH"
cd /home/joe/projects/geeklabs-td-dev
git fetch --all
git status --short --branch
# Only when the tree is clean:
git pull --ff-only forgejo main
npm ci
npm test
npm run build
```

For browser previews, run `npm run dev -- --host 127.0.0.1` on the server and
forward the displayed port over SSH, for example from the Mac:

```bash
ssh -L 5173:127.0.0.1:5173 geeklabs-td
```

Open the forwarded localhost URL. Avoid making development ports public.

Use the Codex remote host `geeklabs-td` and select the development folder above
as the project. The saved local `GeekLabsTD` project still points at the Mac;
cloning alone does not change that app setting or relocate existing tasks.

## Context brought forward

Read `AGENTS.md`, `CURRENT_STATE.md`, `WORKFLOW.md`, and `DECISIONS.md` first.
The important local-memory facts are now represented in tracked documents:

- Shared Phaser/Vite gameplay and Capacitor iOS shell; no separate native rewrite.
- Generated callsigns, opt-in global scores, preserved local scores, accepted
  balance, and recorded physical-device acceptance.
- Asset/sound provenance and privacy reconciliation live in the art/app-store docs.
- Latest recorded Apple state is September 18 submission of 1.0 build 3, with
  manual release selected. Older build-2 pending-review notes are superseded.
  Apple review outcome was not rechecked for this move.
- Site/API/SQLite/backups are a separate deployment concern. Moving development
  does not migrate or reset live data and is not authorization to deploy.
- Historical LAN/Tailscale routing repair used a persistent Netplan main-table
  route rule for the LAN at priority 2500. This is historical context only;
  inspect current networking before any repair, and preserve working SSH access.
- Off-host backup and production access-hardening remain unverified historical
  follow-ups. Do not mark them complete based on this development setup.

## Files that Git does not move

Keep the Mac checkout. Its `ios/Archives/` contains four signed archives,
including `DefenseProtocol-1.0-3.xcarchive` (about 54 MB total for all archives).
Archive contents and matching dSYMs are release evidence and should be retained
in the Mac's backup. No independent backup was verified during this move.

Xcode derived data, dependencies, built web output, native synced web assets,
and IDE user settings are ignored/generated. Recreate dependencies and bundles
with the documented commands. Tracked source, native project files, store
screenshots, provenance, and release notes travel through Git.

Signing identities/private keys and provisioning reside in the Mac's Apple/Xcode
setup and must remain private. Linux cannot replace the Mac release workflow.
On the Mac, fetch and fast-forward the reviewed Forgejo revision, then run
`npm ci` and `npm run ios:sync` before Xcode archive/device checks.

`scripts/deploy.local.env` is ignored, workstation-specific configuration.
It was intentionally not copied to the development checkout. Use
`deploy.env.example` when configuring a separately authorized deployment path;
the Mac's SSH alias configuration does not automatically exist on Linux.

## Outstanding checks

- Select/add this remote development folder in Codex; existing local tasks stay local.
- Configure direct GitHub push authentication if desired; Mac mirroring remains usable.
- Confirm a durable backup of signed Mac archives and signing recovery material.
- Check Apple's current review result before the next release action.

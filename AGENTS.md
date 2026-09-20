# Defense Protocol working context

Start with `docs/context/CURRENT_STATE.md`, `docs/context/REMOTE_DEVELOPMENT.md`,
`docs/context/WORKFLOW.md`, and `docs/context/DECISIONS.md`. For iOS release work,
read `docs/app-store/READINESS.md` and the latest dated preparation entries.
`AI_CONTEXT.md` is a historical gameplay snapshot, not current release status.

- Forgejo is authoritative; GitHub is a public secondary mirror. Never commit
  credentials, SSH keys, signing material, local deployment configuration, or
  private customer/account data.
- Remote development checkout: `/home/joe/projects/geeklabs-td-dev` on SSH host
  `geeklabs-td`. Production checkout: `/home/joe/projects/geeklabs-td`.
  Keep development edits out of the production checkout and stack.
- Routine edits, tests, commits, and Git pushes do not deploy the game.
  Run `npm run deploy` only for an explicitly authorized reviewed release.
- On the server, use Node 22 through `$HOME/.local/bin`; non-login commands may
  need `export PATH="$HOME/.local/bin:$PATH"`.
- Use `npm ci`, `npm test`, `npm run build`, and `git diff --check` as appropriate.
  Documentation-only edits need diff/link checks, not a new game test run.
- Keep the accepted gameplay balance intact unless a balance change is requested.
  Preserve shared web/iOS gameplay, generated callsigns, and opt-in online scores.
- Linux is for shared-game development. Xcode, signing, device validation, and
  App Store archives/uploads remain on the Mac. Do not delete its ignored archives.
- Record what was verified, reported, historical, deployed, and still unknown.
  Refresh current-state/release notes after material changes; do not infer live
  App Store or production status from a Git commit.

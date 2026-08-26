# Project Context

These files provide maintained context for humans and coding agents. Git,
committed source, and observed runtime behavior are authoritative; context files
summarize them and must never contain credentials, tunnel tokens, signing
secrets, or other private operational data.

## Document ownership

| File | Purpose | Update when |
| --- | --- | --- |
| [CURRENT_STATE.md](CURRENT_STATE.md) | Volatile release, validation, deployment, and next-gate snapshot | A material release, deploy, device result, or operational state changes |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Stable game, platform, service, and repository boundaries | A durable responsibility or integration boundary changes |
| [ROADMAP.md](ROADMAP.md) | Completed milestones and remaining product work | A phase begins, completes, or materially changes |
| [DECISIONS.md](DECISIONS.md) | Newest-first record of durable choices and rationale | A choice should survive beyond the current task |
| [WORKFLOW.md](WORKFLOW.md) | Development, validation, Git, deployment, and mirroring procedure | A command, remote, path, or release procedure changes |
| [IOS_POC.md](IOS_POC.md) | Native proof and release-validation evidence | A real Simulator or physical-device check is completed |
| [BALANCE_TESTING.md](BALANCE_TESTING.md) | Reproducible balance baselines and comparison method | A controlled balance run produces new evidence |
| [IDEAS.md](IDEAS.md) | Exploratory, explicitly non-binding design possibilities | A useful option should be preserved without becoming a commitment |
| [PORTABLE_EXPORT.md](PORTABLE_EXPORT.md) | Optional repository export procedure | The fallback transport procedure changes |

The production marketing/support site and infrastructure definitions live in
the separate `geeklabs-site` repository. This repository documents only the
boundary and the facts needed to develop and release the shared game core.

## Maintenance policy

- Keep volatile facts—exact test counts, commit IDs, deployed revisions, device
  results, and current blockers—in `CURRENT_STATE.md` rather than repeating them
  across stable documents.
- Update `CURRENT_STATE.md` after every material release or production change,
  even when the deployed game code itself is unchanged.
- Add new decisions at the top of `DECISIONS.md`. Never silently rewrite an
  accepted decision; add a later entry that explicitly supersedes it.
- Update architecture only when ownership or data flow changes. Implementation
  details that are obvious from source do not need to be duplicated here.
- Record iOS and balance claims only after a reproducible run, including the
  relevant device, version, seed, or checkpoint where applicable.
- Keep secrets out of Git. Documentation may name secret files or variables but
  must not include their values.

## Completion check for material work

Before closing a release, deployment, infrastructure change, or major feature:

1. Run the relevant tests, build, and source diff checks.
2. Verify production separately; a pushed commit is not proof of deployment.
3. Refresh `CURRENT_STATE.md` and the roadmap if the visible status changed.
4. Add a decision entry when the work established a durable rule or boundary.
5. Update workflow or architecture only if their stable instructions changed.
6. Push Forgejo first, mirror the reviewed revision to GitHub, and state whether
   the production runtime was deployed.

This trigger-based process keeps context current without turning every small
code change into a documentation chore.

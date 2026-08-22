# Optional Portable Export

## Purpose

A ZIP export may be useful when a collaborator or tool cannot access Forgejo, GitHub, or the local repository. It is a disposable transport format, not a backup, source of truth, or required project artifact.

## Rules

- Export only a reviewed committed revision.
- Include the short commit ID in the filename.
- Do not include `.git`, `node_modules`, `dist`, caches, logs, editor artifacts, or secrets.
- State the exported commit alongside the file.
- Return to Git for all subsequent history and synchronization.

## Create an export

From the repository root:

```bash
git status --short --branch
git archive --format=zip --output="../geeklabs-td-$(git rev-parse --short HEAD).zip" HEAD
```

Because `git archive` reads the committed tree, uncommitted changes are intentionally excluded.

## Consume an export

Inspect the included context files and identify the exported commit before making project-specific claims. If continued development is required, obtain repository access or apply the reviewed work back to a Git clone rather than treating the extracted directory as a parallel authority.

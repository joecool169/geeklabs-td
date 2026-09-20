# VM maintenance to-do list

Created from the read-only audit on September 20, 2026. These are proposed
maintenance tasks, not authorization to change infrastructure. No VM changes
were made during the audit. Recheck current state before acting; dated findings
are recorded in [CURRENT_STATE.md](CURRENT_STATE.md).

Scope: the VM hosting the public website, game, gateway, tunnel, and leaderboard.
Deployment configuration and service changes belong in the separate
`geeklabs-site` repository. Keep secrets out of these notes and Git.

## 1. Recovery and backups — highest priority

- [ ] Choose a durable backup destination outside this VM and agree retention.
- [ ] Configure scheduled VM backups or equivalent recovery coverage for the
  database, deployment configuration, and privately stored secrets. Git mirrors
  alone do not provide full recovery.
- [ ] Keep consistent nightly SQLite backups and copy them off the VM.
- [ ] Test restoration in an isolated location without replacing live data.
  Verify database integrity and that the site, game, gateway, and leaderboard
  can be recovered. Record the backup used and the result.
- [ ] Add backup failure/staleness alerts and verify delivery to the owner.

## 2. Administrative access and firewall

- [ ] Confirm working SSH keys for required operators, Proxmox console recovery,
  and a rollback path before changing access controls.
- [ ] Plan key-only SSH, restrict eligible administrative users, and decide
  whether direct root key login is needed. Disable unnecessary SSH features.
- [ ] Review unrestricted passwordless sudo for the deployment account. Agree
  the minimum practical privileges while preserving the approved deployment flow.
- [ ] Choose the host/Proxmox firewall policy and trusted management sources.
  Cover IPv4 and IPv6, LAN and Tailscale access, and required outbound traffic.
- [ ] Preserve Cloudflare Tunnel ingress and avoid publishing container web
  ports unnecessarily. Account for Docker's firewall rules rather than assuming
  UFW alone filters all container traffic.
- [ ] Apply the approved policy with an existing recovery session available;
  verify fresh management connections and public services before closing it.
- [ ] Review upstream routing/firewall and Tailscale access rules to establish
  actual exposure. The audit did not prove internet exposure of SSH.

## 3. Updates and controlled reboot

- [ ] After recovery coverage is verified, agree a maintenance window and
  refresh the pending package inventory.
- [ ] Review and apply approved OS, Docker/Compose/containerd, and Tailscale
  updates. Preserve the persistent LAN routing rule and working remote access.
- [ ] Review container image versions separately; OS updates do not update
  existing containers. Rebuild/redeploy only the approved services.
- [ ] Reboot to activate installed kernel/system-library updates.
- [ ] Verify LAN and Tailscale SSH, routing, time sync, Docker startup, container
  health, public website/game, leaderboard GET, and backup scheduling afterward.
  Do not submit fabricated leaderboard scores as a health test.
- [ ] Confirm reboot-required status clears and record any remaining updates.

## 4. Monitoring and optional improvements

- [ ] Inventory existing external monitoring before adding anything; confirm
  alerts for public outages, disk pressure, container failures, and stale backups.
- [ ] Consider measured container memory/process limits without impairing builds
  or normal operation.
- [ ] Review non-root execution and capability reduction where compatible;
  retain existing read-only filesystems, log rotation, and privilege protections.
- [ ] Optionally prune unused build cache after reviewing scope. Preserve active
  images, rollback images, data, and backups. Capacity was not urgent at audit.
- [ ] Keep operational tools installed through their intended update path;
  user-local Node requires separate maintenance from OS packages.

## Completion evidence

Check items off only after verification. Record date, approved scope, backup or
rollback reference, changed configuration/revision, test results, and unresolved
limitations in `CURRENT_STATE.md`. Never put credentials or backup contents in
this checklist. A successful database integrity check is not a full restore test.

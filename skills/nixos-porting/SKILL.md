---
name: nixos-porting
description: Port Docker, Docker Compose, or traditionally installed applications to native NixOS packages and service modules exposed through a flake. Use for upstream-compatible fork branches and their maintenance, not container deployment or routine host activation.
---

# Native NixOS porting

Deliver a reproducible application package, an importable NixOS module for server workloads, `flake.nix`, a generated `flake.lock`, and evidence that the native runtime preserves the requested features. Keep Docker and other upstream installation methods working; the NixOS implementation runs without a container runtime.

Inspect repository instructions, remotes, the selected upstream base, Dockerfiles/Compose, installers, dependency manifests, entrypoints, and existing tests. Identify build steps, runtime processes, external services, state, secrets, ports, privileges, and host assumptions. Agree on missing architecture decisions; do not replace the database or collapse a multi-service application merely to simplify packaging.

- For packaging and runtime adaptation, read [references/packaging.md](references/packaging.md).
- For service modules, consumer integration, and validation, read [references/modules-and-tests.md](references/modules-and-tests.md).
- For the fork's patch boundary and subsequent upstream updates, read [references/fork-maintenance.md](references/fork-maintenance.md).
- For concrete techniques and their limits, consult [references/wgdashboard-patterns.md](references/wgdashboard-patterns.md).

Prefer additive Nix files, wrappers, and existing configuration interfaces. When source changes are necessary, add small platform-neutral seams with legacy defaults and regression tests. Keep unrelated feature changes separate. Preserve upstream formatting and toolchains; do not apply a repository-wide quality migration as part of a port.

Keep application packaging independent of host inventory. Before reading or changing infrastructure, require the user to identify its checkout for this operation. Prepare consumer configuration there only within the requested scope. Use the available `project-deployment` skill for deployment/provisioning; creating a port does not authorize live activation or rewriting published Git history.

Record the upstream base and patch rationale, exported flake interface, runtime/configuration ownership, consumer example, validation commands, and update procedure in project-local documentation. Report builds, VM tests, architecture coverage, and live deployment separately. Do not claim complete support from evaluation or an HTTP smoke test alone.

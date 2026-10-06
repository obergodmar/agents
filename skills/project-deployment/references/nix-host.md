# Nix application and infrastructure boundaries

## Select the checkout

The infrastructure repository describes the user's hosts; no particular local copy is authoritative. Obtain its path explicitly for the current operation and inspect its AGENTS.md, deployment docs, flake outputs, helper scripts, and current Git changes. Do not substitute another copy if commands fail. Resolve host, system architecture, SSH target, domain, and state/backup requirements from that checkout and the user's accepted choices.

## Application contract

Use [assets/flake.nix](../assets/flake.nix) as a minimal scaffold, then implement the referenced package/module/check files for the actual application. Do not copy a template that leaves missing imports. Export `packages.<system>.default`, `nixosModules.default`, and meaningful `checks.<system>` where applicable. Add apps/devShells only when useful; avoid a second independently maintained development toolchain.

Native Nix packaging: use buildNpmPackage for compatible npm locks, or fetchPnpmDeps/pnpmConfigHook for pnpm. Pin dependency hashes, runtime, and supported systems. Build from filtered source; install a runtime closure with an explicit executable. Network dependency fetching belongs in fixed-output fetchers, not ordinary build phases. Never invent hashes or reuse another project's dependency hash.

The NixOS module exposes relevant enable/package/listen/domain/state/environment-file options. Use an unprivileged service account, explicit service dependencies, restart policy, writable state boundaries, and appropriate systemd hardening. Reverse proxy/TLS belongs to the selected architecture. Secret-file options are runtime string paths outside the Nix store, not Nix path values or readFile contents. State migrations must be compatible with deployment and rollback.

Compose under NixOS is a valid alternative when already selected. Wrap pinned Compose definitions in a module/systemd unit, validate before starting, preserve named volumes on stop, and back up state. A flake that manages Compose does not by itself make image contents or network builds reproducible; distinguish that guarantee from native Nix packages.

## Infrastructure integration

The infrastructure checkout owns application flake inputs/revisions, concrete hosts, routing/firewalls, TLS, agenix secrets, backup integration, and operational settings. Keep the application module reusable. Integrate through its established host/service helpers, not a new parallel inventory. Preserve host-specific state versions; do not advance existing stateVersion values as part of deployment.

Before updating an input lock, inspect the current pin and requested revision. Build the application/checks and affected host configuration. If the checkout supplies `nix-host-build`, `nix-host-deploy`, or Colmena wrappers, inspect their help/source before invoking them. Commands run from the selected checkout and must not fall back to a different repository. Require explicit host/node selection, including Colmena `--on`; avoid fleet-wide defaults.

## Release modes

Choose between a system-generation deployment and a ready-made artifact pipeline. Prefer an existing mode; adding a preview/release controller is an architecture decision.

For an existing artifact controller, inspect its producer contract. A portable contract can identify schema version, project, commit, ref, system, and named Nix outputs; publish the closure and integrity metadata as one revision. Infrastructure owns routing, ports, secrets, GC roots, readiness, and rollback. Do not copy a controller implementation into the skill.

Activate a candidate only after readiness succeeds. Retain the previous working revision where supported. A checksum proves byte integrity, not independent publisher authenticity; unsigned cache trust must be an explicit project decision and must not disable host-wide signature policy.

Verify live service health, proxy/TLS, state access, and backups as applicable. A successful Nix build does not prove secret decryption, DNS, mesh connectivity, or live readiness.

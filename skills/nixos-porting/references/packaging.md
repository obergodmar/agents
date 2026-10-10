# Packaging and runtime boundaries

## Translate the runtime contract

Treat Dockerfiles, Compose, and installers as evidence of requirements, not scripts to reproduce verbatim. Map each process and dependency before implementation:

| Existing mechanism                           | Native implementation                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Image build stages                           | Separate derivations for backend, frontend, or generated resources                       |
| Distribution package installation            | Explicit Nix build/runtime dependencies                                                  |
| Entrypoint doing installation and startup    | Build-time packaging plus runtime initialization and foreground execution                |
| Volumes and writable application directories | Persistent state owned by the module, separate from immutable assets                     |
| Compose companion services                   | Existing NixOS modules or separately packaged services; preserve the chosen architecture |
| Container environment, ports, capabilities   | Typed options, credentials, explicit networking and service privileges                   |
| Container DNS names and healthchecks         | Configurable native endpoints and readiness checks                                       |

Preserve every required companion process, scheduled task, migration, frontend, protocol implementation, and integration. Distinguish optional features from unsupported features. Never substitute `virtualisation.oci-containers` for the requested native port.

## Build from pinned inputs

Expose `packages.<system>.<application>` and `packages.<system>.default` for supported Linux systems. Put language-specific derivations under `nix/` and generate the lockfile with Nix. Merge existing flake outputs instead of replacing them. Follow the repository's dependency manager and the APIs available in its pinned nixpkgs; consult the [Nixpkgs manual](https://nixos.org/manual/nixpkgs/stable/) when choosing builders.

Use the appropriate builder, such as `buildNpmPackage`, `buildPythonApplication`, `buildGoModule`, or `buildRustPackage`. A script application can instead use an explicit interpreter environment and a small derivation. Account for interpreter and dependency compatibility rather than assuming nixpkgs matches upstream's manifest versions.

Build frontend assets from source using the existing lockfile and install their real output directories. Declare dependency hashes where the builder requires them; update hashes from verified builds when dependency locks change. Investigate missing declared dependencies before adding peer-dependency workarounds. Runtime startup must not install packages, download source, build assets, or run an upstream self-updater. Keep that adaptation in the Nix runtime rather than disabling upstream updates for every installation method.

## Keep code immutable and state writable

Inventory relative writes, SQLite databases, uploads, logs, plugin downloads, generated configuration, and subprocess paths. Test from a working directory outside the source tree.

Prefer existing path/environment options and wrappers. If the application conflates assets with state, introduce a small shared runtime-path abstraction: independently configurable immutable asset and mutable state roots, with defaults preserving upstream behavior. Change only the affected call sites and test both defaults and overrides. Do not copy the entire application into writable state on every start.

Use `makeWrapper` or an equivalent launcher for interpreter paths, resource paths, and foreground server arguments. Supply commands through explicit package references or the module's service `path`; no global `/usr/bin`, sudo installation, or development shell at runtime. Replace assumptions such as a CLI locating configuration by interface name with its supported explicit configuration-path argument when needed.

Keep the original server lifecycle: worker counts, singleton background jobs, plugin initialization, and subprocess behavior. A custom server configuration may be required; a generic multi-worker launcher can duplicate jobs or break in-memory state. The module starts a foreground process so systemd supervises the real service.

Prefer a focused source change over fragile broad textual substitutions. A build-time patch can reduce tracked source edits, but it still needs an explicit rationale, anchored applicability, and upstream-update tests.

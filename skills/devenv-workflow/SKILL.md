---
name: devenv-workflow
description: Add or maintain Nix/devenv/direnv tooling and prefixed package-script wrappers. Use for environment setup or migration, not routine feature edits in an established environment.
---

# Reproducible development

Inspect project instructions, existing locks, language manifests, supported platforms, and command names. Preserve accepted runtime/package-manager choices; default new JS/TS projects to pnpm. Do not redesign the application while configuring tools.

Nix supplies runtimes, system libraries, SDKs, browsers, and external CLIs. Language package managers supply project dependencies through committed locks. Local commands run in direnv or `devenv shell -- <command>`; no global Node/npm installation is required.

1. Add or adapt `devenv.nix`, `devenv.yaml`, `.envrc`, and ignore rules. Commit `devenv.lock`; pin input revisions through it. Do not silently update existing inputs.
2. For JS/TS, root package scripts remain authoritative. Select a stable project prefix from existing conventions or the user's choice. Generate wrappers, escape script names, forward arguments, and fail on normalized-name/custom-command collisions. Use [assets/package-scripts.nix](assets/package-scripts.nix).
3. Add only necessary platform tools and local services. Keep runtime secrets out of evaluated Nix values and tracked env files. Do not hide installing dependencies or running migrations inside shell entry.
4. Align declared engine/package-manager versions with the pinned Nix toolchain. Do not allow Corepack/pnpm to download a replacement package manager on NixOS. Read [references/toolchains.md](references/toolchains.md) for platform exceptions.
5. Verify shell entry, a representative wrapper with arguments, collision rejection, and frozen dependency installation. Connect existing quality gates and CI to the same commands.

Use `$project-quality` if available when configuring code style; otherwise implement its required checks from project instructions. Report verified commands and environmental limitations. Installing tooling does not authorize push, deploy, or production changes.

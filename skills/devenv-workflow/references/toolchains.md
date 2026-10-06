# Toolchain choices

## JavaScript

Declare Node through `languages.javascript.package`; enable the chosen package manager from Nix. Record compatible `engines` and `packageManager` metadata. Inspect actual versions in the activated shell before freezing locks; do not claim exact parity from a nixpkgs attribute name alone.

Prefer a compatible pinned Nix package or overlay when versions diverge. A locally configured package-manager mismatch override is acceptable only after verifying compatibility; keep it confined to devenv so hosted builds still honor their pin. Do not adopt a downloader as a NixOS workaround.

Use project-local Oxfmt/Oxlint/TypeScript dependencies. Invoke installed tools through scripts or `pnpm exec`; avoid `npx`/`pnpm dlx` implicit downloads. npm projects can call local binaries directly from package scripts.

Generated wrappers map `:`, `/`, and spaces to `-`. Reject collisions before `listToAttrs` drops duplicate entries and before merging custom scripts. Forward `"$@"`; npm needs `npm run <script> -- "$@"`, pnpm uses `pnpm run <script> "$@"`.

## Native and multiple languages

Declare required Python, Rust, Java, database, shell, or native library tools in devenv. Preserve language lockfiles separately. Include SDKs only for supported targets. Some licensed/platform tooling, such as host Xcode, cannot be replaced by a generic Nix runtime; document and validate the explicit host prerequisite. Do not invent cross-platform support.

Nix browser packages or compatible browser-driver closures replace local browser downloads. Verify browser/test-library compatibility and select the supported executable path. Never disable browser validation without explaining the specific supported setup.

## Hosted builds

Nix-based CI should install pinned Nix/devenv and run the same project commands. Platform-native builders such as Vercel use their supplied runtime and matching manifest pins; they do not need to evaluate devenv. Keep offline quality checks separate from credentials, database migration, and external API configuration.

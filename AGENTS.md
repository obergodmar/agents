# Agent workflows

Private, English-language library of portable skills, configuration assets, and a Codex installer. Work on `master`; use Conventional Commits when a commit is requested.

- Enter through direnv or `devenv shell -- <command>`. Nix owns system tools; pnpm owns package dependencies.
- Root package scripts are authoritative; devenv exposes `agents-*` wrappers.
- Run `agents-check` and `agents-pack` after changes to instructions, assets, or installer behavior. Inspect the archive when changing publication contents.
- Use 2 spaces for JS/TS, LF, Oxfmt, Oxlint, and TypeScript checking of JavaScript.
- Keep skill entrypoints short. Put conditional procedures in linked references and generated configuration in assets. Avoid duplicating rules across skills.
- Skills must contain no personal host names, checkout paths, addresses, credentials, or fixed infrastructure topology. Resolve the infrastructure checkout from the user's explicit choice.
- Keep common working agreements in `instructions/project-baseline.md`; this file governs development of this library only.
- Preserve product architecture. Implement selected tooling autonomously; discuss changes to hosting, databases, persistence, or application boundaries before introducing them.
- Installer changes must preserve unmanaged files and reject locally modified managed content, unsafe paths, and symlinks. Test install/update/remove and failure cases in temporary directories.
- No lifecycle installation hooks. No runtime dependencies in the installer. Never publish plaintext credentials or environment files.
- GitHub Packages is the private distribution target. Each master commit publishes a CI-only prerelease version; explicit version tags publish stable releases. PRs never publish. Preserve immutable versions and keep credentials scoped to publication.

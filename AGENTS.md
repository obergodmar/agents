# Agent Workflows

Public, English-language Codex plugin. Work on `master`; use Conventional Commits.

- Enter through direnv or `devenv shell -- <command>`. Nix owns system tools; pnpm owns development dependencies. `package.json` is private tooling, never a distributed package.
- Root package scripts are authoritative; devenv exposes `agents-*` wrappers. Run `agents-check` and `agents-pack` after changes. Inspect ZIP contents when changing distribution.
- Use 2 spaces for JS/TS, LF, Oxfmt, Oxlint, TypeScript, and EditorConfig.
- Keep skill entrypoints short; put conditional procedures in linked references and configuration in assets. Preserve implicit invocation metadata.
- Skills contain no personal host names, checkout paths, addresses, credentials, or fixed infrastructure topology. The user selects the infrastructure checkout for each operation.
- `plugin.json` owns plugin identity/version; `.agents/plugins/marketplace.json` is the source catalog. Codex installs/caches plugins. Do not implement a second installer or add application dependencies for agent configuration.
- Keep persistent project agreements in project `AGENTS.md`; `instructions/project-baseline.md` is a template, not automatically loaded plugin policy.
- Preserve product architecture. Discuss hosting, database, persistence, or application boundary changes before introducing them.
- Native NixOS ports keep upstream compatibility and a small fork patch surface. Record the selected upstream base; separate functional changes from packaging and keep host policy in the consumer checkout.
- Bundle only plugin metadata, skills, the instructions template, and README. No lifecycle hooks, runtime dependencies, secrets, or repository tooling in the ZIP.
- CI checks pull requests and master pushes, then uploads a plugin ZIP. No npm or GitHub Packages publication. Project catalogs pin a reviewed Git commit; never silently advance them.

# Agent Workflows

A public Codex plugin with reusable skills. Codex manages installation and its cache; application package.json files and builds need no agent dependency.

| Skill                | Purpose                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `devenv-workflow`    | Nix/devenv/direnv and prefixed project commands                      |
| `project-quality`    | EditorConfig, formatters, linters, and type checks                   |
| `project-deployment` | Vercel/GitHub or a user-selected Nix infrastructure checkout         |
| `nixos-porting`      | Native NixOS application ports with small, maintainable fork patches |

## Install for yourself

Use a Codex version that supports plugins:

```sh
codex plugin marketplace add obergodmar/agents --ref master
codex plugin add agent-workflows@agent-workflows
```

In the desktop app, open the Plugins Directory and select the Agent Workflows source/plugin. Start a new session after installation; restart the app if a new local catalog does not appear.

This is a Git-backed marketplace, not a public-directory submission. No npm account, registry token, or project dependency is required. See [Codex plugin packaging and marketplaces](https://developers.openai.com/plugins/build/plugins).

## Connect a project

Commit `.agents/plugins/marketplace.json`. Replace `COMMIT_SHA` with a reviewed full commit from this repository:

```json
{
  "name": "agent-workflows",
  "interface": { "displayName": "Agent Workflows" },
  "plugins": [
    {
      "name": "agent-workflows",
      "source": {
        "source": "url",
        "url": "https://github.com/obergodmar/agents.git",
        "sha": "COMMIT_SHA"
      },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_USE" },
      "category": "Productivity"
    }
  ]
}
```

Commit `.codex/config.toml` to enable it for the trusted project:

```toml
[plugins."agent-workflows@agent-workflows"]
enabled = true
```

From that project, explicitly register its catalog before installing:

```sh
codex plugin marketplace add .
codex plugin add agent-workflows@agent-workflows
```

Inspect discovery with `codex plugin list --marketplace agent-workflows --available --json`. The desktop app can also install from the project's catalog. Explicit registration works in CLI versions that do not automatically discover repo catalogs. Codex loads project config only for trusted projects. `ON_USE` is the catalog policy field; this skills-only plugin has no service authentication.

Allowlist only the marketplace file and project config if their folders are otherwise ignored. Keep personal state ignored. Do not duplicate the same skills under `.agents/skills` or a user skills folder. Application installation, CI, and deployment do not require Codex or the plugin.

## Update, disable, or remove

For a personal Git marketplace tracking master:

```sh
codex plugin marketplace upgrade agent-workflows
codex plugin add agent-workflows@agent-workflows
```

For a project catalog, review a new commit, change `source.sha`, and commit it. Register that project's catalog and reinstall through Codex, then start a new session. Do not keep a separate personal marketplace with the same name pointing to another revision. Changing plugin version metadata does not advance a pinned Git source.

Set `enabled = false` in project config to disable it there. `codex plugin remove agent-workflows@agent-workflows` removes the local installation. Remove this plugin's tracked catalog entry/config section to remove the project's declaration; preserve other entries and settings.

## Working agreements and usage

`AGENTS.md` remains the project's persistent instructions. Adapt [the baseline template](instructions/project-baseline.md) to the project; Codex does not automatically load a plugin's `instructions/` folder.

Select skills from Codex's skill picker or ask to use `devenv-workflow`, `project-quality`, `project-deployment`, or `nixos-porting` from Agent Workflows. Implicit invocation is enabled. Reuse tooling decisions autonomously; architecture, providers/databases, and operational infrastructure scope remain user-owned.

For a native application port, a starting prompt is: "Use nixos-porting from Agent Workflows to port this application from Docker Compose to native NixOS. Expose a package and NixOS module through a locked flake, preserve existing installation methods, and keep the fork easy to rebase onto upstream's selected branch. Prepare and test the port without activating it on a live host." Prompts can be in any language; repository documentation stays English. Supply the upstream branch if already selected.

For personal-host deployment, supply the infrastructure checkout for each operation. No personal infrastructure inventory is bundled.

## Develop and distribute

Nix/devenv supplies tools; no global Node or pnpm is required:

```sh
direnv allow
# Or prefix commands with devenv shell --.
devenv shell -- agents-install
devenv shell -- agents-check
devenv shell -- agents-pack
```

`agents-format` writes formatting. The aggregate check covers formatting, linting, TypeScript, plugin/skill validation, archive tests, and Nix wrappers. `agents-pack` creates `artifacts/agent-workflows-VERSION.zip` from an explicit allowlist; it never publishes an npm package.

GitHub Actions checks PRs and master pushes, then uploads the plugin ZIP. GitHub is the marketplace source; consuming projects choose their reviewed commit pin. Bump `plugin.json.version` for intentional releases. `package.json` is private development tooling; its version is not distribution metadata.

For local testing, run `codex plugin marketplace add /path/to/checkout`, inspect with `codex plugin list --available --json`, then install with `codex plugin add agent-workflows@agent-workflows`. Automated tests should use an isolated `CODEX_HOME` to preserve user settings.

## Extend

Add a directory under `skills/` with matching folder/name, `SKILL.md`, and `agents/openai.yaml`. Link substantial procedures in references and templates in assets. Codex discovers the whole skills directory; no per-skill installer registry is needed.

Add MCP servers or hooks only for a demonstrated need and declare them in the plugin manifest. The marketplace can list more plugins without changing consumers' application toolchains.

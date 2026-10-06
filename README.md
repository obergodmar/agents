# Agent workflows

Private, portable skills for Codex: reproducible development, project quality, and deployment. Instructions and assets are versioned together. No model-specific prompts or private infrastructure inventory are bundled.

| Skill                | Purpose                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `devenv-workflow`    | Add or maintain Nix/devenv/direnv and prefixed project commands        |
| `project-quality`    | Configure EditorConfig, formatters, linters, and type checks           |
| `project-deployment` | Configure Vercel/GitHub or a user-selected Nix infrastructure checkout |

## Develop

Prerequisites: Nix, devenv, and optionally direnv, supplied by your Nix environment. No global Node or pnpm installation is needed.

```sh
direnv allow
# Or use devenv shell -- before each command.
devenv shell -- agents-install
devenv shell -- agents-check
devenv shell -- agents-pack
```

`agents-format` writes formatting; `agents-format-check`, `agents-lint`, and `agents-typecheck` only check. `agents-check` also validates skills/assets and runs installer tests. `agents-pack` produces an npm archive under ignored `artifacts/`. Nix and YAML formatting have their own commands and participate in the aggregate gates.

## Connect all skills to a project from this checkout

This works for npm, Python, Nix, and other projects. The target needs no package.json or node_modules. Substitute your actual source and target checkout paths; they are never embedded in installed skills.

```sh
cd /path/to/this-checkout
devenv shell -- agents-skills install --target /path/to/project
```

The installer copies all three skill directories to `<project>/.agents/skills/`, copies shared instructions, records file checksums/version in `.agents/agent-workflows.json`, and adds one owned block to the root `AGENTS.md`. Existing project instructions remain intact. Review and commit these files so skills are available before dependencies are installed, in fresh worktrees, and to teammates.

Updates use the same source command:

```sh
devenv shell -- agents-skills update --target /path/to/project
devenv shell -- agents-skills doctor --target /path/to/project
devenv shell -- agents-skills remove --target /path/to/project
```

`update` requires an existing installation. Updates/removal refuse changed managed files or a changed managed AGENTS block. Resolve the reported differences manually; there is no force-overwrite option. Files outside the ownership manifest are preserved. Do not edit installed copies; contribute changes here or add project-specific instructions outside the managed block.

Only one installation scope is currently implemented: repository-local. This avoids duplicate skill names from simultaneous global and project installs. Codex discovers `.agents/skills`; restart the session if changes do not appear. See [Codex skill discovery](https://learn.chatgpt.com/docs/build-skills).

## Connect through the private npm package

Publish the package first using the setup below. In the consuming project's devenv shell, configure GitHub Packages authentication outside the repository. A local `.npmrc` may reference `${NODE_AUTH_TOKEN}` but must never contain a literal token:

```ini
@obergodmar:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Use a GitHub personal access token (classic) with `read:packages` access and any required organization authorization; do not print it. For GitHub Actions consumers, `GITHUB_TOKEN` can read the package when their repository is explicitly granted access. See [GitHub Packages authentication](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry). The consuming toolchain must provide Node 24 or newer. Replace `VERSION` with a published version.

```sh
pnpm add -D --save-exact @obergodmar/agent-skills@VERSION
pnpm exec agent-workflows install --target .
pnpm exec agent-workflows doctor --target .
```

For npm projects use `npm install --save-dev --save-exact` and invoke the installed binary directly:

```sh
node node_modules/@obergodmar/agent-skills/scripts/cli.mjs install --target .
```

There is no postinstall hook and no network download in the installer. Disabled dependency lifecycle scripts remain supported. Update the pinned dependency before running `agent-workflows update`. Commit the lockfile and materialized `.agents` changes together. Development credentials for private packages must also be available to CI and Vercel when those platforms install that dependency.

For non-npm projects prefer the checkout method or an extracted versioned npm archive. In the latter case, provide Node through Nix and run `node /path/to/extracted/package/scripts/cli.mjs install --target /path/to/project`.

## Use the skills

Examples for Codex:

- `Use $devenv-workflow to add reproducible tooling with the app- command prefix.`
- `Use $project-quality to configure Oxlint, Oxfmt, TypeScript, and EditorConfig.`
- `Use $project-deployment for Vercel with GitHub and Neon Postgres.`
- `Use $project-deployment for my host. Apply infrastructure changes in the checkout I provide.`

Automatic selection is enabled. A selected deployment provider or database is recorded in the project's own instructions/ADR. The Nix infrastructure checkout must be supplied by the user for the current operation; the skill never guesses it. Framework-specific checks and architecture remain project-owned.

## Publish privately

1. The private repository is [obergodmar/agents](https://github.com/obergodmar/agents), with `master` as its default branch.
2. Package.json links to `git+https://github.com/obergodmar/agents.git`. If changing the repository owner or package scope, update repository metadata, publishConfig, registry configuration, and these instructions together. GitHub Packages scopes follow the owning account/organization.
3. Enable Actions and the package permissions needed by this repository. The release workflow uses `GITHUB_TOKEN` with package write access; no stored npm publishing token is required.
4. Push commits to `master` to publish automatic versions. For an intentional stable release, review/update the source version, run checks, commit the changes, then push the corresponding `vVERSION` tag.
5. Confirm package visibility is private and grant consumers read access. `publishConfig.access` is restricted. Package.json omits `private: true` because that flag forbids publication; it does not control registry visibility.

CI runs through Nix/devenv. PRs run checks without publication. Every push to `master` selects all newly reachable commits, including intermediate commits in a batch, and checks/packages each snapshot independently. Failed checks block that snapshot's publication, without canceling the other commits.

Automatic versions use `BASE-master.RUN.COMMIT_ORDER.ATTEMPT.gSHORT_SHA`, for example `0.1.0-master.12.2.1.gabcdef123456`. The source `package.json` keeps its base version; CI stamps only its temporary checkout and records `gitHead`. Reruns get distinct versions. The pushed head publishes under the `master` dist-tag; intermediate snapshots use `commits` and remain installable by exact version. Tagged stable releases validate version/tag agreement and publish under `latest`.

After configuring private-registry authentication, install the current successful master build and pin its resolved version:

```sh
pnpm add -D --save-exact @obergodmar/agent-skills@master
pnpm exec agent-workflows install --target .
```

For updates, repeat the add command, then use `agent-workflows update`. An unqualified dependency uses `latest`, which is reserved for intentional stable releases.

Publication workflows queue instead of canceling older pushes. GitHub currently allows 100 queued workflows and at most 256 matrix commits per push. Only the push head changes the `master` alias; failed builds leave the previous package available. Package publication uses the workflow's `GITHUB_TOKEN`; no version-bump commits, automatic Git tags, or extra publishing secrets are generated. A missing repository field intentionally blocks publishing. npmjs.com OIDC trusted publishing is a different distribution mode and is not configured here.

## Extend

Add a folder under `skills/` with matching `name` and folder name, a concise `description`, `SKILL.md`, and Codex metadata. Link substantial mode-specific instructions from the entrypoint; keep templates in `assets/`. The installer discovers all skills automatically. Validation rejects broken local links, personal checkout references, symlinks, and incomplete manifests.

Use project-local overrides for exceptions. Add a new profile only after a concrete workflow needs it. Future Codex plugin packaging can reuse the same skills without changing their content; npm currently supplies distribution and versioning, not a Codex plugin registration.

# Agent workflows

Public, portable skills for Codex: reproducible development, project quality, and deployment. Instructions and assets are versioned together. No model-specific prompts or private infrastructure inventory are bundled.

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

Exclude `.agents/**` from project formatters: managed assets retain the library's style and checksums. Keep root `AGENTS.md` in formatting checks; its generated block is compatible with Oxfmt. If the project ignores `.agents`, allowlist the owned skill directories, `.agents/instructions/agent-workflows.md`, and `.agents/agent-workflows.json` while preserving exclusions for unrelated local agent state.

Updates use the same source command:

```sh
devenv shell -- agents-skills update --target /path/to/project
devenv shell -- agents-skills doctor --target /path/to/project
devenv shell -- agents-skills remove --target /path/to/project
```

`update` requires an existing installation. Updates/removal refuse changed managed files or a changed managed AGENTS block. Resolve the reported differences manually; there is no force-overwrite option. Files outside the ownership manifest are preserved. Do not edit installed copies; contribute changes here or add project-specific instructions outside the managed block.

Only one installation scope is currently implemented: repository-local. This avoids duplicate skill names from simultaneous global and project installs. Codex discovers `.agents/skills`; restart the session if changes do not appear. See [Codex skill discovery](https://learn.chatgpt.com/docs/build-skills).

## Connect through the public npm package

Publish the package first using the setup below. Installation from npmjs.org needs no token. The consuming toolchain must provide Node 24 or newer. Replace `VERSION` with a published version. If you previously configured this scope for GitHub Packages, remove that mapping or replace it with:

```ini
@obergodmar:registry=https://registry.npmjs.org
```

```sh
pnpm add -D --save-exact @obergodmar/agent-skills@VERSION
pnpm exec agent-workflows install --target .
pnpm exec agent-workflows doctor --target .
```

For npm projects use `npm install --save-dev --save-exact` and invoke the installed binary directly:

```sh
node node_modules/@obergodmar/agent-skills/scripts/cli.mjs install --target .
```

There is no postinstall hook and no network download in the installer. Disabled dependency lifecycle scripts remain supported. Update the pinned dependency before running `agent-workflows update`. Commit the lockfile and materialized `.agents` changes together. CI and Vercel can install this public dependency without registry credentials.

For non-npm projects prefer the checkout method or an extracted versioned npm archive. In the latter case, provide Node through Nix and run `node /path/to/extracted/package/scripts/cli.mjs install --target /path/to/project`.

## Use the skills

Examples for Codex:

- `Use $devenv-workflow to add reproducible tooling with the app- command prefix.`
- `Use $project-quality to configure Oxlint, Oxfmt, TypeScript, and EditorConfig.`
- `Use $project-deployment for Vercel with GitHub and Neon Postgres.`
- `Use $project-deployment for my host. Apply infrastructure changes in the checkout I provide.`

Automatic selection is enabled. A selected deployment provider or database is recorded in the project's own instructions/ADR. The Nix infrastructure checkout must be supplied by the user for the current operation; the skill never guesses it. Framework-specific checks and architecture remain project-owned.

## Publish to npm

The package is `@obergodmar/agent-skills` in the [npm organization](https://www.npmjs.com/org/obergodmar). Public organization packages need no paid npm plan. npm organization membership and publication rights are separate from GitHub access; the two organization names need not match.

Bootstrap once from this checkout with an npm account authorized to publish in the organization:

```sh
devenv shell -- npm login --registry=https://registry.npmjs.org
devenv shell -- agents-check
devenv shell -- agents-pack
devenv shell -- npm publish ./artifacts/obergodmar-agent-skills-0.1.0.tgz --registry=https://registry.npmjs.org --access public --ignore-scripts
```

Use the archive for the current source version. npm may require interactive 2FA. Publish that version only once; if it already exists, use a new source version.

After the first publication, open the package's Settings → Trusted publishing on npmjs.com and add GitHub Actions:

- Organization or user: `obergodmar` (the GitHub owner).
- Repository: `agents`.
- Workflow filename: `release.yml`.
- Environment: leave blank; this workflow does not use a GitHub environment.
- Allow direct `npm publish`; stage-only permissions do not support automatic publication.

Complete a successful CI publication within two days of creating the publisher configuration. The workflow grants `id-token: write` and uses GitHub-hosted runners. Nix supplies Node and npm; OIDC requires npm ≥11.5.1 and Node ≥22.14.0. No `NPM_TOKEN` or GitHub Packages write permission is needed. See [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).

Push commits to `master` to publish automatic versions. For a stable release, update the source version to an unpublished version, run checks, commit, then push the matching `vVERSION` tag. Package metadata must point to the workflow's GitHub repository. Publication uses `publishConfig.access: public` and `https://registry.npmjs.org`. Existing GitHub Packages versions are not migrated or deleted.

CI runs through Nix/devenv. PRs run checks without publication. Every push to `master` selects all newly reachable commits, including intermediate commits in a batch, and checks/packages each snapshot independently. Failed checks block that snapshot's publication, without canceling the other commits.

Automatic versions use `BASE-master.RUN.COMMIT_ORDER.ATTEMPT.gSHORT_SHA`, for example `0.1.0-master.12.2.1.gabcdef123456`. The source `package.json` keeps its base version; CI stamps only its temporary checkout and records `gitHead`. Reruns get distinct versions. The pushed head publishes under the `master` dist-tag; intermediate snapshots use `commits` and remain installable by exact version. Tagged stable releases validate version/tag agreement and publish under `latest`.

Install the current successful master build and pin its resolved version:

```sh
pnpm add -D --save-exact @obergodmar/agent-skills@master
pnpm exec agent-workflows install --target .
```

For updates, repeat the add command, then use `agent-workflows update`. An unqualified dependency uses `latest`, which is reserved for intentional stable releases.

Publication workflows queue instead of canceling older pushes. GitHub currently allows 100 queued workflows and at most 256 matrix commits per push. Only the push head changes the `master` alias; failed builds leave the previous package available. OIDC supplies publication credentials; no version-bump commits, automatic Git tags, or publishing secrets are generated. A missing repository field intentionally blocks publishing. npm automatically generates provenance for OIDC publications from this public repository.

## Extend

Add a folder under `skills/` with matching `name` and folder name, a concise `description`, `SKILL.md`, and Codex metadata. Link substantial mode-specific instructions from the entrypoint; keep templates in `assets/`. The installer discovers all skills automatically. Validation rejects broken local links, personal checkout references, symlinks, and incomplete manifests.

Use project-local overrides for exceptions. Add a new profile only after a concrete workflow needs it. Future Codex plugin packaging can reuse the same skills without changing their content; npm currently supplies distribution and versioning, not a Codex plugin registration.

---
name: project-quality
description: Configure or migrate EditorConfig, formatting, linting, and type checks for JavaScript/TypeScript or multi-language projects. Use for quality tooling changes, not every code edit.
---

# Project quality

Read current commands/configuration and identify maintained languages, generated files, frameworks, and accepted style. Preserve existing style unless migrating it is requested. New JS/TS defaults are 2 spaces; use language-specific exceptions.

1. Ensure root `.editorconfig` matches formatter settings. Adapt [assets/editorconfig](assets/editorconfig), including Python indentation, Markdown trailing spaces, and Makefile tabs when relevant.
2. For JS/TS, use project-local Oxfmt and Oxlint plus an independent TypeScript check. Adapt [assets/oxfmtrc.json](assets/oxfmtrc.json) and [assets/oxlintrc.json](assets/oxlintrc.json); add only applicable framework plugins/rules. For other maintained languages read [references/languages.md](references/languages.md).
3. Expose non-mutating `format:check`, `lint`, `typecheck`, and aggregate `check`; expose `format` and `lint:fix` separately. Keep meaningful project tests/builds in the appropriate gate. Use the existing package manager and devenv wrappers.
4. When replacing ESLint/Prettier, inventory existing rules, plugins, ignores, and framework checks first. Read [references/migration.md](references/migration.md). Retain narrowly scoped unsupported checks when needed; never silently lower coverage.
5. Ensure each file category has one formatting owner. Exclude dependency stores, generated output, caches, vendored sources, and locks deliberately; avoid broad source exclusions. Optional commit hooks reuse the same tools; CI checks must never write fixes.
6. Run checks and a representative build/test where affected. Verify format idempotence and agreement with EditorConfig. Report unsupported checks instead of claiming equivalent coverage.

Architectural import boundaries are project-specific. Preserve existing boundary rules, but do not invent layers, dependency directions, or a test framework from the quality preset.

# Preserve quality during migration

List enabled ESLint plugins/rules, custom plugins, framework rules, type-aware checks, and Prettier plugins before changing dependencies. Check compatibility with the exact installed Oxc release in [Oxlint migration docs](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint.html).

Translate supported rules and ignores. If a meaningful rule has no supported equivalent, retain a focused existing check and document the gap. Remove obsolete configuration only after the equivalent checks pass. Migration does not imply replacing Nx, frameworks, tests, or application architecture.

Match current indentation, quoting, semicolons, trailing commas, import ordering, and line width. Do not combine a tooling migration with a repository-wide style change unless requested. Import sorting must preserve side-effect ordering. Inspect Vue/framework file coverage and special format plugins explicitly.

Use Oxfmt for its supported files; assign Nix, shell, Python, Rust, or other unsupported languages to their own formatter. Avoid competing YAML/Markdown formatters. Generated artifacts can be checked by their generator without being reformatted.

Run before/after checks, inspect source diffs, verify a relevant production build, and report remaining rule gaps. A passing lint command alone does not demonstrate migration parity.

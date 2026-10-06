# Language profiles

Install system tools through devenv and language packages through the project's locked package manager. Select profiles for languages actually maintained by the project.

| Language | Format          | Non-mutating format check | Lint / validation                                                               |
| -------- | --------------- | ------------------------- | ------------------------------------------------------------------------------- |
| JS/TS    | Oxfmt           | `oxfmt --check .`         | Oxlint, separate TS check                                                       |
| Python   | `ruff format`   | `ruff format --check`     | `ruff check`; preserve an existing type checker                                 |
| Shell    | `shfmt -i 2 -w` | `shfmt -i 2 -d`           | ShellCheck and relevant shell syntax check                                      |
| Nix      | nixfmt          | `nixfmt --check`          | relevant evaluation/build checks; optional statix/deadnix only when appropriate |
| YAML     | yamlfmt         | `yamlfmt -lint`           | schema validation where a schema exists                                         |
| Lua      | StyLua          | `stylua --check`          | preserve or select a compatible Lua checker when needed                         |
| Rust     | `cargo fmt`     | `cargo fmt --check`       | `cargo clippy --locked --all-targets -- -D warnings`                            |

Validate flags against the pinned tool version. For other languages use their established tools, not an unrelated formatter. Exclude vendored/generated files and apply rules only to maintained sources.

For Next.js generate framework types before `tsc --noEmit` where required. Vue uses `vue-tsc`; TS project references may require `tsc -b` and deliberate output handling. Check JavaScript with TypeScript's `allowJs`/`checkJs` if the project chooses typed JS. Oxlint type-aware linting is optional and is not a replacement for the project's full type check.

Common new JS/TS commands: `format` writes, `format:check` checks, `lint` fails on warnings where supported, `lint:fix` fixes, `typecheck` checks types, `check` combines relevant gates. Framework plugins and monorepo boundary rules are opt-in adaptations, not universal presets.

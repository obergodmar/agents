# A fork that remains easy to rebase

Identify the upstream remote, its default branch, and the actual selected base. They can differ: a port may deliberately follow a development branch. Record the choice and base revision in the fork's NixOS documentation; never silently switch it to `main` or `master`.

Prefer additive `flake.nix`, `flake.lock`, `nix/`, and focused documentation. Keep edits to busy upstream files small; avoid mass formatting, dependency upgrades, renamed application directories, duplicated source trees, or regenerated files unrelated to the native build. Reuse upstream locks and assets rather than maintaining a second application manifest.

Separate commits by purpose when authorized to commit: platform-neutral runtime compatibility, Nix packaging/module/tests, and any independent feature work. Record why each upstream edit is necessary and when it can be removed. The goal is a small understandable patch surface, not a fixed commit count. Build-time patches still incur maintenance and do not guarantee conflict-free updates.

## Updating an existing port

When an upstream refresh is requested:

- Inspect worktree status, local/published commits, the old upstream base, and the target upstream revision. Preserve user changes; do not reset or stash them automatically.
- Fetch the selected upstream branch within the authorized operation. Use a separate worktree or temporary branch for an uncertain rebase; record a recovery ref before rewriting the port branch.
- Rebase the port's own patch series onto the selected target. Use an explicit old base when ordinary rebase would replay unrelated upstream history. Do not merge upstream just to bypass conflicts or rewrite the user's published branch without authorization.
- Resolve conflicts by retaining the new upstream behavior plus the smallest required compatibility seam. Remove patches upstream has incorporated. Inspect installer changes, new dependencies, frontend outputs, writable paths, and process startup even when Git reports no conflict.
- Update dependency hashes only when their inputs changed; avoid an unrelated nixpkgs/lock refresh. Re-run package and VM checks and review the diff against the new base and `git range-diff` against the previous patch series.
- Advance consumer lockfiles/pins only when requested. A published branch rewrite requires explicit authorization and an appropriate lease check; neither port creation nor local rebase testing authorizes a force push.

Record tested upstream/nixpkgs revisions, remaining patches, and known limits. Prefer contributing generally useful path/configuration fixes upstream when the user requests it; preparing or submitting an upstream PR is a separate operation.

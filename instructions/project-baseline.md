# Shared working agreements

- Use the project's activated direnv/devenv environment for local tools. Nix owns runtimes and system tools; the project's package manager owns application dependencies and lockfiles. Do not install global CLIs or download tools ad hoc.
- Preserve the existing package manager and accepted versions. New JS/TS projects default to pnpm, Oxfmt, Oxlint, TypeScript checks, and 2-space indentation.
- Every project has an EditorConfig consistent with its language-specific formatters. Use project-defined quality commands; keep check modes non-mutating and separate from fixes and deployment.
- Apply the relevant installed skill when adding or changing development tooling, quality gates, or deployment. Routine product work follows the established project commands without reconfiguring the toolchain.
- Implement already selected technical standards independently. Discuss new hosting providers, databases, persistence strategies, application boundaries, or material architecture changes with the user; preserve previously accepted decisions.
- For personal-host deployment, use only the infrastructure checkout explicitly selected by the user. Never infer an authoritative checkout from its folder name, a sibling repository, a symlink, or a conventional home path.
- Keep product-specific architecture, behavior, exceptions, and deployment decisions in this project's instructions or ADRs. Scope operational actions to the user's request; tool setup does not authorize production activation or disk provisioning.

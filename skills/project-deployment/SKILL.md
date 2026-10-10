---
name: project-deployment
description: Configure CI/CD for Vercel with GitHub or a user-selected personal Nix infrastructure checkout. Use for deployment setup or changes, including server flakes and provisioning; preserve the user's provider and database decisions.
---

# Deployment

Read project instructions, accepted ADRs, runtime constraints, state requirements, and existing release commands. Preserve a previously selected provider/database. If no target is selected, present the relevant tradeoffs and ask before implementing provider-specific architecture. Do not assume that all projects need both targets.

- Vercel/GitHub: read [references/vercel.md](references/vercel.md). Neon is an option when PostgreSQL is selected, never a reason to introduce a database.
- Personal host/Nix: read [references/nix-host.md](references/nix-host.md). For a native port of Docker/Compose or traditionally installed upstream software, use the available `nixos-porting` skill before deployment integration. The user must explicitly identify the infrastructure checkout for this operation before infrastructure files are read or changed. Never guess it from a folder name or conventional home path. Independent application packaging can proceed while this information is pending.
- New host installation: additionally read [references/provisioning.md](references/provisioning.md). Installation is distinct from deploying the application.

If a relevant Vercel/GitHub skill or connector is available, use it for supported provider operations. Do not require an unavailable skill, connector, account, or globally installed CLI. Keep this workflow usable with repository configuration and Nix-provided tools.

Record selected architecture, runtime/state boundaries, quality gates, migration order, deployment target, and rollback limits in the project's own instructions/ADR. Infrastructure inventory and private topology remain in the explicitly selected infrastructure repository, not reusable skills or public application configuration.

Prepare and validate configuration before live operations. Reuse authorization already given for a specific deployment; setup alone does not authorize production activation, DNS changes, database mutation, or destructive provisioning. Report packaging/build checks separately from live readiness and external configuration verification.

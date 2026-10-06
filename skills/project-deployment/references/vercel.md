# Vercel and GitHub

## Fit and decisions

Check the project's framework, runtime, request-duration needs, sockets/background tasks, local state, and build outputs against current Vercel capabilities. Long-lived servers may need another target; do not rewrite the product into Functions without an accepted architecture decision.

Preserve an existing database. If PostgreSQL is chosen and hosted storage is desired, offer Neon. Local files and Function memory are not persistent application storage. Use separate development, Preview, and Production data. Neon branches may contain copied production data; choose an empty/sanitized database when isolation also requires data privacy.

## Pipeline

Prefer native Git integration when it satisfies the requirements. Configure project root, framework, actual production branch, engine/package-manager versions, frozen install, build outputs, and server-only environment variables. Vercel provides its managed runtime; local Nix remains the development toolchain. Never copy credentials into vercel.json or client-prefixed variables.

For GitHub Actions, use the same quality commands via pinned Nix/devenv. Decide what blocks production: checks inside the deployment build, configured Vercel Deployment Checks, or an explicit deployment workflow. A CI workflow running beside native Git deployment does not automatically block promotion. Do not enable two independent publishers.

If Actions owns deployment, supply its Vercel CLI through Nix or a locked project dependency. Configure environment-specific pull/build/deploy commands using current official docs. Restrict secrets and write permissions to trusted publication jobs; untrusted PR checks remain credential-free.

Keep quality checks non-mutating/offline where practical. Migration and external service registration are separate credentialed stages. Use additive, idempotent migrations with concurrency control, and account for old/new application overlap. A failed app deployment does not roll back a database migration. Run production-only webhook registration against the stable URL; previews must never replace production integrations.

## Verification

Check frozen install, quality gates, build output, preview isolation, required environment settings, and the real deployed HTTP/API endpoints. Document rollback compatibility with database schema. Missing account access means configuration is prepared, not that the provider is configured.

Consult current primary sources before applying changing platform settings:

- [Git integration](https://vercel.com/docs/git/vercel-for-github)
- [Deployment checks](https://vercel.com/docs/deployment-checks)
- [GitHub Actions deployment](https://vercel.com/kb/guide/how-can-i-use-github-actions-with-vercel)
- [Neon integration](https://neon.com/docs/guides/vercel)

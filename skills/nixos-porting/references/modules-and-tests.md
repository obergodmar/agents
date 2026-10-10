# Modules, consumer integration, and validation

## Module contract

Export `nixosModules.<application>` and `nixosModules.default`. Keep the module disabled by default and imports free of host-specific configuration. Expose typed options for `enable`, `package`, listen address/port, state location, non-secret settings, and required runtime credentials. Add companion-service or protocol options only where the runtime needs them. Package overrides must work without editing application source.

Separate application dependencies from host dependencies. Kernel modules must match the consumer's kernel; let its package set or overlays supply protocol tools and kernel/userspace implementations. Do not pin host drivers inside an otherwise portable application package.

Render declarative non-secret settings using a suitable `pkgs.formats` generator. Explain which settings override UI edits and which remain mutable. Pass passwords/keys through runtime files and systemd credentials or the consumer's existing secret manager. Secret contents must not enter Nix expressions, generated store files, or build inputs; document that runtime paths must be strings rather than secret file literals copied into the store.

Initialization must be repeatable and preserve existing accounts, data, and omitted settings. Separate first-run bootstrap credentials from password rotation. Do not overwrite existing state or automatically perform destructive schema migrations during every restart. If migration is necessary, document its ordering, backup needs, and rollback limits.

Use systemd state/runtime directories and explicit ownership/modes. Choose an unprivileged user where supported; derive capabilities, device access, writable paths, and sandboxing from actual features. Network administration and userspace tunnel devices need different permissions from an ordinary web service. Do not blindly copy WGDashboard's root user or hardening settings. Firewall exposure and startup side effects must be explicit options; preserve the agreed listen/exposure policy.

For a multi-service stack, replace Compose orchestration with appropriate units and existing NixOS services. Ordering alone does not guarantee database readiness; use supported readiness/retry behavior. Keep database/provider changes user-owned.

## Consumer interface

Document a generic input/import example, adapted to the fork and branch selected by the user:

```nix
{
  inputs.application = {
    url = "github:OWNER/REPOSITORY/NIXOS_BRANCH";
    inputs.nixpkgs.follows = "nixpkgs";
  };
  # In the existing host's module list:
  # inputs.application.nixosModules.default
  # In a host module:
  # services.application.enable = true;
}
```

The consumer lockfile pins a revision even when the URL names a branch. Explain package/option overrides and supported nixpkgs versions. Using `follows` aligns the package set but can expose incompatibilities with the consumer's revision; validate against it. Keep addresses, secret provisioning, proxy configuration, and host inventory in the explicitly selected infrastructure checkout.

## Evidence

Expose package and meaningful NixOS VM checks under `checks.<system>`. Use [NixOS tests](https://nixos.org/manual/nixos/stable/#sec-nixos-tests) to exercise the installed system, not a development shell.

1. Generate the lockfile; make newly added flake sources visible to Git-backed Nix evaluation. Review staged scope without committing unrelated files.
2. Evaluate exported packages/modules and run `nix flake check --no-build`. [Evaluation checks](https://nix.dev/manual/nix/latest/command-ref/new-cli/nix3-flake-check) do not execute the VM test.
3. Build `nix build .#<application>` with package checks enabled. Verify the installed launcher and assets outside the source directory, using fresh temporary state.
4. Build the VM check, for example `nix build .#checks.x86_64-linux.nixos-module`. Test first boot, existing state, restart persistence, configuration reconciliation, authentication where applicable, and defining application features. For network/privileged software, exercise actual devices or interfaces inside the isolated VM.
5. Evaluate disabled-module behavior and important invalid configurations. Validate package overrides, companion services, and the consumer's package set when relevant.

Use synthetic test credentials only. Do not touch production state or host networking for a packaging test. Declare architecture coverage accurately: exporting an aarch64 package or evaluating it is not an aarch64 runtime test. If KVM, builds, network access, or a platform are unavailable, record the missing evidence and runnable commands.

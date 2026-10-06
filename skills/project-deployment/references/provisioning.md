# Provisioning is not application deployment

Only provision when the user requests host installation. Obtain the selected infrastructure checkout, exact host, SSH endpoint, disk device, boot mode, and existing-data expectations. Inspect evaluated host configuration and the checkout's helper scripts before constructing commands.

`nix-anywhere-disko` may destroy/format disks; `nix-anywhere-install` installs the selected system. Names are local conventions, not guaranteed APIs. Verify their actual semantics and supported flags. Present the concrete disk/host effect before destructive execution unless the user's existing authorization already covers that exact target and effect.

Follow the selected repository's disko layout, network/installer prerequisites, agenix recipient setup, host SSH identity, and root-access policy. Encrypted hosts may need temporary LUKS material and a separate initrd SSH identity; unencrypted hosts do not. Never reuse the initrd and regular host keys or put keys in Git, logs, process arguments, or the Nix store.

Prepare recovery access and required firewall ports before reboot/installation. Check installer reachability after kexec, if used. Distinguish a temporary installer boot from disk repartitioning. Preserve existing system/Home Manager state versions; choose a suitable initial version only for genuinely new hosts.

After install, verify SSH identity, secret decryption, networking, and a focused service smoke test. Later application updates use host deployment or the accepted artifact pipeline, not disk provisioning.

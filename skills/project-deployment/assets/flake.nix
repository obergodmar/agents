# Adapt supported systems and implement every imported file before use.
{
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];
      forSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      packages = forSystems (system: {
        default = nixpkgs.legacyPackages.${system}.callPackage ./nix/package.nix { };
      });
      nixosModules.default = import ./nix/module.nix { inherit self; };
      checks = forSystems (system: {
        package = self.packages.${system}.default;
      });
    };
}

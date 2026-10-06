{ pkgs, lib, ... }:
let
  packageJson = builtins.fromJSON (builtins.readFile ./package.json);
  entries = map (name: {
    name = "agents-${builtins.replaceStrings [ ":" "/" " " ] [ "-" "-" "-" ] name}";
    value.exec = "exec pnpm run ${lib.escapeShellArg name} \"$@\"";
  }) (builtins.attrNames packageJson.scripts);
  generated = builtins.listToAttrs entries;
  extra = {
    agents-install.exec = "exec pnpm install --frozen-lockfile";
  };
in
assert builtins.length entries == builtins.length (builtins.attrNames generated);
assert builtins.all (name: !(builtins.hasAttr name extra)) (builtins.attrNames generated);
{
  packages = [
    pkgs.git
    pkgs.nixfmt
    pkgs.yamlfmt
    (pkgs.python3.withPackages (ps: [ ps.pyyaml ]))
  ];
  languages.javascript = {
    enable = true;
    package = pkgs.nodejs_24;
    pnpm.enable = true;
  };
  env = {
    NPM_CONFIG_IGNORE_SCRIPTS = "true";
    PNPM_CONFIG_IGNORE_SCRIPTS = "true";
  };
  scripts = generated // extra;
}

{
  lib,
  packageJson,
  prefix,
  manager ? "pnpm",
  customScripts ? { },
}:
let
  normalize = name: builtins.replaceStrings [ ":" "/" " " ] [ "-" "-" "-" ] name;
  entries = map (name: {
    name = "${prefix}-${normalize name}";
    value.exec =
      if manager == "npm" then
        "exec npm run ${lib.escapeShellArg name} -- \"$@\""
      else
        "exec pnpm run ${lib.escapeShellArg name} \"$@\"";
  }) (builtins.attrNames (packageJson.scripts or { }));
  generated = builtins.listToAttrs entries;
in
assert builtins.match "[a-z][a-z0-9-]*" prefix != null;
assert builtins.elem manager [
  "npm"
  "pnpm"
];
assert builtins.length entries == builtins.length (builtins.attrNames generated);
assert builtins.all (name: !(builtins.hasAttr name customScripts)) (builtins.attrNames generated);
generated // customScripts

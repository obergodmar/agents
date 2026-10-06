import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Inline the template so pure evaluation needs neither filesystem access nor nixpkgs.
const prefix = `let
  lib.escapeShellArg = s: "'" + builtins.replaceStrings [ "'" ] [ "'\\\\''" ] s + "'";
  mk = (${readFileSync('skills/devenv-workflow/assets/package-scripts.nix', 'utf8')});
in `;
/** @param {string} expression */
function evaluate(expression) {
  const result = spawnSync('nix', ['eval', '--json', '--expr', prefix + expression], {
    encoding: 'utf8',
  });
  if (result.error) throw result.error;
  return result;
}
const normal = evaluate(
  'mk { inherit lib; prefix = "app"; packageJson.scripts."test:unit" = "node --test"; }',
);
assert.equal(normal.status, 0, normal.stderr);
assert.match(JSON.parse(normal.stdout)['app-test-unit'].exec, /pnpm run.*"\$@"/);
const npm = evaluate(
  'mk { inherit lib; prefix = "app"; manager = "npm"; packageJson.scripts.test = "node --test"; }',
);
assert.equal(npm.status, 0, npm.stderr);
assert.match(JSON.parse(npm.stdout)['app-test'].exec, / -- "\$@"/);
for (const expression of [
  'mk { inherit lib; prefix = "app"; packageJson.scripts = { "a:b" = "one"; "a-b" = "two"; }; }',
  'mk { inherit lib; prefix = "app"; packageJson.scripts.test = "one"; customScripts.app-test.exec = "two"; }',
  'mk { inherit lib; prefix = "bad prefix"; packageJson = {}; }',
]) {
  const failed = evaluate(expression);
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /assertion/);
}
console.log('Nix wrapper normalization, argument forwarding, and collision guards passed');

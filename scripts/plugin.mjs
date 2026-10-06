import assert from 'node:assert/strict';
import { lstatSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** @param {string} root */
export function pluginManifest(root) {
  const manifest = JSON.parse(readFileSync(join(root, 'plugin.json'), 'utf8'));
  assert.equal(manifest.$schema, 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json');
  assert.match(manifest.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.match(manifest.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  assert.ok(manifest.description?.trim());
  assert.ok(!manifest.hooks && !manifest.mcpServers, 'This plugin bundles skills only');
  return manifest;
}

/** @param {string} root */
export function pluginFiles(root) {
  /** @type {string[]} */
  const files = [];
  /** @param {string} relative */
  const walk = (relative) => {
    const path = join(root, relative);
    const stat = lstatSync(path);
    assert.ok(!stat.isSymbolicLink(), `Symlink in plugin payload: ${relative}`);
    if (stat.isDirectory()) {
      for (const name of readdirSync(path).sort()) walk(`${relative}/${name}`);
    } else {
      assert.ok(stat.isFile(), `Unsupported payload file: ${relative}`);
      files.push(relative);
    }
  };
  for (const path of ['plugin.json', 'skills', 'instructions', 'README.md']) walk(path);
  return files.sort();
}

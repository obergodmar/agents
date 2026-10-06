import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { pluginFiles, pluginManifest } from './plugin.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const plugin = pluginManifest(root);
pluginFiles(root);
const catalog = JSON.parse(readFileSync(join(root, '.agents/plugins/marketplace.json'), 'utf8'));
assert.equal(catalog.name, plugin.name);
assert.equal(catalog.plugins.length, 1);
assert.equal(catalog.plugins[0].name, plugin.name);
assert.deepEqual(catalog.plugins[0].source, { source: 'local', path: './' });
assert.equal(catalog.plugins[0].policy.installation, 'AVAILABLE');
assert.equal(catalog.plugins[0].policy.authentication, 'ON_USE');
assert.equal(catalog.plugins[0].category, 'Productivity');
assert.equal(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).private, true);
/** @type {string[]} */
const yamlFiles = [];
/** @param {string} folder */
function validate(folder) {
  for (const entry of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink in payload: ${path}`);
    if (entry.isDirectory()) {
      validate(path);
      continue;
    }
    const text = readFileSync(path, 'utf8');
    if (/\.ya?ml$/.test(entry.name) || entry.name === 'SKILL.md') yamlFiles.push(path);
    if (/nixos-copy-\d|~\/nixos|\/home\/[\w-]+\/Code/.test(text))
      throw new Error(`Personal checkout path: ${path}`);
    if (entry.name.endsWith('.json')) JSON.parse(text);
    if (!entry.name.endsWith('.md')) continue;
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      const link = match[1];
      if (/^https?:\/\//.test(link) || link.startsWith('#')) continue;
      if (!existsSync(resolve(dirname(path), link.split('#')[0])))
        throw new Error(`Broken link ${link} in ${path}`);
    }
  }
}

validate(join(root, 'skills'));
validate(join(root, 'instructions'));
yamlFiles.push(join(root, 'devenv.yaml'), join(root, 'pnpm-workspace.yaml'));
const yaml = spawnSync(
  'python3',
  [
    '-c',
    `
import sys, yaml
from pathlib import Path
for name in sys.argv[1:]:
    text = Path(name).read_text()
    if name.endswith('SKILL.md'):
        text = text.split('---', 2)[1]
    data = yaml.safe_load(text)
    if not isinstance(data, dict):
        raise ValueError(f'{name}: expected a YAML mapping')
`,
    ...yamlFiles,
  ],
  { encoding: 'utf8' },
);
if (yaml.error) throw yaml.error;
if (yaml.status !== 0) throw new Error(yaml.stderr);
for (const name of readdirSync(join(root, 'skills'))) {
  const folder = join(root, 'skills', name);
  const text = readFileSync(join(folder, 'SKILL.md'), 'utf8');
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) ||
    name.length > 64 ||
    !text.startsWith(`---\nname: ${name}\ndescription: `) ||
    !/^---$/m.test(text.slice(4)) ||
    /\[TODO/.test(text)
  )
    throw new Error(`Invalid skill manifest: ${name}`);
  if (!existsSync(join(folder, 'agents/openai.yaml')))
    throw new Error(`Missing Codex metadata: ${name}`);
}
console.log('Plugin, marketplace, skills, metadata, links, and portability checks passed');

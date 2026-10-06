import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { pluginFiles, pluginManifest } from '../scripts/plugin.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

test('plugin ZIP contains self-contained skills and excludes development and installation tooling', () => {
  const output = mkdtempSync(join(tmpdir(), 'agent-plugin-'));
  try {
    execFileSync(process.execPath, [join(root, 'scripts/pack.mjs'), output]);
    const manifest = pluginManifest(root);
    const archive = join(output, `${manifest.name}-${manifest.version}.zip`);
    const inspect = JSON.parse(
      execFileSync(
        'python3',
        [
          '-c',
          'import sys,json,zipfile; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({"files":z.namelist(),"manifest":json.loads(z.read("plugin.json"))})); assert z.testzip() is None',
          archive,
        ],
        { encoding: 'utf8' },
      ),
    );
    assert.deepEqual(inspect.files, pluginFiles(root));
    assert.deepEqual(inspect.manifest, manifest);
    assert.ok(inspect.files.some(/** @param {string} name */ (name) => name.endsWith('/SKILL.md')));
    assert.ok(
      !inspect.files.some(
        /** @param {string} name */ (name) =>
          /^(scripts|tests|node_modules|\.github|\.agents)\//.test(name) || name === 'package.json',
      ),
    );
    const first = readFileSync(archive);
    execFileSync(process.execPath, [join(root, 'scripts/pack.mjs'), output]);
    assert.deepEqual(readFileSync(archive), first);
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});

test('packaging rejects payload symlinks before collecting files outside the plugin', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'agent-plugin-fixture-'));
  try {
    writeFileSync(join(fixture, 'plugin.json'), '{}');
    writeFileSync(join(fixture, 'README.md'), 'Fixture');
    mkdirSync(join(fixture, 'instructions'));
    mkdirSync(join(fixture, 'skills'));
    symlinkSync('/etc', join(fixture, 'skills/outside'));
    assert.throws(() => pluginFiles(fixture), /Symlink/);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});

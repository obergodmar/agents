import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const source = resolve(dirname(fileURLToPath(import.meta.url)), '..');
test('packed package installs without dependencies or access to the source checkout', () => {
  const temporary = mkdtempSync(join(tmpdir(), 'agent-workflows-package-'));
  try {
    const pack = spawnSync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', temporary],
      {
        cwd: source,
        encoding: 'utf8',
      },
    );
    assert.equal(pack.status, 0, pack.stderr);
    const metadata = JSON.parse(pack.stdout)[0];
    const names = metadata.files.map(/** @param {{path: string}} file */ (file) => file.path);
    assert.ok(names.includes('scripts/cli.mjs'));
    assert.ok(names.includes('instructions/project-baseline.md'));
    assert.ok(names.some(/** @param {string} name */ (name) => name.endsWith('/SKILL.md')));
    assert.ok(
      names.every(
        /** @param {string} name */ (name) =>
          ['package.json', 'README.md', 'scripts/cli.mjs'].includes(name) ||
          name.startsWith('skills/') ||
          name.startsWith('instructions/'),
      ),
    );
    const extract = spawnSync(
      'tar',
      ['-xzf', join(temporary, metadata.filename), '-C', temporary],
      { encoding: 'utf8' },
    );
    assert.equal(extract.status, 0, extract.stderr);
    const consumer = join(temporary, 'consumer');
    mkdirSync(consumer);
    const cli = join(temporary, 'package/scripts/cli.mjs');
    const bin = join(temporary, 'agent-workflows');
    symlinkSync(cli, bin);
    for (const command of ['install', 'doctor', 'update', 'remove']) {
      const result = spawnSync(process.execPath, [bin, command, '--target', consumer], {
        cwd: consumer,
        encoding: 'utf8',
      });
      assert.equal(result.status, 0, result.stderr);
      if (command === 'install') {
        assert.ok(!existsSync(join(consumer, 'node_modules')));
        const manifest = JSON.parse(
          readFileSync(join(consumer, '.agents/agent-workflows.json'), 'utf8'),
        );
        assert.equal(manifest.version, metadata.version);
      }
    }
    assert.ok(!existsSync(join(consumer, '.agents/agent-workflows.json')));
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
});

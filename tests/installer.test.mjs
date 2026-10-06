import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  existsSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { run } from '../scripts/cli.mjs';

/** @param {(root: string) => void} work */
function fixture(work) {
  const root = mkdtempSync(join(tmpdir(), 'agent-workflows-'));
  try {
    work(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
const skill = '.agents/skills/devenv-workflow/SKILL.md';
const manifest = '.agents/agent-workflows.json';

test('managed instructions survive Oxfmt in projects with 2-space and 4-space styles', () =>
  fixture((root) => {
    run('install', root);
    const path = join(root, 'AGENTS.md');
    for (const tabWidth of [2, 4]) {
      writeFileSync(join(root, '.oxfmtrc.json'), JSON.stringify({ tabWidth }));
      const formatted = execFileSync('oxfmt', ['--stdin-filepath', path], {
        cwd: root,
        input: readFileSync(path, 'utf8'),
        encoding: 'utf8',
      });
      writeFileSync(path, formatted);
      assert.match(run('doctor', root), /verified/);
      run('update', root);
    }
  }));

test('updates remove retired owned files and preserve unmanaged additions', () =>
  fixture((root) => {
    run('install', root);
    const retired = '.agents/skills/devenv-workflow/retired.md';
    const content = 'old package content';
    writeFileSync(join(root, retired), content);
    const data = JSON.parse(readFileSync(join(root, manifest), 'utf8'));
    data.version = '0.0.1';
    data.files[retired] = createHash('sha256').update(content).digest('hex');
    writeFileSync(join(root, manifest), JSON.stringify(data));
    const custom = '.agents/skills/devenv-workflow/local.md';
    writeFileSync(join(root, custom), 'unmanaged extension');
    run('update', root);
    assert.ok(!existsSync(join(root, retired)));
    assert.equal(readFileSync(join(root, custom), 'utf8'), 'unmanaged extension');
    assert.match(run('doctor', root), /0.1.0/);
  }));

test('installs all skills before node_modules exists and preserves project instructions', () =>
  fixture((root) => {
    writeFileSync(join(root, 'AGENTS.md'), '# Product\nKeep accepted architecture.\n');
    assert.match(run('install', root), /3 skills/);
    assert.ok(existsSync(join(root, skill)));
    assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /^# Product/);
    assert.match(run('doctor', root), /verified/);
    assert.match(run('update', root), /3 skills/);
    assert.equal(
      readFileSync(join(root, 'AGENTS.md'), 'utf8').split('agent-workflows:begin').length,
      2,
    );
    writeFileSync(join(root, '.agents/custom.md'), 'project-owned');
    run('remove', root);
    assert.equal(readFileSync(join(root, '.agents/custom.md'), 'utf8'), 'project-owned');
    assert.match(readFileSync(join(root, 'AGENTS.md'), 'utf8'), /^# Product/);
    assert.ok(!existsSync(join(root, skill)));
    assert.ok(!existsSync(join(root, manifest)));
  }));

test('idempotent install and cleanup of installer-created AGENTS.md', () =>
  fixture((root) => {
    run('install', root);
    const before = readFileSync(join(root, 'AGENTS.md'), 'utf8');
    run('install', root);
    assert.equal(readFileSync(join(root, 'AGENTS.md'), 'utf8'), before);
    run('remove', root);
    assert.ok(!existsSync(join(root, 'AGENTS.md')));
  }));

test('refuses changed managed files before modifying any installation content', () =>
  fixture((root) => {
    run('install', root);
    const before = readFileSync(join(root, manifest));
    writeFileSync(join(root, skill), 'local customization');
    for (const command of ['update', 'remove', 'doctor']) {
      assert.throws(() => run(command, root), /modified/);
      assert.deepEqual(readFileSync(join(root, manifest)), before);
    }
  }));

test('preserves edits outside owned AGENTS block, rejects edits inside it', () =>
  fixture((root) => {
    run('install', root);
    const path = join(root, 'AGENTS.md');
    writeFileSync(path, readFileSync(path, 'utf8') + '\nProduct-local rule.\n');
    run('update', root);
    assert.match(readFileSync(path, 'utf8'), /Product-local rule/);
    writeFileSync(path, readFileSync(path, 'utf8').replace('Before working', 'Changed rule'));
    assert.throws(() => run('update', root), /block/);
  }));

test('rejects unmanaged collisions with no partial install', () =>
  fixture((root) => {
    mkdirSync(join(root, '.agents/skills/project-quality'), { recursive: true });
    writeFileSync(join(root, '.agents/skills/project-quality/SKILL.md'), 'unmanaged');
    assert.throws(() => run('install', root), /Unmanaged/);
    assert.ok(!existsSync(join(root, skill)));
    assert.ok(!existsSync(join(root, 'AGENTS.md')));
  }));

test('rejects symlinks, including dangling ones, in managed destination paths', () =>
  fixture((root) => {
    symlinkSync(join(root, 'missing'), join(root, '.agents'));
    assert.throws(() => run('install', root), /Symlink/);
    assert.ok(!existsSync(join(root, 'AGENTS.md')));
  }));

test('rejects escaping ownership entries without touching outside files', () =>
  fixture((root) => {
    run('install', root);
    const data = JSON.parse(readFileSync(join(root, manifest), 'utf8'));
    data.files['.agents/skills/example/../../outside'] = 'a'.repeat(64);
    writeFileSync(join(root, manifest), JSON.stringify(data));
    assert.throws(() => run('remove', root), /Invalid ownership/);
    assert.ok(existsSync(join(root, skill)));
  }));

test('requires existing installation for update and rejects unknown commands', () =>
  fixture((root) => {
    assert.throws(() => run('update', root), /No installation/);
    assert.throws(() => run('unknown', root), /Unknown command/);
  }));

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { releaseIdentity } from '../scripts/release-check.mjs';
import { pushedCommits } from '../scripts/release-plan.mjs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const sha = 'a'.repeat(40);
const context = {
  GITHUB_EVENT_NAME: 'push',
  GITHUB_REPOSITORY: 'obergodmar/agents',
  GITHUB_REF: 'refs/heads/master',
  GITHUB_SHA: sha,
  GITHUB_RUN_NUMBER: '12',
  GITHUB_RUN_ATTEMPT: '1',
  PACKAGE_COMMIT_SHA: sha,
  PACKAGE_COMMIT_ORDER: '2',
};

test('master versions are unique across commits and reruns without mutating source metadata', () => {
  const first = releaseIdentity(pkg, context);
  assert.equal(first.version, `${pkg.version}-master.12.2.1.g${sha.slice(0, 12)}`);
  assert.equal(first.tag, 'master');
  const retry = releaseIdentity(pkg, { ...context, GITHUB_RUN_ATTEMPT: '2' });
  assert.notEqual(first.version, retry.version);
  const intermediate = releaseIdentity(pkg, { ...context, PACKAGE_COMMIT_SHA: 'b'.repeat(40) });
  assert.notEqual(first.version, intermediate.version);
  assert.equal(intermediate.tag, 'commits');
  assert.equal(
    pkg.version,
    JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version,
  );
});

test('stable tags use latest, and mismatched tags, scopes, and PRs cannot publish', () => {
  const stable = releaseIdentity(pkg, { ...context, GITHUB_REF: `refs/tags/v${pkg.version}` });
  assert.equal(stable.version, pkg.version);
  assert.equal(stable.tag, 'latest');
  for (const changes of [
    { GITHUB_REF: 'refs/tags/v9.9.9' },
    { GITHUB_REF: 'refs/heads/feature' },
    { GITHUB_EVENT_NAME: 'pull_request' },
    { GITHUB_REPOSITORY: 'another/agents' },
    { GITHUB_RUN_ATTEMPT: '0' },
    { PACKAGE_COMMIT_SHA: 'not-a-sha' },
  ])
    assert.throws(() => releaseIdentity(pkg, { ...context, ...changes }));
});

test('publisher stamps the archive version and exact commit in an isolated CI checkout', () => {
  const root = mkdtempSync(join(tmpdir(), 'agent-release-'));
  try {
    writeFileSync(join(root, 'package.json'), JSON.stringify(pkg));
    const output = join(root, 'output');
    execFileSync(
      process.execPath,
      [new URL('../scripts/release-check.mjs', import.meta.url).pathname],
      {
        cwd: root,
        env: { ...process.env, ...context, GITHUB_OUTPUT: output },
      },
    );
    const stamped = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    assert.equal(stamped.version, releaseIdentity(pkg, context).version);
    assert.equal(stamped.gitHead, sha);
    assert.match(readFileSync(output, 'utf8'), /dist-tag=master/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('batch pushes include all new commits; initial pushes and tags are handled explicitly', () => {
  const root = mkdtempSync(join(tmpdir(), 'agent-release-plan-'));
  /** @param {string[]} args */
  const git = (args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  /** @param {string} message */
  const commit = (message) => {
    git([
      '-c',
      'user.name=Fixture',
      '-c',
      'user.email=fixture@example.invalid',
      '-c',
      'commit.gpgsign=false',
      '-c',
      'core.hooksPath=/dev/null',
      'commit',
      '--allow-empty',
      '-m',
      message,
    ]);
    return git(['rev-parse', 'HEAD']);
  };
  try {
    git(['init', '-b', 'master']);
    const first = commit('first');
    const second = commit('second');
    const third = commit('third');
    assert.deepEqual(
      pushedCommits(first, third, 'refs/heads/master', root).include.map((item) => item.sha),
      [second, third],
    );
    assert.equal(pushedCommits('0'.repeat(40), third, 'refs/heads/master', root).include.length, 3);
    assert.deepEqual(pushedCommits('0'.repeat(40), third, 'refs/tags/v0.1.0', root).include, [
      { sha: third, order: 1 },
    ]);
    assert.deepEqual(pushedCommits(third, first, 'refs/heads/master', root).include, [
      { sha: first, order: 1 },
    ]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

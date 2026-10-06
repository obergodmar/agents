import assert from 'node:assert/strict';
import { appendFileSync, readFileSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @param {string} before @param {string} after @param {string} ref @param {string} cwd */
export function pushedCommits(before, after, ref, cwd) {
  assert.match(before, /^[a-f0-9]{40}$/);
  assert.match(after, /^[a-f0-9]{40}$/);
  assert.notEqual(after, '0'.repeat(40), 'Deleted refs cannot publish');
  assert.ok(
    ref === 'refs/heads/master' || ref.startsWith('refs/tags/v'),
    'Unsupported publication ref',
  );
  const revision = before === '0'.repeat(40) ? after : `${before}..${after}`;
  const args =
    ref === 'refs/heads/master'
      ? ['rev-list', '--topo-order', '--reverse', revision]
      : ['rev-parse', `${after}^{commit}`];
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  if (result.error) throw result.error;
  assert.equal(result.status, 0, result.stderr);
  const commits = result.stdout.trim().split('\n').filter(Boolean);
  if (!commits.length) commits.push(after);
  assert.ok(
    commits.length <= 256,
    'Push exceeds the GitHub matrix limit of 256 commits; publish smaller batches',
  );
  return { include: commits.map((sha, index) => ({ sha, order: index + 1 })) };
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === fileURLToPath(import.meta.url)) {
  assert.ok(process.env.GITHUB_EVENT_PATH && process.env.GITHUB_OUTPUT);
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const matrix = pushedCommits(event.before, event.after, event.ref, process.cwd());
  appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${JSON.stringify(matrix)}\n`);
  console.log(`Selected ${matrix.include.length} commits for publication`);
}

import assert from 'node:assert/strict';
import { appendFileSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** @typedef {{name: string, version: string, repository?: {url?: string}, publishConfig: {registry: string, access: string}}} Package */
/** @param {Package} pkg @param {Record<string, string | undefined>} env */
export function releaseIdentity(pkg, env) {
  assert.equal(env.GITHUB_EVENT_NAME, 'push', 'Only push events can publish');
  assert.equal(pkg.publishConfig.registry, 'https://npm.pkg.github.com');
  assert.equal(pkg.publishConfig.access, 'restricted');
  const repository = env.GITHUB_REPOSITORY;
  assert.ok(repository, 'GitHub repository identity is required');
  assert.equal(
    pkg.repository?.url,
    `git+https://github.com/${repository}.git`,
    'Package repository must match the workflow repository',
  );
  assert.equal(
    pkg.name.split('/')[0].slice(1).toLowerCase(),
    repository.split('/')[0].toLowerCase(),
    'Package scope must match repository owner',
  );
  assert.match(pkg.name, /^@[a-z0-9-]+\/[a-z0-9-]+$/);
  assert.match(
    pkg.version,
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/,
    'Source version must be stable SemVer',
  );
  const sha = env.PACKAGE_COMMIT_SHA;
  assert.ok(sha && /^[a-f0-9]{40}$/.test(sha), 'A full package commit SHA is required');
  let version = pkg.version;
  let tag = 'latest';
  if (env.GITHUB_REF === 'refs/heads/master') {
    for (const field of ['GITHUB_RUN_NUMBER', 'GITHUB_RUN_ATTEMPT', 'PACKAGE_COMMIT_ORDER']) {
      assert.match(env[field] ?? '', /^[1-9]\d*$/, `${field} must be a positive integer`);
    }
    version += `-master.${env.GITHUB_RUN_NUMBER}.${env.PACKAGE_COMMIT_ORDER}.${env.GITHUB_RUN_ATTEMPT}.g${sha.slice(0, 12)}`;
    tag = sha === env.GITHUB_SHA ? 'master' : 'commits';
  } else {
    assert.equal(
      env.GITHUB_REF,
      `refs/tags/v${pkg.version}`,
      'Release tag must match the source version',
    );
  }
  const archive = `artifacts/${pkg.name.slice(1).replace('/', '-')}-${version}.tgz`;
  return { version, tag, archive, sha };
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === fileURLToPath(import.meta.url)) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  const identity = releaseIdentity(pkg, process.env);
  writeFileSync(
    'package.json',
    `${JSON.stringify({ ...pkg, version: identity.version, gitHead: identity.sha }, null, 2)}\n`,
  );
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `version=${identity.version}\ndist-tag=${identity.tag}\narchive=${identity.archive}\n`,
    );
  }
  console.log(`Prepared ${identity.version} (${identity.tag}) from ${identity.sha}`);
}

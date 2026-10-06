import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
assert.equal(process.env.GITHUB_REF_NAME, `v${pkg.version}`, 'Tag must match package version');
assert.equal(pkg.publishConfig.registry, 'https://npm.pkg.github.com');
assert.equal(pkg.publishConfig.access, 'restricted');
const repository = process.env.GITHUB_REPOSITORY;
assert.ok(repository, 'GitHub repository identity is required');
assert.equal(
  pkg.repository?.url,
  `git+https://github.com/${repository}.git`,
  'Set the actual package repository URL before publication',
);
assert.equal(
  pkg.name.split('/')[0].slice(1).toLowerCase(),
  repository.split('/')[0].toLowerCase(),
  'Package scope must match repository owner',
);
console.log('Private registry, repository linkage, scope, and release tag verified');

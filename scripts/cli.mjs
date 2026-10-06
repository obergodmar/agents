#!/usr/bin/env node
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomUUID } from 'node:crypto';

/** @typedef {{ schemaVersion: 1, version: string, files: Record<string, string>, agentsBlock: string, createdAgents: boolean }} Manifest */
const source = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = '.agents/agent-workflows.json';
const baselinePath = '.agents/instructions/agent-workflows.md';
const begin = '<!-- agent-workflows:begin -->';
const end = '<!-- agent-workflows:end -->';
/** @param {Buffer | string} content */
const hash = (content) => createHash('sha256').update(content).digest('hex');

/** @param {string} root @param {string} relative */
function safePath(root, relative) {
  if (
    !relative ||
    relative
      .split('/')
      .some((part) => !part || part === '.' || part === '..' || part.includes('\\'))
  ) {
    throw new Error(`Unsafe path: ${relative}`);
  }
  let current = root;
  for (const part of relative.split('/')) {
    current = join(current, part);
    // lstat also detects dangling symlinks.
    try {
      if (lstatSync(current).isSymbolicLink()) throw new Error(`Symlink refused: ${relative}`);
    } catch (error) {
      if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
    }
  }
  return current;
}

/** @param {string} root @param {string} relative @param {Record<string, Buffer>} files */
function collect(root, relative, files) {
  for (const entry of readdirSync(join(root, relative), { withFileTypes: true })) {
    const child = `${relative}/${entry.name}`;
    const path = safePath(root, child);
    if (entry.isDirectory()) collect(root, child, files);
    else if (entry.isFile()) files[child] = readFileSync(path);
    else throw new Error(`Unsupported source entry: ${child}`);
  }
}

function bundle() {
  /** @type {Record<string, Buffer>} */
  const collected = {};
  collect(source, 'skills', collected);
  /** @type {Record<string, Buffer>} */
  const files = {};
  for (const [path, bytes] of Object.entries(collected)) files[`.agents/${path}`] = bytes;
  files[baselinePath] = readFileSync(safePath(source, 'instructions/project-baseline.md'));
  const names = readdirSync(join(source, 'skills')).sort();
  for (const name of names) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) || !files[`.agents/skills/${name}/SKILL.md`]) {
      throw new Error(`Invalid source skill: ${name}`);
    }
  }
  if (!names.length) throw new Error('Source contains no skills');
  return {
    files,
    names,
    version: String(JSON.parse(readFileSync(join(source, 'package.json'), 'utf8')).version),
  };
}

/** @param {unknown} value @returns {Manifest} */
function parseManifest(value) {
  if (!value || typeof value !== 'object') throw new Error('Invalid ownership manifest');
  const m = /** @type {Manifest} */ (value);
  if (
    m.schemaVersion !== 1 ||
    typeof m.version !== 'string' ||
    typeof m.createdAgents !== 'boolean' ||
    typeof m.agentsBlock !== 'string' ||
    !m.agentsBlock.startsWith(begin) ||
    !m.agentsBlock.endsWith(end) ||
    !m.files ||
    typeof m.files !== 'object' ||
    Array.isArray(m.files) ||
    !Object.keys(m.files).length
  ) {
    throw new Error('Invalid ownership manifest');
  }
  for (const [path, digest] of Object.entries(m.files)) {
    if (
      path.split('/').some((part) => part === '.' || part === '..') ||
      (path !== baselinePath &&
        !/^\.agents\/skills\/[a-z0-9]+(?:-[a-z0-9]+)*\/(?:[A-Za-z0-9_.-]+\/)*[A-Za-z0-9_.-]+$/.test(
          path,
        )) ||
      typeof digest !== 'string' ||
      !/^[a-f0-9]{64}$/.test(digest)
    ) {
      throw new Error(`Invalid ownership entry: ${path}`);
    }
  }
  return m;
}

/** @param {string} root @param {Manifest} manifest @param {string} agents */
function verify(root, manifest, agents) {
  for (const [relative, digest] of Object.entries(manifest.files)) {
    const path = safePath(root, relative);
    if (!existsSync(path) || hash(readFileSync(path)) !== digest) {
      throw new Error(`Managed file missing or modified: ${relative}`);
    }
  }
  if (
    !agents.includes(manifest.agentsBlock) ||
    agents.split(begin).length !== 2 ||
    agents.split(end).length !== 2
  ) {
    throw new Error('Managed AGENTS.md block missing, duplicated, or modified');
  }
}

/** Apply preflighted changes with per-file atomic replacement and rollback on write errors.
 * @param {string} root @param {Map<string, Buffer | null>} changes
 */
function transact(root, changes) {
  /** @type {Map<string, Buffer | null>} */
  const before = new Map();
  for (const path of changes.keys()) {
    const full = safePath(root, path);
    before.set(path, existsSync(full) ? readFileSync(full) : null);
  }
  /** @type {string[]} */
  const applied = [];
  try {
    for (const [path, bytes] of changes) {
      const full = safePath(root, path);
      applied.push(path);
      if (bytes === null) {
        if (existsSync(full)) unlinkSync(full);
      } else {
        mkdirSync(dirname(full), { recursive: true });
        const temporary = `${full}.${randomUUID()}.tmp`;
        try {
          writeFileSync(temporary, bytes, { flag: 'wx' });
          renameSync(temporary, full);
        } finally {
          if (existsSync(temporary)) unlinkSync(temporary);
        }
      }
    }
  } catch (error) {
    for (const path of applied.reverse()) {
      const full = safePath(root, path);
      const original = before.get(path);
      if (original) writeFileSync(full, original);
      else if (existsSync(full)) unlinkSync(full);
    }
    throw error;
  }
}

/** @param {string} command @param {string} target */
export function run(command, target) {
  if (!['install', 'update', 'doctor', 'remove'].includes(command))
    throw new Error(`Unknown command: ${command}`);
  const root = realpathSync(resolve(target));
  if (!lstatSync(root).isDirectory()) throw new Error('Target must be an existing directory');
  const manifestFile = safePath(root, manifestPath);
  const agentsFile = safePath(root, 'AGENTS.md');
  const agents = existsSync(agentsFile) ? readFileSync(agentsFile, 'utf8') : '';
  const old = existsSync(manifestFile)
    ? parseManifest(JSON.parse(readFileSync(manifestFile, 'utf8')))
    : null;
  if (old) verify(root, old, agents);
  if (!old && command !== 'install') throw new Error('No installation found; use install first');
  if (!old && (agents.includes(begin) || agents.includes(end)))
    throw new Error('Unowned AGENTS.md markers found');
  if (command === 'doctor')
    return `Installation ${old?.version}: checksums and AGENTS.md block verified`;
  /** @type {Map<string, Buffer | null>} */
  const changes = new Map();
  if (command === 'remove' && old) {
    for (const relative of Object.keys(old.files)) changes.set(relative, null);
    const remaining = agents.replace(old.agentsBlock, '');
    changes.set(
      'AGENTS.md',
      old.createdAgents && !remaining.trim() ? null : Buffer.from(remaining),
    );
    changes.set(manifestPath, null);
    transact(root, changes);
    return 'Removed owned files and instructions; unmanaged content preserved';
  }
  const next = bundle();
  for (const [relative, bytes] of Object.entries(next.files)) {
    const full = safePath(root, relative);
    if (existsSync(full) && !old?.files[relative])
      throw new Error(`Unmanaged file would be overwritten: ${relative}`);
    changes.set(relative, bytes);
  }
  for (const relative of Object.keys(old?.files ?? {})) {
    if (!(relative in next.files)) changes.set(relative, null);
  }
  const agentsBlock = `${begin}\n\nBefore working, read [shared working agreements](${baselinePath}).\nInstalled workflows: ${next.names.map((name) => `\`${name}\``).join(', ')}.\nProject-specific instructions and accepted decisions remain authoritative.\n${end}`;
  const updated = old
    ? agents.replace(old.agentsBlock, agentsBlock)
    : `${agents}${agents ? '\n\n' : ''}${agentsBlock}\n`;
  changes.set('AGENTS.md', Buffer.from(updated));
  /** @type {Manifest} */
  const manifest = {
    schemaVersion: 1,
    version: next.version,
    files: Object.fromEntries(
      Object.entries(next.files).map(([path, bytes]) => [path, hash(bytes)]),
    ),
    agentsBlock,
    createdAgents: old?.createdAgents ?? !existsSync(agentsFile),
  };
  changes.set(manifestPath, Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`));
  transact(root, changes);
  return `Installed ${next.names.length} skills at version ${next.version}`;
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help') {
    console.log(
      'agent-workflows <install|update|doctor|remove> --target <existing-project-directory>',
    );
  } else {
    try {
      if (args.length !== 3 || args[1] !== '--target' || !args[2])
        throw new Error('Use --help for usage');
      console.log(run(args[0], args[2]));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  }
}

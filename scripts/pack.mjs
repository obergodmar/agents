import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pluginFiles, pluginManifest } from './plugin.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = pluginManifest(root);
const output = resolve(process.argv[2] ?? 'artifacts');
mkdirSync(output, { recursive: true });
const archive = join(output, `${manifest.name}-${manifest.version}.zip`);
const result = spawnSync(
  'python3',
  [
    '-c',
    `
import sys, zipfile
from pathlib import Path
root, output = Path(sys.argv[1]), sys.argv[2]
with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for name in sys.argv[3:]:
        info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, (root / name).read_bytes())
`,
    root,
    archive,
    ...pluginFiles(root),
  ],
  { stdio: 'inherit' },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
if (result.status === 0) console.log(archive);

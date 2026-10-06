import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
mkdirSync('artifacts', { recursive: true });
const result = spawnSync('npm', ['pack', '--ignore-scripts', '--pack-destination', 'artifacts'], {
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;

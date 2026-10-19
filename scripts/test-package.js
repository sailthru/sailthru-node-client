'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const npmCli = process.env.npm_execpath;

if (!npmCli) {
  throw new Error('Run this check with npm run test:package.');
}

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'sailthru-client-smoke-'));

function npm(args, cwd, stdio) {
  return execFileSync(process.execPath, [npmCli, ...args], {
    cwd,
    stdio,
    timeout: 120000
  });
}

try {
  const packed = JSON.parse(npm(
    ['pack', '--json', '--pack-destination', temporaryDirectory],
    root,
    ['ignore', 'pipe', 'inherit']
  ));
  const tarball = path.join(temporaryDirectory, packed[0].filename);
  const installDirectory = path.join(temporaryDirectory, 'install');
  fs.mkdirSync(installDirectory);

  // Install the tarball, rather than a source-directory link, with runtime dependencies only.
  npm([
    'install', tarball, '--omit=dev', '--ignore-scripts',
    '--no-audit', '--no-fund', '--package-lock=false'
  ], installDirectory, 'inherit');

  // A separate process avoids the unit suite's filesystem and module mocks.
  execFileSync(process.execPath, [path.join(root, 'test', 'smoke-package.js')], {
    cwd: installDirectory,
    env: { ...process.env, NODE_PATH: '' },
    stdio: 'inherit',
    timeout: 30000
  });
} finally {
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
}

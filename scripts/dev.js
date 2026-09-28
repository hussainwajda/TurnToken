#!/usr/bin/env node

/**
 * Cross-platform dev runner for Turn-Token.
 * Powers `concurrently` by automatically identifying the OS (Windows, macOS, Linux),
 * locating the Python virtual environment, setting up activation variables,
 * and orchestrating both the FastAPI backend and Next.js frontend.
 */

const path = require('path');
const fs = require('fs');
const concurrently = require('concurrently');

const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const frontendDir = path.join(rootDir, 'frontend');

// 1. Identify Operating System
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';
const osName = isWindows ? 'Windows' : isMac ? 'macOS' : isLinux ? 'Linux' : process.platform;

console.log('------------------------------------------------------------');
console.log(`🚀  Turn-Token Dev Runner`);
console.log(`🖥️   Operating System : ${osName} (${process.platform})`);

// 2. Discover Virtual Environment
const candidateVenvDirs = [
  path.join(backendDir, '.venv'),
  path.join(backendDir, 'venv'),
  path.join(rootDir, '.venv'),
  path.join(rootDir, 'venv'),
];

let venvDir = candidateVenvDirs.find((dir) => fs.existsSync(dir));
let pythonExe = null;
let binDir = null;

if (venvDir) {
  binDir = isWindows ? path.join(venvDir, 'Scripts') : path.join(venvDir, 'bin');
  const candidatePythons = isWindows
    ? [
        path.join(binDir, 'python.exe'),
        path.join(binDir, 'python.bat'),
        path.join(binDir, 'python.cmd'),
        path.join(binDir, 'python'),
      ]
    : [
        path.join(binDir, 'python'),
        path.join(binDir, 'python3'),
        path.join(binDir, 'python3.13'),
        path.join(binDir, 'python3.12'),
        path.join(binDir, 'python3.11'),
      ];

  pythonExe = candidatePythons.find((candidate) => fs.existsSync(candidate));
}

let backendCommand = '';
const backendEnv = { ...process.env };

if (pythonExe && venvDir && binDir) {
  const relVenv = path.relative(rootDir, venvDir) || venvDir;
  const relPython = path.relative(rootDir, pythonExe) || pythonExe;
  const activateCmd = isWindows
    ? path.join(relVenv, 'Scripts', 'activate')
    : `source ${path.join(relVenv, 'bin', 'activate')}`;

  console.log(`🐍  Virtualenv       : ${relVenv}`);
  console.log(`⚡  Activate Command : ${activateCmd}`);
  console.log(`📍  Python Binary    : ${relPython}`);

  // Simulate environment activation for all child processes spawned by backend
  backendEnv.VIRTUAL_ENV = venvDir;
  backendEnv.PATH = `${binDir}${path.delimiter}${process.env.PATH || ''}`;

  // Execute uvicorn via the virtual environment's python directly
  backendCommand = `"${pythonExe}" -m uvicorn app.main:app --reload --port 8000`;
} else {
  console.log(`⚠️   Virtualenv       : Not found in ${path.relative(rootDir, path.join(backendDir, '.venv'))}`);
  console.log(`💡  Setup Tip        : cd backend && python -m venv .venv && ${isWindows ? '.venv\\Scripts\\activate' : 'source .venv/bin/activate'} && pip install -r requirements.txt`);
  console.log(`🔄  Fallback         : Using system python`);

  backendCommand = isWindows
    ? `python -m uvicorn app.main:app --reload --port 8000`
    : `python3 -m uvicorn app.main:app --reload --port 8000`;
}

console.log('------------------------------------------------------------\n');

// 3. Parse CLI Flags
const args = process.argv.slice(2);
const runBackendOnly = args.includes('--backend') || args.includes('--backend-only');
const runFrontendOnly = args.includes('--frontend') || args.includes('--frontend-only');

const commands = [];

if (!runBackendOnly) {
  commands.push({
    command: 'npm run dev',
    name: 'frontend',
    cwd: frontendDir,
    prefixColor: 'cyan',
    env: process.env,
  });
}

if (!runFrontendOnly) {
  commands.push({
    command: backendCommand,
    name: 'backend',
    cwd: backendDir,
    prefixColor: 'green',
    env: backendEnv,
  });
}

// 4. Run through Concurrently
const { result } = concurrently(commands, {
  prefix: 'name',
  killOthers: ['failure'],
  restartTries: 0,
});

result.then(
  () => {
    process.exit(0);
  },
  (failures) => {
    if (Array.isArray(failures)) {
      const exitCode = failures.some((f) => f.exitCode && f.exitCode !== 0) ? 1 : 0;
      process.exit(exitCode);
    }
    process.exit(1);
  }
);

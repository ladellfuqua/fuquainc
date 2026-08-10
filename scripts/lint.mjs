import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const failures = [];

function walk(directory) {
  const absolute = resolve(root, directory);
  if (!statSync(absolute).isDirectory()) return [];
  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = `${directory}/${entry.name}`;
    return entry.isDirectory() ? walk(relative) : [relative];
  });
}

for (const file of ['package.json', 'vercel.json', 'public/site.webmanifest']) {
  try {
    JSON.parse(readFileSync(resolve(root, file), 'utf8'));
  } catch (error) {
    failures.push(`${file}: invalid JSON (${error.message})`);
  }
}

const scriptFiles = ['api', 'scripts', 'public/scripts']
  .flatMap(walk)
  .filter((file) => /\.(?:js|mjs)$/.test(file));

for (const file of scriptFiles) {
  try {
    execFileSync(process.execPath, ['--check', resolve(root, file)], {
      stdio: 'pipe',
    });
  } catch (error) {
    failures.push(`${file}: JavaScript syntax check failed\n${error.stderr}`);
  }
}

const trackedFiles = execFileSync('git', ['ls-files'], {
  cwd: root,
  encoding: 'utf8',
})
  .trim()
  .split('\n')
  .filter(Boolean);
const trackedEnvironmentFiles = trackedFiles.filter(
  (file) => /(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith('.env.example')
);
if (trackedEnvironmentFiles.length > 0) {
  failures.push(`tracked environment files: ${trackedEnvironmentFiles.join(', ')}`);
}

if (failures.length > 0) {
  console.error(failures.join('\n\n'));
  process.exit(1);
}

console.log(
  `Lint passed: ${scriptFiles.length} scripts, 3 JSON files, and tracked environment-file policy.`
);

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('../scripts/check-contact-config.mjs', import.meta.url));
const check = (settings) => spawnSync(process.execPath, [script], {
  encoding: 'utf8',
  env: { ...process.env, RESEND_API_KEY: '', CONTACT_TO_EMAIL: '', VERCEL_ENV: '', ...settings },
});

test('production builds stop when either delivery setting is absent or blank', () => {
  for (const settings of [
    {},
    { RESEND_API_KEY: 'test-private-key' },
    { CONTACT_TO_EMAIL: 'private-inbox@example.com' },
    { RESEND_API_KEY: '  ', CONTACT_TO_EMAIL: 'private-inbox@example.com' },
  ]) {
    const result = check({ VERCEL_ENV: 'production', ...settings });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Contact delivery is not configured/);
    assert.doesNotMatch(result.stdout + result.stderr, /test-private-key|private-inbox@example.com/);
  }
});

test('configured production builds proceed without printing private settings', () => {
  const result = check({
    VERCEL_ENV: 'production',
    RESEND_API_KEY: 'test-private-key',
    CONTACT_TO_EMAIL: 'private-inbox@example.com',
  });
  assert.equal(result.status, 0);
  assert.equal(result.stdout + result.stderr, '');
});

test('local, CI and preview builds do not need delivery credentials', () => {
  for (const environment of ['', 'development', 'preview']) {
    assert.equal(check({ VERCEL_ENV: environment }).status, 0);
  }
});

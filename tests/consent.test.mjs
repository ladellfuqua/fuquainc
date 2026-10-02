import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const source = readFileSync(new URL('../public/scripts/analytics.js', import.meta.url), 'utf8');

function browser({ hostname = 'fuquainc.com', accepted, ready = true, idle = true } = {}) {
  const scripts = [], pending = [], listeners = new Map(), deleted = [];
  const cookies = new Map([['_ga', 'old'], ['_ga_K7TBK1TGXX', 'old'], ['member_session', 'keep'], ['fuqua_consent', 'keep']]);
  let reloads = 0;
  const context = {
    location: { hostname, reload: () => reloads++ },
    window: {
      fuquaAnalyticsAllowed: accepted,
      addEventListener: (name, callback) => listeners.set(name, callback),
      setTimeout: callback => pending.push(callback),
      ...(idle ? { requestIdleCallback: callback => pending.push(callback) } : {}),
    },
    document: {
      readyState: ready ? 'complete' : 'interactive',
      currentScript: { dataset: { gaId: 'G-K7TBK1TGXX' } },
      createElement: () => ({}),
      head: { appendChild: script => scripts.push(script) },
      get cookie() { return [...cookies].map(([k,v]) => `${k}=${v}`).join('; '); },
      set cookie(value) { deleted.push(value); cookies.delete(value.split('=')[0]); },
    },
  };
  runInNewContext(source, context);
  return {
    context, scripts, pending, deleted, cookies,
    get reloads() { return reloads; },
    consent: accepted => listeners.get('fuqua:analytics-consent')?.({ detail: accepted }),
    load: () => { context.document.readyState = 'complete'; listeners.get('load')?.(); },
    flush: () => { while (pending.length) pending.shift()(); },
  };
}

test('unknown/rejected consent sends no analytics and clears only old analytics cookies', () => {
  for (const accepted of [undefined, false]) {
    const b = browser({ accepted });
    b.load(); b.flush();
    assert.equal(b.scripts.length, 0);
    assert.equal(b.context.window.dataLayer, undefined);
    assert.equal(b.context.window['ga-disable-G-K7TBK1TGXX'], true);
    b.consent(false); // Consent library has finished reading saved preferences.
    assert.deepEqual([...b.cookies.keys()], ['member_session', 'fuqua_consent']);
    assert.ok(b.deleted.some(value => value.includes('domain=fuquainc.com')));
  }
});

test('deferred consent initialization preserves cookies for returning accepted visitors', () => {
  const b = browser();
  assert.equal(b.cookies.get('_ga'), 'old');
  b.consent(true); b.flush();
  assert.equal(b.cookies.get('_ga'), 'old');
  assert.equal(b.deleted.length, 0);
  assert.equal(b.scripts.length, 1);
});

test('initial or returning acceptance loads once and keeps advertising disabled', () => {
  for (const accepted of [undefined, true]) {
    const b = browser({ accepted });
    b.consent(true); b.consent(true); b.flush(); b.consent(true); b.flush();
    assert.equal(b.scripts.length, 1);
    assert.match(b.scripts[0].src, /gtag\/js\?id=G-K7TBK1TGXX$/);
    assert.equal(b.scripts[0].async, true);
    const config = b.context.window.dataLayer.find(args => args[0] === 'config');
    assert.equal(config[2].allow_google_signals, false);
    assert.equal(config[2].allow_ad_personalization_signals, false);
    assert.equal(config[2].cookie_expires, 15552000);
  }
});

test('acceptance before page load waits for load and idle, including timer fallback', () => {
  for (const idle of [true, false]) {
    const b = browser({ ready: false, idle });
    b.consent(true);
    assert.equal(b.pending.length, 0);
    assert.equal(b.context.window.dataLayer, undefined);
    b.load();
    assert.equal(b.scripts.length, 0);
    b.flush();
    assert.equal(b.scripts.length, 1);
  }
});

test('withdrawal cancels queued loading and reacceptance can still load', () => {
  const b = browser();
  b.consent(true); b.consent(false); b.flush();
  assert.equal(b.scripts.length, 0);
  assert.equal(b.reloads, 0);
  b.consent(true); b.flush();
  assert.equal(b.scripts.length, 1);
});

test('withdrawal disables loaded analytics, clears its cookies and reloads to unload tracking', () => {
  const b = browser({ accepted: true }); b.flush();
  b.cookies.set('_ga', 'new');
  b.consent(false);
  assert.equal(b.context.window['ga-disable-G-K7TBK1TGXX'], true);
  assert.equal(b.cookies.has('_ga'), false);
  assert.equal(b.cookies.get('member_session'), 'keep');
  assert.equal(b.reloads, 1);
});

test('preview and local hosts never load analytics even with consent', () => {
  for (const hostname of ['localhost', 'fuquainc-preview.vercel.app', 'fuquainc.com.evil.test']) {
    const b = browser({ hostname, accepted: true }); b.consent(true); b.flush();
    assert.equal(b.scripts.length, 0);
    assert.equal(b.context.window.dataLayer, undefined);
  }
  const b = browser({ hostname: 'www.fuquainc.com', accepted: true }); b.flush();
  assert.equal(b.scripts.length, 1);
});

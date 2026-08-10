import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const publicRoutes = [
  'dist/index.html',
  'dist/about/index.html',
  'dist/contact/index.html',
  'dist/privacy/index.html',
  'dist/writing/index.html',
  'dist/writing/growth-rarely-belongs-to-one-department/index.html',
];

test('key public routes and indexing files are generated', () => {
  for (const route of publicRoutes) {
    assert.equal(existsSync(new URL(`../${route}`, import.meta.url)), true, route);
  }
  assert.equal(existsSync(new URL('../dist/robots.txt', import.meta.url)), true);
  assert.equal(existsSync(new URL('../dist/sitemap-index.xml', import.meta.url)), true);
});

test('robots and sitemap retain the intended indexing controls', () => {
  const robots = read('dist/robots.txt');
  const sitemap = read('dist/sitemap-0.xml');

  assert.match(robots, /Disallow: \/mockups/);
  assert.match(robots, /Sitemap: https:\/\/fuquainc\.com\/sitemap-index\.xml/);
  assert.match(sitemap, /https:\/\/fuquainc\.com\/writing\/growth-rarely-belongs-to-one-department/);
  assert.doesNotMatch(sitemap, /\/mockups/);
});

test('production CSP blocks executable inline scripts without broad sources', () => {
  const config = JSON.parse(read('vercel.json'));
  const csp = config.headers[0].headers.find(
    (header) => header.key === 'Content-Security-Policy'
  )?.value;

  assert.ok(csp, 'Content-Security-Policy header is configured');
  const scriptDirective = csp
    .split(';')
    .map((directive) => directive.trim())
    .find((directive) => directive.startsWith('script-src '));

  assert.ok(scriptDirective, 'script-src directive is configured');
  assert.doesNotMatch(scriptDirective, /'unsafe-inline'/);
  assert.doesNotMatch(scriptDirective, /\*/);
  assert.match(scriptDirective, /'self'/);
  assert.match(scriptDirective, /https:\/\/www\.googletagmanager\.com/);
  assert.match(scriptDirective, /https:\/\/www\.google-analytics\.com/);
});

test('built pages contain no executable inline JavaScript', () => {
  const inertTypes = new Set(['application/ld+json', 'application/json']);

  for (const route of publicRoutes) {
    const html = read(route);
    const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi);

    for (const [, attributes, body] of scripts) {
      const type = attributes.match(/\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase();
      if (type && inertTypes.has(type)) continue;

      assert.match(attributes, /\bsrc=["'][^"']+["']/i, `${route}: ${body.slice(0, 60)}`);
    }
  }
});

test('structured data remains valid JSON', () => {
  for (const route of publicRoutes) {
    const html = read(route);
    const blocks = html.matchAll(
      /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    );
    let count = 0;
    for (const [, json] of blocks) {
      assert.doesNotThrow(() => JSON.parse(json), route);
      count += 1;
    }
    assert.ok(count >= 3, `${route}: expected shared structured-data blocks`);
  }
});

test('bootstrap and analytics load from same-origin assets', () => {
  const html = read('dist/index.html');
  assert.match(html, /<script[^>]+src="\/scripts\/site-bootstrap\.js"/);
  assert.match(html, /<script[^>]+src="\/scripts\/analytics\.js"[^>]+data-ga-id="G-K7TBK1TGXX"/);
});

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import {
  ARTICLE_SOCIAL_CARD_HEIGHT,
  ARTICLE_SOCIAL_CARD_WIDTH,
  renderArticleSocialCard,
} from '../src/lib/article-social-card.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const publicRoutes = [
  'dist/index.html',
  'dist/contact/index.html',
  'dist/privacy/index.html',
  'dist/writing/index.html',
  'dist/writing/the-future-used-to-have-a-cord/index.html',
  'dist/writing/the-only-one-in-the-room/index.html',
  'dist/writing/what-we-carry-through-the-door/index.html',
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

test('public pages do not block rendering on script or stylesheet requests', () => {
  for (const route of publicRoutes) {
    assert.doesNotMatch(read(route), /<link\b[^>]*rel="stylesheet"/, route);
    for (const [, attributes] of read(route).matchAll(/<script\b([^>]*\bsrc="[^"]+"[^>]*)>/g)) {
      assert.match(attributes, /\b(?:defer|async)\b|type="module"/, route);
    }
  }
});

test('analytics runs only on live domains with advertising features disabled', () => {
  const source = read('public/scripts/analytics.js');
  for (const hostname of ['fuquainc.com', 'www.fuquainc.com', 'localhost', 'fuquainc-preview.vercel.app']) {
    const scripts = [];
    const context = {
      location: { hostname },
      window: { requestIdleCallback: (callback) => callback() },
      document: {
        readyState: 'complete',
        currentScript: { dataset: { gaId: 'G-K7TBK1TGXX' } },
        createElement: () => ({}),
        head: { appendChild: (script) => scripts.push(script) },
      },
    };
    runInNewContext(source, context);
    if (!['fuquainc.com', 'www.fuquainc.com'].includes(hostname)) {
      assert.equal(scripts.length, 0);
      assert.equal(context.window.dataLayer, undefined);
      continue;
    }
    assert.equal(scripts.length, 1);
    assert.equal(scripts[0].async, true);
    const config = context.window.dataLayer.find((args) => args[0] === 'config');
    assert.equal(config[1], 'G-K7TBK1TGXX');
    assert.equal(config[2].allow_google_signals, false);
    assert.equal(config[2].allow_ad_personalization_signals, false);
  }
  const csp = JSON.parse(read('vercel.json')).headers[0].headers.find(header => header.key === 'Content-Security-Policy').value;
  const connections = csp.split(';').find(directive => directive.trim().startsWith('connect-src'));
  assert.match(connections, /https:\/\/analytics\.google\.com\/g\/collect/);
  assert.match(connections, /https:\/\/www\.google\.com\/g\/collect/);
  assert.doesNotMatch(connections, /doubleclick|googlesyndication|\*/);
});

test('analytics waits for page assets and idle time, with a fallback when idle callbacks are unavailable', () => {
  for (const supportsIdle of [true, false]) {
    const scheduled = [];
    const listeners = new Map();
    const scripts = [];
    const context = {
      location: { hostname: 'fuquainc.com' },
      window: {
        addEventListener: (event, callback, options) => {
          assert.equal(options.once, true);
          listeners.set(event, callback);
        },
        setTimeout: (callback) => scheduled.push(callback),
        ...(supportsIdle ? { requestIdleCallback: (callback, options) => {
          assert.equal(options.timeout, 2000);
          scheduled.push(callback);
        } } : {}),
      },
      document: {
        readyState: 'interactive',
        currentScript: { dataset: { gaId: 'G-K7TBK1TGXX' } },
        createElement: () => ({}),
        head: { appendChild: (script) => scripts.push(script) },
      },
    };
    runInNewContext(read('public/scripts/analytics.js'), context);
    assert.equal(context.window.dataLayer.length, 2, 'page view configuration is queued immediately');
    assert.equal(scripts.length, 0);
    assert.equal(scheduled.length, 0);
    listeners.get('load')();
    assert.equal(scripts.length, 0, 'load waits for the idle callback or fallback task');
    assert.equal(scheduled.length, 1);
    scheduled[0]();
    assert.equal(scripts.length, 1);
  }
});

test('published articles receive a generated 1200 by 630 social card', () => {
  const imagePath = new URL(
    '../dist/social/growth-rarely-belongs-to-one-department.png',
    import.meta.url
  );
  assert.equal(existsSync(imagePath), true);

  const image = readFileSync(imagePath);
  assert.equal(image.subarray(1, 4).toString('ascii'), 'PNG');
  assert.equal(image.readUInt32BE(16), 1200);
  assert.equal(image.readUInt32BE(20), 630);

  const article = read(
    'dist/writing/growth-rarely-belongs-to-one-department/index.html'
  );
  assert.match(
    article,
    /property="og:image" content="https:\/\/fuquainc\.com\/social\/growth-rarely-belongs-to-one-department\.png"/
  );
  assert.match(
    article,
    /name="twitter:image" content="https:\/\/fuquainc\.com\/social\/growth-rarely-belongs-to-one-department\.png"/
  );
  assert.match(article, /property="og:image:type" content="image\/png"/);
  assert.match(
    article,
    /property="og:image:alt" content="Growth rarely belongs to one department — Work and Leadership"/
  );
});

test('the social-card system renders every editorial theme', async () => {
  const themes = [
    'Work and Leadership',
    'Identity and Belonging',
    'Culture and Technology',
    'Culture and Opportunity',
    'Personal Reflections',
  ];

  for (const theme of themes) {
    const image = await renderArticleSocialCard({
      title: `A considered perspective on ${theme.toLowerCase()}`,
      theme,
    });

    assert.equal(image.subarray(1, 4).toString('ascii'), 'PNG');
    assert.equal(image.readUInt32BE(16), ARTICLE_SOCIAL_CARD_WIDTH);
    assert.equal(image.readUInt32BE(20), ARTICLE_SOCIAL_CARD_HEIGHT);
  }
});

test('article metadata links consistent identities and declares the actual image type', () => {
  for (const route of publicRoutes.filter((path) => path.startsWith('dist/writing/') && path !== 'dist/writing/index.html')) {
    const html = read(route);
    const blocks = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
    const article = blocks.find((block) => block['@type'] === 'Article');
    const person = blocks.find((block) => block['@type'] === 'Person');
    const organization = blocks.find((block) => block['@type'] === 'Organization');
    assert.ok(person['@id']);
    assert.ok(organization['@id']);
    assert.equal(article.author['@id'], person['@id']);
    assert.equal(article.publisher['@id'], organization['@id']);
    assert.equal(article.isPartOf['@id'], 'https://fuquainc.com/#website');
    assert.match(article.datePublished, /^\d{4}-\d{2}-\d{2}$/);
    for (const [, date] of html.matchAll(/<time\b[^>]*datetime="([^"]+)"/g)) {
      assert.match(date, /^\d{4}-\d{2}-\d{2}$/, 'article dates have no invented time');
    }
    assert.equal(article.dateModified, undefined, 'technical changes must not invent editorial update dates');
    const type = html.match(/property="og:image:type" content="([^"]+)"/)[1];
    assert.equal(type, article.image.endsWith('.webp') ? 'image/webp' : 'image/png');
  }
});

test('latest article serves smaller responsive images and a linked quote source', () => {
  const html = read('dist/writing/the-future-used-to-have-a-cord/index.html');
  assert.match(html, /<img[^>]*srcset="[^"]+400w,[^"]+640w,[^"]+960w,[^"]+1280w,[^"]+1670w"/);
  assert.match(html, /<img[^>]*sizes="[^"]+"/);
  for (const width of [400, 640, 960, 1280, 1670]) {
    const image = readFileSync(new URL(`../dist/images/writing/the-future-used-to-have-a-cord-${width}.webp`, import.meta.url));
    assert.equal(image.subarray(8, 12).toString('ascii'), 'WEBP');
    assert.ok(image.length < 160000, `${width}px image should remain under 160 KB`);
  }
  assert.match(html, /href="https:\/\/www\.aarp\.org\/events-history\/katherine-johnson-q-and-a-2018\/"/);
});


test('merged home preserves the latest production article and redirects About', () => {
  const home = read('dist/index.html');
  const writing = read('dist/writing/index.html');
  const latest = 'what-we-carry-through-the-door';
  const older = 'growth-rarely-belongs-to-one-department';
  const published = JSON.parse(writing.match(/<script[^>]*id="writing-data"[^>]*>([\s\S]*?)<\/script>/)[1]).articles;
  const homeLinks = Array.from(home.matchAll(/<a href="([^"]+)" class="writing-entry /g), match => match[1]);
  const expected = [...published].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 3).map(article => article.href);
  assert.deepEqual(homeLinks, expected);
  assert.ok(writing.indexOf('/writing/' + latest) < writing.indexOf('/writing/' + older));
  assert.ok(writing.includes('/writing/' + latest) && writing.includes('/writing/' + older));
  assert.doesNotMatch(home, /noindex|Preview · Merged Home/);
  assert.deepEqual(JSON.parse(read('vercel.json')).redirects.find(r => r.source === '/about'),
    { source: '/about', destination: '/', statusCode: 301 });
  assert.doesNotMatch(read('dist/sitemap-0.xml'), /\/about|home-full-preview|home-open-preview|home-preview/);
});

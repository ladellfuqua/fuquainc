import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { changedUrls, eligibleDeployment, parseArticle, publishingSnapshot, sitemapDates, submitIndexNow, SITE } from '../src/lib/publishing.mjs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const article = (overrides = {}) => ({
  id: 'example', url: `${SITE}/writing/example`, body: 'An essay.',
  data: { status: 'published', title: 'An essay', deck: 'A short deck.', summary: 'A summary.', publishedAt: '2026-09-23', themes: ['Culture and Technology'] },
  ...overrides,
});

test('publishing snapshots distinguish body edits, list edits, drafts, publication and removal', () => {
  const original = article();
  const before = publishingSnapshot([original]);
  assert.deepEqual(changedUrls(before, publishingSnapshot([original])), []);
  assert.deepEqual(changedUrls(before, publishingSnapshot([article({ body: 'Revised essay.' })])), [original.url]);
  assert.deepEqual(changedUrls(before, publishingSnapshot([article({ data: { ...original.data, title: 'Revised title' } })])), [SITE, `${SITE}/writing`, original.url]);
  const draft = article({ id: 'draft', url: `${SITE}/writing/draft`, data: { ...original.data, status: 'draft' } });
  assert.deepEqual(changedUrls(before, publishingSnapshot([original, draft])), []);
  assert.deepEqual(changedUrls(publishingSnapshot([draft]), publishingSnapshot([{ ...draft, data: { ...draft.data, status: 'published' } }])), [SITE, `${SITE}/writing`, draft.url]);
  assert.deepEqual(changedUrls(before, publishingSnapshot([])), [SITE, `${SITE}/writing`, original.url]);
  const future = article({ data: { ...original.data, publishedAt: '2099-01-01' } });
  assert.ok(publishingSnapshot([future]).has(future.url), 'status, not the clock, controls publication');
});

test('body updates to older articles do not notify unchanged homepage or writing lists', () => {
  const items = [1, 2, 3, 4].map((i) => article({ id: `article-${i}`, url: `${SITE}/writing/article-${i}`, data: { ...article().data, publishedAt: `2026-09-0${i}` } }));
  const before = publishingSnapshot(items);
  const changed = items.map((a, i) => i === 0 ? { ...a, body: 'Updated older essay.' } : a);
  assert.deepEqual(changedUrls(before, publishingSnapshot(changed)), [items[0].url]);
});

test('sitemap dates reflect editorial and explicit page changes without changing publication dates', () => {
  const old = article({ data: { ...article().data, publishedAt: '2026-08-07', modifiedAt: '2026-09-01' } });
  const updates = { sharedMetadata: '2026-09-23', pages: { '/': '2026-09-24', '/writing': '2026-09-22' } };
  const dates = sitemapDates([old], updates);
  assert.equal(dates.get(old.url), '2026-09-23');
  assert.equal(dates.get(SITE), '2026-09-24');
  assert.equal(dates.get(`${SITE}/writing`), '2026-09-23');
  assert.equal(old.data.publishedAt, '2026-08-07');
  assert.equal(old.data.modifiedAt, '2026-09-01');
  assert.deepEqual(sitemapDates([old], updates), dates, 'rebuilding never advances dates');
});

test('frontmatter parsing supports quoted statuses and YAML dates', () => {
  const parsed = parseArticle('src/content/articles/example.md', '---\ntitle: "An essay"\nstatus: "published"\npublishedAt: 2026-09-23\n---\nAn essay.\n');
  assert.equal(parsed.url, article().url);
  assert.equal(parsed.body, 'An essay.');
  assert.ok(publishingSnapshot([parsed]).has(parsed.url));
});

test('IndexNow excludes preview, failed and unfinished deployment events', () => {
  const event = { deployment: { environment: 'Production', production_environment: false }, deployment_status: { state: 'success' } };
  assert.equal(eligibleDeployment(event), true);
  for (const environment of ['Preview', 'Development']) assert.equal(eligibleDeployment({ ...event, deployment: { environment, production_environment: false } }), false);
  for (const state of ['pending', 'in_progress', 'failure', 'error', 'inactive']) assert.equal(eligibleDeployment({ ...event, deployment_status: { state } }), false);
});

test('IndexNow verifies the live revision and key before a scoped submission', async () => {
  const revision = 'a'.repeat(40);
  const key = 'b'.repeat(32);
  for (const status of [200, 202]) {
    const calls = [];
    const fetcher = async (url, options) => {
      calls.push({ url, options });
      if (url === SITE + '/') return new Response(`<meta name="build-revision" content="${revision}">`);
      if (url === `${SITE}/${key}.txt`) return new Response(key);
      return new Response('', { status });
    };
    const result = await submitIndexNow({ urls: [article().url], key, revision, fetcher });
    assert.equal(result.status, status);
    assert.equal(calls.length, 3);
    assert.equal(calls[2].url, 'https://api.indexnow.org/indexnow');
    assert.deepEqual(JSON.parse(calls[2].options.body).urlList, [article().url]);
  }
  let calls = 0;
  const stale = async () => { calls++; return new Response('<html>old revision</html>'); };
  await assert.rejects(submitIndexNow({ urls: [article().url], key, revision, fetcher: stale }), /not live/);
  assert.equal(calls, 1, 'a stale or preview revision must never reach IndexNow');
  await assert.rejects(submitIndexNow({ urls: ['https://preview.vercel.app/writing/example'], key, revision, fetcher: stale }), /canonical production/);
  assert.deepEqual(await submitIndexNow({ urls: [], key, revision, fetcher: stale }), { skipped: true });
  assert.equal(calls, 1, 'unchanged deploys require no network calls');
});

test('homepage identifies the author without adding the job title to page metadata', () => {
  const html = read('dist/index.html');
  const nodes = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const person = nodes.find(n => n['@type'] === 'Person');
  const profile = nodes.find(n => n['@type'] === 'ProfilePage');
  const org = nodes.find(n => n['@type'] === 'Organization');
  assert.match(html, /<title>Ladell Fuqua — Fuqua Inc\.<\/title>/);
  assert.equal(person.worksFor.name, 'PWX Solutions');
  assert.equal(person.jobTitle, 'Chief Operating Officer & Head of Growth');
  assert.equal(profile.mainEntity['@id'], person['@id']);
  assert.equal(profile.isPartOf['@id'], `${SITE}/#website`);
  assert.match(person.image, /^https:\/\/fuquainc\.com\/_astro\/.+\.webp$/);
  assert.equal(org.founder, undefined, 'Organization enrichment is deferred');
  for (const meta of html.matchAll(/<meta[^>]*(?:name|property)="(?:description|og:description|twitter:description)"[^>]*>/g)) {
    assert.doesNotMatch(meta[0], /Chief Operating|Head of Growth/);
  }
});

test('RSS and sitemap contain valid XML, canonical articles and truthful dates', () => {
  const xml = read('dist/rss.xml');
  assert.equal(XMLValidator.validate(xml), true);
  const feed = new XMLParser().parse(xml).rss.channel;
  const items = feed.item;
  const writing = read('dist/writing/index.html');
  const articles = JSON.parse(writing.match(/<script[^>]*id="writing-data"[^>]*>([\s\S]*?)<\/script>/)[1]).articles;
  assert.equal(items.length, articles.length);
  assert.deepEqual(items.map(i => i.link), articles.map(a => SITE + a.href));
  items.forEach((item, i) => {
    assert.equal(item.title, articles[i].title);
    assert.equal(new Date(item.pubDate).toISOString().slice(0, 10), articles[i].publishedAt);
    assert.ok(item.description);
    assert.ok(!item.link.endsWith('/'));
  });
  const sitemap = read('dist/sitemap-0.xml');
  assert.equal(XMLValidator.validate(sitemap), true);
  const urls = new XMLParser().parse(sitemap).urlset.url;
  for (const entry of urls.filter(u => u.loc === SITE || u.loc.includes('/writing'))) {
    assert.match(entry.lastmod, /^\d{4}-\d{2}-\d{2}$/);
  }
  assert.ok(urls.every(u => !u.loc.endsWith('/')));
  const { key } = JSON.parse(read('indexnow.config.json'));
  assert.equal(read(`dist/${key}.txt`).trim(), key);
  assert.match(read('dist/index.html'), /rel="alternate" type="application\/rss\+xml"[^>]*href="\/rss.xml"/);
});

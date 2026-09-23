import { createHash } from 'node:crypto';
import { load } from 'js-yaml';

export const SITE = 'https://fuquainc.com';
export const ARTICLE_DIRECTORY = 'src/content/articles/';

export function dateOnly(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export function parseArticle(file, source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`Missing frontmatter: ${file}`);
  const data = load(match[1]);
  const id = file.slice(ARTICLE_DIRECTORY.length).replace(/\.mdx?$/, '');
  return { id, url: `${SITE}/writing/${id}`, data, body: match[2].trim() };
}

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const published = (articles) => articles.filter((a) => a.data.status === 'published')
  .sort((a, b) => new Date(b.data.publishedAt) - new Date(a.data.publishedAt) || a.id.localeCompare(b.id));

/** Changes to dates here represent deliberate page edits, never build times. */
export function sitemapDates(articles, updates) {
  const entries = published(articles);
  const dates = new Map();
  for (const article of entries) {
    dates.set(article.url, [
      dateOnly(article.data.modifiedAt ?? article.data.publishedAt),
      updates.sharedMetadata,
      updates.pages?.[`/writing/${article.id}`],
    ].filter(Boolean).sort().at(-1));
  }
  for (const path of ['/', '/writing']) {
    dates.set(path === '/' ? SITE : `${SITE}${path}`, [
      updates.sharedMetadata,
      updates.pages?.[path],
      ...entries.map((article) => dateOnly(article.data.publishedAt)),
    ].filter(Boolean).sort().at(-1));
  }
  return dates;
}

/** IndexNow compares published content, not build artifacts or asset hashes. */
export function publishingSnapshot(articles, updates = {}) {
  const entries = published(articles);
  const snapshot = new Map(entries.map((article) => [article.url, hash({
    data: article.data, body: article.body,
    metadata: updates.sharedMetadata,
    page: updates.pages?.[`/writing/${article.id}`],
  })]));
  const rows = entries.map(({ id, data }) => ({
    id, title: data.title, deck: data.deck, publishedAt: data.publishedAt, themes: data.themes,
  }));
  for (const [path, list] of [['/', rows.slice(0, 3)], ['/writing', rows]]) {
    snapshot.set(path === '/' ? SITE : `${SITE}${path}`, hash({
      list, metadata: updates.sharedMetadata, page: updates.pages?.[path],
    }));
  }
  return snapshot;
}

export function changedUrls(before, after) {
  return [...new Set([...before.keys(), ...after.keys()])]
    .filter((url) => before.get(url) !== after.get(url)).sort();
}

export function eligibleDeployment(event) {
  // Vercel names this environment "Production" but sets GitHub's optional
  // production_environment flag to false, even for the live main deployment.
  return event.deployment_status?.state === 'success'
    && event.deployment?.environment === 'Production';
}

export async function submitIndexNow({ urls, key, revision, fetcher = fetch }) {
  if (!urls.length) return { skipped: true };
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('A full deployed commit SHA is required.');
  if (!/^[a-zA-Z0-9-]{8,128}$/.test(key)) throw new Error('Invalid IndexNow key.');
  for (const url of urls) {
    if (new URL(url).origin !== SITE) throw new Error('Only canonical production URLs may be submitted.');
  }
  const home = await fetcher(`${SITE}/`, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!home.ok || !(await home.text()).includes(`<meta name="build-revision" content="${revision}">`)) {
    throw new Error('The requested revision is not live on the production domain; nothing submitted.');
  }
  const keyLocation = `${SITE}/${key}.txt`;
  const verification = await fetcher(keyLocation, { signal: AbortSignal.timeout(20000) });
  if (!verification.ok || (await verification.text()).trim() !== key) {
    throw new Error('The production IndexNow verification file is unavailable.');
  }
  const response = await fetcher('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ host: new URL(SITE).host, key, keyLocation, urlList: urls }),
    signal: AbortSignal.timeout(20000),
  });
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow returned HTTP ${response.status}.`);
  return { status: response.status, urls };
}

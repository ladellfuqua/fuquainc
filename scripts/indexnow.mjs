import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { ARTICLE_DIRECTORY, changedUrls, eligibleDeployment, parseArticle, publishingSnapshot, submitIndexNow } from '../src/lib/publishing.mjs';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const args = process.argv.slice(2);
const option = (name) => args[args.indexOf(name) + 1];
const before = option('--before');
const after = option('--after');
if (!/^[a-f0-9]{40}$/.test(before ?? '') || !/^[a-f0-9]{40}$/.test(after ?? '')) {
  throw new Error('Usage: npm run indexnow -- --before <full SHA> --after <full SHA> [--dry-run|--production]');
}

function snapshot(ref) {
  const files = git('ls-tree', '-r', '--name-only', ref, '--', ARTICLE_DIRECTORY).split('\n').filter((file) => /\.mdx?$/.test(file));
  const articles = files.map((file) => parseArticle(file, git('show', `${ref}:${file}`)));
  const updatesPath = 'src/data/page-updates.json';
  const hasUpdates = git('ls-tree', '--name-only', ref, '--', updatesPath);
  const updates = hasUpdates ? JSON.parse(git('show', `${ref}:${updatesPath}`)) : {};
  return publishingSnapshot(articles, updates);
}

const urls = changedUrls(snapshot(before), snapshot(after));
if (args.includes('--dry-run')) {
  console.log(JSON.stringify({ before, after, urls }, null, 2));
} else {
  if (process.env.GITHUB_EVENT_PATH) {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    if (!eligibleDeployment(event) || event.deployment.sha !== after) {
      throw new Error('Only a successful Production deployment may notify IndexNow.');
    }
  } else if (!args.includes('--production')) {
    throw new Error('Manual submissions require --production and a verified live revision.');
  }
  git('merge-base', '--is-ancestor', after, 'origin/main');
  const { key } = JSON.parse(readFileSync(new URL('../indexnow.config.json', import.meta.url), 'utf8'));
  console.log(JSON.stringify(await submitIndexNow({ urls, key, revision: after }), null, 2));
}

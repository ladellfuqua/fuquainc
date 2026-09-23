// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { ARTICLE_DIRECTORY, parseArticle, sitemapDates } from './src/lib/publishing.mjs';

const articleSources = readdirSync(new URL(ARTICLE_DIRECTORY, import.meta.url), { recursive: true, encoding: 'utf8' })
  .filter((file) => /\.mdx?$/.test(file))
  .map((file) => parseArticle(`${ARTICLE_DIRECTORY}${file}`, readFileSync(new URL(`${ARTICLE_DIRECTORY}${file}`, import.meta.url), 'utf8')));
const updates = JSON.parse(readFileSync(new URL('./src/data/page-updates.json', import.meta.url), 'utf8'));
const lastModified = sitemapDates(articleSources, updates);

// https://astro.build/config
export default defineConfig({
  site: 'https://fuquainc.com',
  trailingSlash: 'never',
  redirects: { '/about': { destination: '/', status: 301 } },
  // These small static pages can paint with their first HTML response instead
  // of waiting for multiple stylesheets. The existing CSP permits inline CSS;
  // executable JavaScript remains in external assets below.
  build: { inlineStylesheets: 'always' },
  // Keep executable scripts in generated assets so the production CSP can
  // reject all inline JavaScript without disabling Astro component behavior.
  vite: {
    build: {
      assetsInlineLimit: 0,
    },
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/mockups') && !page.includes('/about'),
      serialize: (item) => {
        const lastmod = lastModified.get(item.url.replace(/\/$/, ''));
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    {
      name: 'calendar-sitemap-dates',
      hooks: {
        'astro:build:done': ({ dir }) => {
          // The sitemap package expands calendar dates into UTC midnight.
          // Retain the actual precision of our authored dates instead.
          for (const file of readdirSync(dir).filter((name) => /^sitemap-\d+\.xml$/.test(name))) {
            const url = new URL(file, dir);
            const xml = readFileSync(url, 'utf8').replace(/(<lastmod>\d{4}-\d{2}-\d{2})T00:00:00\.000Z(<\/lastmod>)/g, '$1$2');
            writeFileSync(url, xml);
          }
        },
      },
    },
  ],
  devToolbar: { enabled: false },
});

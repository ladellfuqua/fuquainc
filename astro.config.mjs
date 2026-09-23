// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

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
    }),
  ],
  devToolbar: { enabled: false },
});

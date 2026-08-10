// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://fuquainc.com',
  trailingSlash: 'never',
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
      filter: (page) => !page.includes('/mockups'),
    }),
  ],
  devToolbar: { enabled: false },
});

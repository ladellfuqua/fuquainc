// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://fuquainc.com',
  integrations: [
    mdx(),
    sitemap({
      filter: (page) =>
        !page.includes('/mockups') && !page.includes('/visual-system'),
    }),
  ],
  devToolbar: { enabled: false },
});

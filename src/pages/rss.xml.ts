import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { articleHref, getPublishedArticles } from '../lib/articles';

export async function GET(context: APIContext) {
  const articles = await getPublishedArticles();
  return rss({
    title: 'Fuqua Inc. — Writing',
    description: 'Articles by Ladell Fuqua on work, technology and culture.',
    site: context.site!,
    trailingSlash: false,
    customData: '<language>en-us</language>',
    items: articles.map((article) => ({
      title: article.data.title,
      link: articleHref(article),
      pubDate: article.data.publishedAt,
      description: article.data.summary,
    })),
  });
}

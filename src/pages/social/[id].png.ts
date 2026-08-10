import type { APIRoute, GetStaticPaths } from 'astro';
import { getPublishedArticles } from '../../lib/articles';
import { renderArticleSocialCard } from '../../lib/article-social-card.mjs';

export const getStaticPaths: GetStaticPaths = async () => {
  const articles = await getPublishedArticles();

  return articles.map((article) => ({
    params: { id: article.id },
    props: {
      title: article.data.title,
      theme: article.data.themes[0],
    },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const image = await renderArticleSocialCard({
    title: props.title,
    theme: props.theme,
  });

  return new Response(new Uint8Array(image), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};

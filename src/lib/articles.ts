import { getCollection, type CollectionEntry } from 'astro:content';

export type ArticleEntry = CollectionEntry<'articles'>;

export async function getPublishedArticles(): Promise<ArticleEntry[]> {
  const articles = await getCollection(
    'articles',
    ({ data }) => data.status === 'published'
  );

  return articles.sort(
    (a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime()
  );
}

export function articleHref(article: ArticleEntry): string {
  return `/writing/${article.id}`;
}

export function selectRelatedArticles(
  current: ArticleEntry,
  articles: ArticleEntry[],
  limit = 3
): ArticleEntry[] {
  const others = articles.filter((article) => article.id !== current.id);
  const currentThemes = new Set(current.data.themes);
  const sameTheme = others.filter((article) =>
    article.data.themes.some((theme) => currentThemes.has(theme))
  );
  const sameThemeIds = new Set(sameTheme.map((article) => article.id));
  const fallback = others.filter((article) => !sameThemeIds.has(article.id));

  return [...sameTheme, ...fallback].slice(0, limit);
}

export function formatArticleDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatArticleMonth(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

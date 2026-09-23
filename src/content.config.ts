import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { articleThemeNames } from './data/article-themes';

const articles = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/articles',
  }),
  schema: ({ image }) => z.object({
    title: z.string().min(1),
    deck: z.string().min(1),
    summary: z.string().min(1),
    publishedAt: z.coerce.date(),
    modifiedAt: z.coerce.date().optional(),
    themes: z.array(z.enum(articleThemeNames)).min(1),
    status: z.enum(['draft', 'published']),
    aiAssisted: z.boolean().default(false),
    image: image().optional(),
    imageAlt: z.string().min(1).optional(),
    // Existing published share images can retain their stable URL and size.
    socialImage: z.object({
      url: z.string().startsWith('/'),
      width: z.number().positive(),
      height: z.number().positive(),
    }).optional(),
  }).refine((article) => !article.modifiedAt || article.modifiedAt >= article.publishedAt, {
    message: 'modifiedAt must be on or after publishedAt',
    path: ['modifiedAt'],
  }).refine((article) => !article.image || article.imageAlt, {
    message: 'Provide imageAlt when an article has a header image',
    path: ['imageAlt'],
  }),
});

export const collections = { articles };

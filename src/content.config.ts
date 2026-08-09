import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const articles = defineCollection({
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: './src/content/articles',
  }),
  schema: z.object({
    title: z.string().min(1),
    deck: z.string().min(1),
    summary: z.string().min(1),
    publishedAt: z.coerce.date(),
    readingTime: z.string().min(1),
    themes: z.array(z.string().min(1)).min(1),
    status: z.enum(['draft', 'published']),
    featured: z.boolean().default(false),
    image: z.string().optional(),
  }),
});

export const collections = { articles };

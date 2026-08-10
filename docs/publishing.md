# Article publishing workflow

Articles live in `src/content/articles/` as Markdown or MDX. Their frontmatter is validated by `src/content.config.ts`; homepage, index, routing, and metadata all read the same validated entry through `src/lib/articles.ts`.

## Author

1. Copy an existing article file and give it a short, lowercase, hyphenated filename. The filename becomes the URL slug.
2. Complete every required frontmatter field: `title`, `deck`, `summary`, `publishedAt`, `themes`, `status`, and `featured`. Read time is intentionally not collected or displayed.
3. Use one or more of the approved themes: Work and Leadership, Identity and Belonging, Technology and Change, Culture and Opportunity, or Personal Reflections.
4. Write the article body in Markdown. Keep one H1—the template supplies it—and begin body sections with H2 headings.

## Preview

Set `status: draft`, run `npm run dev`, and review the prose locally before publication. Draft entries are excluded from public lists and generated article routes, so temporarily switch the status to `published` only when a deploy preview is required for editorial review.

## Publish

1. Confirm the title, deck, summary, publication date, and theme labels.
2. Set `status: published`.
3. Run `npm run build` and inspect the homepage, `/writing`, and the generated article route.
4. Inspect the generated social card at `/social/{article-slug}.png`. It is built automatically from the title and first theme using the FUQUA social artwork system; no on-site cover image is created.
5. Publish through the normal pull-request and Vercel workflow.

## Update or archive

Edit the Markdown file and publish through a pull request. To remove an article from public routes and lists without deleting its source, change `status` to `draft`. Preserve the filename when updating a published article so its URL does not change.

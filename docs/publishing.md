# Article publishing workflow

Articles live in `src/content/articles/` as Markdown or MDX. Their frontmatter is validated by `src/content.config.ts`; homepage, index, routing, and metadata all read the same validated entry through `src/lib/articles.ts`.

## Author

1. Copy an existing article file and give it a short, lowercase, hyphenated filename. The filename becomes the URL slug.
2. Complete every required frontmatter field: `title`, `deck`, `summary`, `publishedAt`, `themes`, and `status`. Set `aiAssisted` deliberately to `true` or `false`; it defaults to `false` if omitted. Read time is intentionally not collected or displayed. There is no `featured` flag: the homepage always shows the latest three published articles.
3. Use one or more of the four approved themes: Work and Leadership, Culture and Technology, Identity and Belonging, or Personal Reflections. `src/data/article-themes.ts` is the shared list for schema validation and the hidden filters; unknown labels fail the build. Put the primary theme first, because it labels article lists and social cards. Theme filters remain disabled until each theme has approximately three articles; do not enable them just because one theme reaches that count.
4. Write the article body in Markdown. Keep one H1—the template supplies it—and begin body sections with H2 headings.

### AI editing disclosure

When `aiAssisted: true`, the template adds “Written by Ladell Fuqua. AI tools assisted with editing.” once, after the essay and before the All articles link. Do not paste that note into the body. All four launch articles use the note. A discussion of AI within an essay remains part of the essay and is not removed or replaced by the disclosure.

### Optional header image

An article can intentionally have no image: omit `image` and `imageAlt`. The text begins below the byline with no empty image area; the generated FUQUA social card still works.

For an image-led article, put one source file in `src/assets/articles/` and reference it relative to the article:

```yaml
image: ../../assets/articles/example.png
imageAlt: A description of the image, including any meaningful text within it.
```

The template inserts the image; do not also insert an HTML image in the body. Astro generates WebP widths at build time, preserves the aspect ratio and dimensions, and serves a responsive `srcset`. No manual resized files or external image service are required. The same source supplies an optimized share image automatically.

The optional `socialImage` object (`url`, `width`, `height`) is an override for a deliberately different share image. Existing articles retain their published share URLs and matching MIME metadata through this override. Older files in `public/images/writing/` remain for URL compatibility; they are not the source of new responsive output and need no manually updated variants.

### Attributed quotations

Use MDX and import `ArticleQuote` from `../../components/ArticleQuote.astro` for attributed quotes. Supply `author`, `year`, and an optional verified `source` URL. The component uses the compact spacing and “— Name, Year” attribution consistently. Preserve the quoted words. Unattributed pull quotes from the essay itself can remain normal Markdown blockquotes.

## Preview

Set `status: draft`, run `npm run dev`, and review the prose locally before publication. Draft entries are excluded from public lists and generated article routes, so temporarily switch the status to `published` only when a deploy preview is required for editorial review.

## Publish

1. Confirm the title, deck, summary, publication date, and theme labels.
2. Set `status: published`. Articles appear as soon as the production deployment is ready; `publishedAt` is a calendar date, not a schedule. Use `YYYY-MM-DD`. Website dates and structured data contain no publication time.
3. Run `npm run build` and inspect the homepage, `/writing`, and the generated article route.
4. Inspect the page's Open Graph image and MIME/dimension metadata. An article without a header image uses `/social/{article-slug}.png`, built automatically from its title and first theme. An article with an image uses the optimized source or its explicit `socialImage` override.
5. Publish through the normal pull-request and Vercel workflow. `/rss.xml` is generated from the same published collection automatically, without an outside service. Its standard RSS `pubDate` encoding includes a conventional time for feed compatibility; it does not schedule publication or add a visible website timestamp.
6. Check the **Notify search engines** GitHub Action after Vercel reports a successful **Production** deployment. It compares against the preceding successful production revision, submits changed/new/removed articles, and includes `/` or `/writing` only when their lists or recorded metadata changed. Preview, failed, stale and unchanged deployments do not submit. The public key file is verified before sending. A 200/202 response acknowledges receipt; it does not prove indexing.

## Discovery metadata

Sitemap dates combine the article's `modifiedAt ?? publishedAt` with deliberate metadata/page edits in `src/data/page-updates.json`. `sharedMetadata` records significant changes to the shared identity data, independently of editorial article dates. Never advance these dates just because a build ran. Update the relevant `pages` entry when changing homepage/writing copy, links, article decks or removing entries; new article publication dates are included automatically. Use an article path entry for a significant metadata-only correction on that article. This does not add a visible Updated label.

IndexNow detects article changes using the published source and page-update records. Changes to a header image asset without a source/frontmatter change require recording the article path's actual modification date. It does not submit the sitemap as an article or send every URL for unrelated deployments.

For troubleshooting, inspect the URL set before submitting:

```
npm run indexnow -- --before <previous-production-full-SHA> --after <new-production-full-SHA> --dry-run
```

If the post-deploy Action failed, it can be rerun in GitHub. A manual retry uses the same command with `--production` instead of `--dry-run`. The script refuses to send until the requested commit is live on `https://fuquainc.com/` and belongs to `origin/main`. It never runs inside the site visitor's browser and requires no CSP changes.

## Update or archive

For a substantive editorial update, set `modifiedAt` to the actual update date (on or after `publishedAt`). This displays an Updated date and adds `dateModified` to Article metadata. Do not add or advance this date for builds, formatting, image compression, or other technical-only changes.

Edit the Markdown file and publish through a pull request. To remove an article from public routes and lists without deleting its source, change `status` to `draft`. Preserve the filename when updating a published article so its URL does not change.

# Article publishing workflow

Articles live in `src/content/articles/` as Markdown or MDX. Their frontmatter is validated by `src/content.config.ts`; homepage, index, routing, and metadata all read the same validated entry through `src/lib/articles.ts`.

## Author

1. Copy an existing article file and give it a short, lowercase, hyphenated filename. The filename becomes the URL slug.
2. Complete every required frontmatter field: `title`, `deck`, `summary`, `publishedAt`, `themes`, `status`, and `featured`. Read time is intentionally not collected or displayed.
3. Use one or more of the approved themes: Work and Leadership, Identity and Belonging, Culture and Technology, Culture and Opportunity, or Personal Reflections.
4. Write the article body in Markdown. Keep one H1—the template supplies it—and begin body sections with H2 headings.

## Preview

Set `status: draft`, run `npm run dev`, and review the prose locally before publication. Draft entries are excluded from public lists and generated article routes, so temporarily switch the status to `published` only when a deploy preview is required for editorial review.

## Publish

1. Confirm the title, deck, summary, publication date, and theme labels.
2. Set `status: published`. Articles appear as soon as the production deployment is ready; `publishedAt` is a calendar date, not a schedule. Use `YYYY-MM-DD`. Website dates and structured data contain no publication time.
3. Run `npm run build` and inspect the homepage, `/writing`, and the generated article route.
4. Inspect the generated social card at `/social/{article-slug}.png`. It is built automatically from the title and first theme using the FUQUA social artwork system; no on-site cover image is created.
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

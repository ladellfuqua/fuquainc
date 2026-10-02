# Fuqua Inc. website

The production website for [fuquainc.com](https://fuquainc.com), built with Astro and deployed through Vercel.

## Requirements

- Node.js 24.x (see `.nvmrc`)
- npm

With nvm installed, run `nvm use` before installing dependencies.

## Local setup

```sh
npm ci
cp .env.example .env.local
npm run dev
```

The contact form uses these environment-variable names:

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_RESEND_TIMEOUT_MS` (optional)

Store real values in Vercel and in an ignored local environment file. Never commit secrets. Google Analytics uses a non-secret measurement ID configured in source and runs only on `fuquainc.com` and `www.fuquainc.com`.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Astro development server |
| `npm run build` | Create the production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run check` | Run Astro and TypeScript diagnostics |
| `npm run lint` | Check JavaScript syntax, JSON, and tracked environment-file policy |
| `npm test` | Build and run site, publishing, and contact-delivery tests |
| `npm run audit:prod` | Fail on moderate-or-higher production dependency advisories |
| `npm run quality` | Run the complete CI quality gate |

## Cookie consent

Self-hosted `vanilla-cookieconsent` provides the banner and preferences; there is no paid service or remote consent dashboard. Configuration lives in `src/components/CookieConsent.astro`, with styling in `src/styles/cookie-consent.css`. The `fuqua_consent` cookie stores browser-local preferences for 180 days.

Google Analytics loads only after analytics consent, only in production builds on the live domains. `public/scripts/analytics.js` fails closed if the consent module is unavailable, checks consent again before delayed loading, clears old analytics cookies without consent, and disables analytics then refreshes the page after withdrawal. Preferences are saved before that refresh. No cookieless analytics pings are sent before opt-in.

When adding a tracker, embed, membership, or payment service, review its actual cookies and requests (including authenticated pages). Gate optional tracking explicitly; do not automatically exempt every script from a payment or login provider. Update the privacy page and bump the consent `revision` when the purposes change materially. Future membership and checkout integration requires its own verification; the current banner does not implement those features or centralized consent records.

## Article publishing

Articles live in `src/content/articles/`. See [docs/publishing.md](docs/publishing.md) for the author, preview, publish, update, and archive workflow.

## Deployment

Pull requests receive Vercel preview deployments. Merges to `main` deploy automatically to production. GitHub Actions runs `npm ci` and `npm run quality` for pull requests and pushes to `main`.

Production and preview environment variables are managed in Vercel project settings. The local `.vercel/` directory is intentionally ignored.

Production builds stop if `RESEND_API_KEY` or `CONTACT_TO_EMAIL` is missing or blank. Local, CI and preview builds do not require these secrets; a preview needs its own delivery settings to send mail. This check verifies configuration presence, not provider validity or inbox receipt. After changing the settings, redeploy to apply them to the contact function. See [docs/contact-delivery.md](docs/contact-delivery.md) for verification and recovery.

## Security and dependency policy

The production Content Security Policy is configured in `vercel.json`. Executable JavaScript must be served from an allowed external or same-origin asset; CI rejects executable inline scripts and rejects `'unsafe-inline'` in `script-src`. Inline styles remain allowed because Astro emits component styles inline; style hardening is outside LAD-23.

CI runs `npm audit --omit=dev --audit-level=moderate`. As of August 9, 2026, npm reports one accepted low-severity transitive `esbuild` advisory ([GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr)) involving the Windows development server. The production site is built and hosted on Vercel, the affected development server is not exposed, and the advisory does not meet the moderate-severity failure threshold. Recheck it with routine dependency updates and remove this exception when the upstream `tsx` dependency adopts the patched `esbuild` release.

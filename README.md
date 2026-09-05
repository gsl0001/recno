# Recno Static Site

This folder is the deployable public website package, served at `https://gsl0001.github.io/recno/` (repo `gsl0001/siteslog`, GitHub Pages). All internal links are relative so the site works from any host or subpath. Do not reference `sitelogs.app` — that domain belongs to a third party.

Deployment history: the site lived at `gsl0001.github.io/siteslog` (repo `gsl0001/siteslog`) until 2026-09-04, when it moved to `gsl0001/recno`. The old repo now serves instant redirects for every route because the shipped 1.0.0 binary (`src/constants/product.ts`) and the App Store Connect privacy/support/marketing URLs still point at `/siteslog/`. Retire those redirects only after 1.0.1 ships with the new links and ASC metadata is updated.

## Layout

- `index.html` — the marketing page: features, interactive demos, pricing, and the App Store download.
- `styles.css` — shared by every page, including the legal pages. Palette, radii **and typefaces** come from the app's own theme tokens (`src/theme/appTheme.ts`): Bricolage Grotesque for display, Geist for body, Geist Mono for data. Changing one means changing the other.
- `app.js` — interactions for the marketing page only. The legal pages load no JavaScript.
- `assets/` — screenshots exported from `docs/store/screenshots/app-store/` (560px WebP), photo crops used by the demos, the self-hosted fonts, the favicon, and the 1200x630 share card.

Required production routes:

- `/privacy/`
- `/terms/`
- `/support/`
- `/delete-data/`
- `/robots.txt`
- `/sitemap.xml`

## Fonts are self-hosted on purpose

The three woff2 files in `assets/` are the same families the app ships, served from our own origin. A page whose central claim is "on your phone, not on our server" must not hand every visitor's IP to a font CDN before first paint — and self-hosting also means the legal pages get the brand faces without each one linking a third-party stylesheet. Both families are SIL Open Font License 1.1.

## The download link

Both CTAs point at `https://apps.apple.com/us/app/id6785280739` (App Store id
`6785280739`). There is no signup form any more — the old waitlist only opened a
prefilled `mailto:` and stored nothing, so it went out with the launch.

## Interactive demos

The Sifter scan, photo stamp, and report builder on `index.html` are local illustrations of real app behaviour, driven by fixed data in `app.js`. They make no network requests. If an app behaviour they depict changes, update the demo — the copy around them is checked by `release:audit`, but the demos are not.

## Copy accuracy

Feature and privacy copy on `index.html` is written against the shipped implementation, not the roadmap. Two rules that have caught real problems before:

- Anything describing what leaves the device must match `docs/legal/privacy-policy.md` and the actual service code. Defaults matter — weather stamping and the Sifter alert are on out of the box; the activation signal and gallery-original deletion are off.
- Do not promise behaviour that has an open defect against it. Report history and cross-device restore claims were softened for exactly this reason; see `DEEP_AUDIT_2026-08-06.md`.

## Before deployment

```bash
npm run site:check
npm run release:audit
```

Then flip `PUBLIC_LEGAL_PAGES_LIVE` in `src/constants/product.ts` only after the URLs load in a browser.

# Recno Static Site

This repo is the deployed public website, served at `https://gsl0001.github.io/recno/` (repo `gsl0001/recno`, GitHub Pages). It is generated from `site/` in the private `gsl0001/sitelogs` repo; edit there and sync, do not hand-edit here. All internal links are relative so the site works from any host or subpath. Do not reference `sitelogs.app` — that domain belongs to a third party.

Deployment history: the site lived at `gsl0001.github.io/siteslog` (repo `gsl0001/siteslog`) until 2026-09-04, when it moved to `gsl0001/recno`. The old repo now serves instant redirects for every route because the shipped 1.0.0 binary (`src/constants/product.ts`) and the App Store Connect privacy/support/marketing URLs still point at `/siteslog/`. Retire those redirects only after 1.0.1 ships with the new links and ASC metadata is updated.

## Layout

- `index.html` — the marketing page: features, interactive demos, the App Store screen rail, pricing, and the download call to action.
- `styles.css` — shared by every page, including the legal pages. Palette, radii **and typefaces** come from the app's own theme tokens (`src/theme/appTheme.ts`): Bricolage Grotesque for display, Geist for body, Geist Mono for data. Changing one means changing the other.
- `app.js` — interactions for the marketing page only. The legal pages load no JavaScript.
- `assets/` — app screens cropped out of the App Store panels (`screen-*.jpg`), photo crops used by the demos, the self-hosted fonts, the favicon, and the 1200x630 share card.

Required production routes:

- `/privacy/`
- `/terms/`
- `/support/`
- `/delete-data/`
- `/robots.txt`
- `/sitemap.xml`

## Fonts are self-hosted on purpose

The three woff2 files in `assets/` are the same families the app ships, served from our own origin. A page whose central claim is "on your phone, not on our server" must not hand every visitor's IP to a font CDN before first paint — and self-hosting also means the legal pages get the brand faces without each one linking a third-party stylesheet. Both families are SIL Open Font License 1.1.

## The App Store call to action

Recno shipped on 2026-09-04, so the page sells a download, not a waitlist. Every
call to action points at `https://apps.apple.com/us/app/recno/id6785280739`. There
is no form on the site any more and `app.js` no longer collects an address — if a
signup ever comes back, disclose the processor in `docs/legal/privacy-policy.md`
and `site/privacy/index.html` before shipping it.

## Screenshots must use invented data

`assets/screen-*.jpg` are the app screens cut out of the App Store panels in
`docs/store/screenshots/asc/` — crop box `(75, 853, 1140, 1943)`, then resized to
560px wide. Those panels were rebuilt specifically so every company, address and
crew name in them is fictional.

The panels bake their headline into the image. The site does not use them whole:
the screen goes in a CSS device frame and the headline is real HTML above it, so
the words are selectable, translatable and reachable by a screen reader. Panels
01 (a photo collage, no device) and 02 (two overlapping cards, both clipped by
the panel edge) cannot yield a single clean screen, which is why the rail shows
five and not seven.

The crop is the top of a taller screen, so every frame is square-cropped at the
bottom on purpose — see the comment on `.phone` in `styles.css`.

The two images they replaced (`01-sifter.webp`, `07-daily-log.webp`) were built
from real device captures and published real client addresses — "4128 Maple Ave,
Delta", "6410 Fraser Way, Langley" — plus real crew first names, on a public
marketing site, for months. Do not source site imagery from
`docs/store/screenshots/source/b90-*.png`: those are real captures and carry the
same problem. Regenerate from the `asc/` panels instead.

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

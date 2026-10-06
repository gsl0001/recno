# Recno Static Site

This repo is the deployed public website, served at `https://recno.app/` (repo `gsl0001/recno`, GitHub Pages). It is generated from `site/` in the private `gsl0001/sitelogs` repo; edit there and sync, do not hand-edit here. All internal links are relative so the site works from any host or subpath. Do not reference `sitelogs.app` — that domain belongs to a third party.

Deployment history: the site lived at `gsl0001.github.io/siteslog` (repo `gsl0001/siteslog`) until 2026-09-04, when it moved to `gsl0001/recno`. The old repo now serves instant redirects for every route because the shipped 1.0.0 binary (`src/constants/product.ts`) and the App Store Connect privacy/support/marketing URLs still point at `/siteslog/`. Retire those redirects only after 1.0.1 ships with the new links and ASC metadata is updated.

## Layout

- `index.html` — the marketing page: features, interactive demos, real 1.1 screens, pricing, FAQ, and one App Store call to action repeated after the proof blocks.
- `styles.css` — shared by every page, including the legal pages. Palette, radii **and typefaces** come from the app's own theme tokens (`src/theme/appTheme.ts`): Bricolage Grotesque for display, Geist for body, Geist Mono for data. Changing one means changing the other.
- `llms.txt` — plain-text product summary for AI crawlers; update it when pricing or features change.
- `app.js` — interactions for the marketing page only. The legal pages load no JavaScript.
- `assets/` — `app-*.webp` are real 1.1 screens at 600px (the hero is a redacted capture from the owner's phone: the job is renamed "Maple St. Kitchen" and crew first names are placeholders), photo crops used by the demos, the self-hosted fonts, the favicon, and the 1200x630 share card.

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
call to action points at `https://apps.apple.com/app/id6785280739` (region-neutral, so Canadian and other visitors land on their own storefront). There
is no form on the site any more and `app.js` no longer collects an address — if a
signup ever comes back, disclose the processor in `docs/legal/privacy-policy.md`
and `site/privacy/index.html` before shipping it.

## Short links `/a/` to `/9/`

The 36 single-character folders are per-post short links. Each one is a static
page that redirects at once (meta refresh, no JavaScript) to the App Store
campaign link `?pt=129096683&ct=short-<char>`. Installs are then counted per
character in App Store Connect's campaign analytics. Recno's own site records
nothing. Give each post, flyer or reply its own character, and log the assignment
in `marketing/campaign/short-links.md` in `gsl0001/sitelogs`, which says which
post a character belongs to. The pages are `noindex` and are left out of the
sitemap on purpose. `npm run site:check` fails if a copy points at another
character's campaign.

## Screenshots must use invented data

The page shows three real 1.1 screens as 600px WebP, with no CSS device frame:
each capture includes the status bar and Dynamic Island, so the image reads as
the phone.

- `app-home.webp` is a capture from the owner's own phone, redacted: the real
  job address is replaced by "Maple St. Kitchen" (Bricolage Grotesque 700 at the
  app's 20pt / -0.4 spacing) and two real crew first names by "Marco" and
  "Mike", rebuilt from glyphs already in the screenshot. Any new capture from a
  real phone needs the same treatment before it ships.
- `app-report-type.webp` and `app-timesheet.webp` come from simulator runs whose
  test data was patched to the invented "Maple St. Kitchen" job.

The two images they replaced (`01-sifter.webp`, `07-daily-log.webp`) were built
from real device captures and published real client addresses — "4128 Maple Ave,
Delta", "6410 Fraser Way, Langley" — plus real crew first names, on a public
marketing site, for months. Do not source site imagery from
`docs/store/screenshots/source/b90-*.png`: those are real captures and carry the
same problem. Use simulator captures with invented data, or redact a real capture as above.

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

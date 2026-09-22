# Free photo report builder

Public route: https://gsl0001.github.io/recno/photo-report/

Self-contained browser tool: photos are decoded and resized locally, then embedded into PDF or JSON draft downloads. No photo upload, account, cloud save, or persistent browser storage. Download drafts before closing the tab. Libraries and fonts are self-hosted in vendor/ with license notices.

Features: four report types with writing prompts, client/company/site/reference metadata, up to 30 photos with captions/location/stage/reorder/rotation, up to 50 assigned actions with dates/status, preview, Letter/A4, compact/detail layouts, direct PDF and editable JSON drafts. PDF font supports Latin and other Geist glyphs; unsupported characters produce a warning and replacement. HEIC input is not supported; use JPG/PNG/WebP.

## Reproducible verification

From repository root:

- `node scripts/test-photo-report.cjs` uses the exact self-hosted PDF libraries, font and shared browser PDF code. Creates four fictional reports under tmp/photo-report-qa: Letter, A4/detail, maximum-content stress report, and unsupported-character warning. Tests draft validation, limits, roundtrip, empty export, filenames, paper sizes and link annotations.
- `python scripts/verify-photo-report-pdfs.py` requires PyMuPDF and Pillow. Checks extracted content, page numbering, all text bounds and link presence; renders representative sheets for visual review. This includes every text span in the 47-page stress report.
- Serve site/ locally and exercise photo import, captions, order, rotate, removal, action editing, draft save/reopen, invalid draft preservation and PDF download in a browser. A phone-sized browser viewport is a responsive-layout check, not a physical iPhone test.

Use only fictional fixture data. Do not commit private customer reports or downloaded drafts.

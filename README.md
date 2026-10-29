# SK Barangay Panicuason website

Static public website and Firebase-backed admin panel. The GitHub repository's
`master` branch has an existing Vercel Production integration. The local `.vercel`
link names a different project; use the repository deployment integration.

## Development and verification

- `python -m http.server 4173 --bind 127.0.0.1`
- `npm ci` then `npm test` (requires Python and installed Google Chrome).
- `node scripts/check.cjs` checks JavaScript syntax and local HTML links/assets.
- `python scripts/optimize-images.py` regenerates WebP assets with Pillow.

Playwright covers mobile menus on all 11 public pages, small/desktop layouts,
admin menus and lists, search/export, announcement saves, upload failures,
load failures, signed-out redirects, and announcement HTML sanitization.
Admin tests use a mocked Firebase backend and never write production records.
Live Firebase permissions, account roles, Storage configuration, and real
authenticated CRUD need verification with an authorized admin session.

## Content and images

The October 30, 2026 notice lives in Home and Events, with the supplied Facebook
link and a downloadable all-day calendar reminder. Facebook did not expose its
post text during implementation; the title, time, and venue were not invented.
Update both notices if the source details change. The date is explicit rather
than a permanent “upcoming” claim.

235 optimized WebP assets total approximately 13.1 MB, versus 253.7 MB of
original files (94.8% smaller). Original report images remain available in the
report lightbox; thumbnails use WebP. Below-fold images load lazily; logos load
eagerly. Vercel caches images for one day with stale-while-revalidate.

Four resolution PDFs are absent from this repository. Their actions now lead to
Contact to request a copy instead of a missing download.

Admin lists support local search and CSV export of visible records. Exports
escape spreadsheet formula prefixes. Announcement content permits basic
formatting while stripping executable HTML and unsafe link protocols.

# OpenBook

OpenBook is a tablet-first reading workspace for imported PDFs, public web books, and authenticated web reading sessions.

## What is implemented

- `apps/web`: Next.js PWA-style reader shell with:
  - library view
  - URL import task
  - authenticated bundle import
  - local PDF import
  - reader workspace with virtual pages
  - linked text notes
  - sketch notebook canvas
  - document chat panel
  - settings for API key and reader preferences
- `apps/mobile`: Expo shell that loads the web reader inside a tablet app container.
- `apps/extension`: browser extension scaffold for capturing authenticated page bundles.
- `packages/core`: domain types, seed data, and state helpers.
- `packages/import`: URL and bundle import pipeline with PDF detection and DOM extraction.
- `packages/reader`: virtual pagination and anchor helpers.
- `packages/ai`: local chunk retrieval and fallback answer generation.

## Run locally

```bash
pnpm install
pnpm dev
```

The web app runs at `http://localhost:3000/library`.

## Verification

```bash
pnpm typecheck
pnpm build
```

## Notes

- Imported PDFs are stored locally in browser state for the current MVP shell.
- The browser extension currently captures an authenticated DOM bundle and stores it in extension-local state for manual import.
- The OpenAI route degrades to a local retrieval-only answer when no API key is configured.

# OpenBook

OpenBook is a tablet-first reading workspace for imported PDFs, authenticated web captures, and reader-ready web snapshots. It turns URL imports into book-shaped snapshots, lets users highlight selected passages, save linked notes, sketch with a stylus, and ask the current book questions with multiple LLM providers.

## Current capabilities

- Library-first web app built with Next.js App Router.
- Import flows for:
  - live URL capture
  - authenticated bundle JSON import
  - local PDF upload
- Reader workspace with:
  - virtual pages for snapshot books
  - PDF fallback viewer
  - in-reader font switching with three Korean and English reading fonts
  - linked text highlights from drag selection
  - linked text notes and free-form text notebook
  - sketch notebook for Pencil and stylus-style input
  - book chat panel with retrieval-augmented context
- AI provider switching in settings:
  - OpenAI
  - Anthropic
  - xAI / Grok
  - Google Gemini
- Mobile shell via Expo WebView.
- Browser extension scaffold for authenticated capture bundles.

## Repository layout

- `apps/web`: main hosted OpenBook web app.
- `apps/mobile`: Expo tablet shell that points to the hosted web app.
- `apps/extension`: browser extension scaffold for authenticated capture.
- `packages/core`: shared types, seed state, settings helpers.
- `packages/import`: URL and bundle import pipeline.
- `packages/reader`: virtual pagination and anchor utilities.
- `packages/ai`: local retrieval and fallback answer generation.

## Local development

Requirements:

- Node.js `20.x`, `21.x`, or `22.x`
- `pnpm 10.14.0`

Install and start the web app:

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000/library`.

Useful commands:

```bash
pnpm build
pnpm typecheck
pnpm start
```

## AI settings

OpenBook does not require server-side model secrets for the MVP. Users enter provider keys in the Settings screen, and those keys are kept in browser-local storage and used only when a book chat request is sent.

Supported providers in the current app:

- OpenAI Responses API
- Anthropic Messages API
- xAI API
- Gemini generateContent API

If no API key is configured or a provider request fails, OpenBook falls back to a local retrieval-only answer.

## Deploying OpenBook

### Vercel

This repo is ready to deploy directly from the root.

Recommended project settings:

- Framework preset: `Next.js`
- Root directory: `/`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`

After deploy, verify:

- `/library`
- `/settings`
- `/api/health`

### Generic Node hosting

Any host that can run a Node process can serve the web app:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

The app honors the usual Next.js `PORT` environment variable.

### Docker

Build and run:

```bash
docker build -t openbook .
docker run --rm -p 3000:3000 openbook
```

Then open `http://localhost:3000/library`.

## Mobile shell

Run the Expo shell against a hosted or local web app:

```bash
cd apps/mobile
EXPO_PUBLIC_OPENBOOK_WEB_URL=http://localhost:3000/library pnpm start
```

## Browser extension

Load `apps/extension` as an unpacked extension in Chromium-based browsers. The current scaffold captures authenticated page bundles for manual import into the web app.

## Hosting notes and known limits

- Imported books, notes, highlights, and settings are stored in browser-local state in the current MVP.
- PDF imports are stored as local data URLs in the browser for now.
- Drag-to-highlight and linked note creation are available for snapshot-based books in the custom reader. They are not yet available inside the PDF iframe fallback or raw web shortcut fallback.
- Authenticated import is scaffolded around bundle capture; the extension and in-app webview paths are not yet production-complete.

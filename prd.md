# OpenBook PRD

## Product Summary

OpenBook is a tablet-first reading workspace for books that originate from public web pages, authenticated browser sessions, PDFs, and image-heavy web readers. It normalizes those sources into a stable book-shaped reading surface so that highlights, notes, sketches, and AI conversations stay attached to the content instead of the fragile live page.

## Target User

- Readers who regularly move between browser-based books, PDFs, and saved articles.
- Users who want a single iPad or Galaxy Tab reading interface with linked notes and AI help.
- Users who can already access the book content in their own browser session and want OpenBook to format it into a reader.

## Goals

- Import a live book page URL and turn it into a snapshot book whenever possible.
- Accept authenticated capture bundles from a browser extension for logged-in book pages.
- Accept local PDFs and open them inside the same library and reader shell.
- Provide a stable reader with virtual pagination, text highlights, linked text notes, and linked sketch notes.
- Provide a per-book AI chat flow that uses the current passage and the rest of the book as context.
- Ship a web-first MVP with matching mobile shell and extension scaffolds.

## Non-Goals

- DRM bypass, unauthorized extraction, or protection circumvention.
- Cloud sync or user account system in MVP.
- Production-grade OCR and multi-device state synchronization.
- Full native rendering parity beyond the web-driven mobile shell.

## Functional Requirements

1. Library
   - Show `Books` and `Blogs` collections.
   - Keep imported items in local-first state.
   - Allow opening source URL when a full snapshot is unavailable.
2. Imports
   - URL import should try direct PDF detection, DOM extraction, and fallback shortcut creation.
   - Bundle import should accept authenticated page capture JSON from the browser extension scaffold.
   - PDF import should accept local files and store them for the local MVP reader.
3. Reader
   - PDF items open in a PDF frame.
   - Snapshot items open in a virtual-page reader with TOC and page navigation.
   - Shortcut items open in a fallback web view.
4. Notes and Annotation
   - Support phrase-linked highlights.
   - Support free text notes linked to current page or current text anchor.
   - Support sketch notes in a per-document notebook with page linkage.
5. AI
   - Allow users to store an OpenAI API key locally.
   - Provide local chunk retrieval and a fallback answer even without API access.
6. Platforms
   - Web reader in Next.js.
   - Expo shell that embeds the web reader.
   - Browser extension that captures current page DOM bundle.

## Verification

- `pnpm typecheck`
- `pnpm build`
- Ralph loop verification story completes successfully and emits evidence.

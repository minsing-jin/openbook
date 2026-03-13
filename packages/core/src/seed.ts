import type { DocumentSnapshot, LibraryItem, NoteEntry, OpenBookState } from "./types";
import { DEFAULT_AI_MODELS } from "./ai";
import { createId, formatNow, snippetFromText } from "./utils";

function createSnapshotBook(): DocumentSnapshot {
  const fullText = [
    "OpenBook is designed for people who read across living web pages, PDFs, and image-heavy materials.",
    "Instead of treating those inputs as separate silos, the app converts them into a shared book-shaped snapshot model.",
    "The reading surface stays stable while annotations, AI conversations, and linked notes remain anchored to text blocks.",
    "Authenticated capture starts from a browser session and tries PDF discovery, DOM extraction, response capture, and OCR fallbacks."
  ].join(" ");

  return {
    docId: "seed_doc_openbook",
    kind: "snapshot_book",
    title: "Designing a Book-Shaped Reader for the Open Web",
    author: "OpenBook Editorial",
    sourceUrl: "https://example.com/openbook/designing-reader",
    language: "en",
    importMethod: "dom",
    confidence: 0.92,
    completeness: "full",
    chapters: [
      { id: "chapter_1", title: "Why snapshots matter", order: 1, pageStart: 1 },
      { id: "chapter_2", title: "Authenticated capture", order: 2, pageStart: 4 }
    ],
    toc: [
      { id: "toc_1", label: "Why snapshots matter", level: 1, blockId: "block_1" },
      { id: "toc_2", label: "Authenticated capture", level: 1, blockId: "block_4" }
    ],
    blocks: [
      {
        id: "block_1",
        type: "heading",
        order: 1,
        chapterId: "chapter_1",
        text: "Why snapshots matter",
        sourcePageIndex: 1
      },
      {
        id: "block_2",
        type: "paragraph",
        order: 2,
        chapterId: "chapter_1",
        text: "OpenBook is designed for people who read across living web pages, PDFs, and image-heavy materials.",
        sourcePageIndex: 1
      },
      {
        id: "block_3",
        type: "paragraph",
        order: 3,
        chapterId: "chapter_1",
        text: "Instead of treating those inputs as separate silos, the app converts them into a shared book-shaped snapshot model.",
        sourcePageIndex: 2
      },
      {
        id: "block_4",
        type: "heading",
        order: 4,
        chapterId: "chapter_2",
        text: "Authenticated capture",
        sourcePageIndex: 4
      },
      {
        id: "block_5",
        type: "paragraph",
        order: 5,
        chapterId: "chapter_2",
        text: "The reading surface stays stable while annotations, AI conversations, and linked notes remain anchored to text blocks.",
        sourcePageIndex: 4
      },
      {
        id: "block_6",
        type: "paragraph",
        order: 6,
        chapterId: "chapter_2",
        text: "Authenticated capture starts from a browser session and tries PDF discovery, DOM extraction, response capture, and OCR fallbacks.",
        sourcePageIndex: 5
      }
    ],
    pageImages: [
      {
        id: "page_image_1",
        pageIndex: 1,
        src: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=1200&q=80",
        alt: "Warm-toned reading desk"
      }
    ],
    fullText
  };
}

function createPdfBook(): LibraryItem {
  const now = formatNow();
  return {
    id: "seed_pdf_book",
    kind: "pdf_book",
    title: "Public Domain Essay Collection",
    sourceUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    description: "A lightweight PDF sample to validate the tablet viewer shell.",
    createdAt: now,
    lastOpenedAt: now,
    language: "en",
    tags: ["pdf", "sample"],
    importStatus: "ready"
  };
}

function createBlogSnapshot(): LibraryItem {
  const now = formatNow();
  const snapshot = createSnapshotBook();
  return {
    id: "seed_blog_snapshot",
    kind: "blog_snapshot",
    title: "OpenBook product notes",
    sourceUrl: "https://example.com/openbook/product-notes",
    description: "A saved blog-style capture using the same snapshot pipeline as books.",
    createdAt: now,
    lastOpenedAt: now,
    language: "en",
    tags: ["blog", "product"],
    importStatus: "ready",
    snapshot: {
      ...snapshot,
      docId: "seed_doc_blog",
      kind: "blog_snapshot",
      title: "OpenBook product notes",
      sourceUrl: "https://example.com/openbook/product-notes"
    }
  };
}

function createSnapshotLibraryItem(): LibraryItem {
  const now = formatNow();
  const snapshot = createSnapshotBook();
  return {
    id: "seed_snapshot_book",
    kind: "snapshot_book",
    title: snapshot.title,
    sourceUrl: snapshot.sourceUrl,
    description: snippetFromText(snapshot.fullText, 220),
    createdAt: now,
    lastOpenedAt: now,
    language: snapshot.language,
    tags: ["snapshot", "reader", "mvp"],
    importStatus: "ready",
    snapshot
  };
}

function createNotes(docId: string): NoteEntry[] {
  const now = formatNow();
  return [
    {
      id: createId("note"),
      docId,
      type: "text_note",
      title: "Why snapshot anchoring matters",
      body: "Notes and highlights should survive font-size changes, so block+offset anchors are more stable than raw page numbers.",
      pageIndex: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: createId("note"),
      docId,
      type: "sketch_note",
      title: "Reader layout sketch",
      pageIndex: 2,
      createdAt: now,
      updatedAt: now,
      strokes: [
        {
          strokeId: createId("stroke"),
          color: "#2f5d50",
          width: 4,
          tool: "pen",
          createdAt: now,
          points: [
            { x: 24, y: 30, pressure: 0.6 },
            { x: 100, y: 52, pressure: 0.8 },
            { x: 160, y: 110, pressure: 0.7 }
          ]
        }
      ]
    }
  ];
}

export function createSeedState(): OpenBookState {
  const snapshotBook = createSnapshotLibraryItem();
  const blogSnapshot = createBlogSnapshot();
  const pdfBook = createPdfBook();

  return {
    library: [snapshotBook, blogSnapshot, pdfBook],
    highlights: [
      {
        id: createId("highlight"),
        docId: snapshotBook.snapshot!.docId,
        style: "yellow",
        selectedText:
          "the app converts them into a shared book-shaped snapshot model.",
        createdAt: formatNow(),
        anchor: {
          docId: snapshotBook.snapshot!.docId,
          blockId: "block_3",
          startOffset: 38,
          endOffset: 93,
          createdPageIndex: 2
        }
      }
    ],
    notes: createNotes(snapshotBook.snapshot!.docId),
    chatThreads: [
      {
        id: createId("thread"),
        docId: snapshotBook.snapshot!.docId,
        title: "Reader architecture",
        createdAt: formatNow(),
        retrievedChunkIds: ["chunk_1", "chunk_2"],
        messages: [
          {
            id: createId("msg"),
            role: "user",
            content: "Why does OpenBook keep a snapshot model instead of rereading the live URL every time?",
            createdAt: formatNow()
          },
          {
            id: createId("msg"),
            role: "assistant",
            content:
              "Because the live page can change structure. A snapshot keeps annotations, notes, and AI citations stable across devices and font changes.",
            createdAt: formatNow()
          }
        ]
      }
    ],
    importJobs: [],
    settings: {
      aiProvider: "openai",
      aiModel: DEFAULT_AI_MODELS.openai,
      apiKeys: {
        openai: "",
        anthropic: "",
        xai: "",
        gemini: ""
      },
      captureMode: "browser-extension"
    },
    readerPreferences: {
      fontPreset: "serif",
      fontScale: 1,
      lineHeight: 1.7,
      pageCharLimit: 850,
      showFacsimile: false
    }
  };
}

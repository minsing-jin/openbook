export type LibraryKind =
  | "pdf_book"
  | "snapshot_book"
  | "snapshot_book_partial"
  | "blog_snapshot"
  | "image_facsimile_book"
  | "web_shortcut";

export type ImportStage =
  | "queued"
  | "fetching"
  | "pdf_detected"
  | "dom_extracting"
  | "ocr_processing"
  | "completed"
  | "shortcut_fallback"
  | "failed";

export type BlockType = "heading" | "paragraph" | "quote" | "code" | "list-item" | "image";

export type NoteType = "text_note" | "sketch_note";

export interface TocEntry {
  id: string;
  label: string;
  level: number;
  blockId: string;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  pageStart: number;
}

export interface PageImage {
  id: string;
  pageIndex: number;
  src: string;
  alt: string;
}

export interface DocumentBlock {
  id: string;
  type: BlockType;
  order: number;
  chapterId: string;
  text: string;
  html?: string;
  imageUrl?: string;
  sourcePageIndex: number;
}

export interface DocumentSnapshot {
  docId: string;
  kind: Exclude<LibraryKind, "web_shortcut">;
  title: string;
  author?: string;
  sourceUrl: string;
  cover?: string;
  language: string;
  importMethod: "pdf" | "dom" | "ocr" | "bundle" | "mixed";
  confidence: number;
  completeness: "full" | "partial";
  chapters: Chapter[];
  toc: TocEntry[];
  blocks: DocumentBlock[];
  pageImages: PageImage[];
  fullText: string;
}

export interface LibraryItem {
  id: string;
  kind: LibraryKind;
  title: string;
  sourceUrl: string;
  description: string;
  createdAt: string;
  lastOpenedAt?: string;
  cover?: string;
  language: string;
  tags: string[];
  importStatus: "ready" | "processing" | "partial" | "fallback";
  snapshot?: DocumentSnapshot;
}

export interface Anchor {
  docId: string;
  blockId: string;
  startOffset: number;
  endOffset: number;
  createdPageIndex: number;
  locator?: string;
}

export interface Highlight {
  id: string;
  docId: string;
  anchor: Anchor;
  style: "yellow" | "mint" | "coral" | "slate";
  selectedText: string;
  createdAt: string;
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
}

export interface SketchStroke {
  strokeId: string;
  color: string;
  width: number;
  tool: "pen" | "highlighter";
  points: StrokePoint[];
  createdAt: string;
}

export interface NoteEntry {
  id: string;
  docId: string;
  type: NoteType;
  title: string;
  body?: string;
  strokes?: SketchStroke[];
  anchor?: Anchor;
  pageIndex?: number;
  linkedHighlightId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatThread {
  id: string;
  docId: string;
  title: string;
  messages: ChatMessage[];
  retrievedChunkIds: string[];
  createdAt: string;
}

export interface ReaderPreferences {
  fontScale: number;
  lineHeight: number;
  pageCharLimit: number;
  showFacsimile: boolean;
}

export interface AppSettings {
  openAIApiKey: string;
  openAIApiModel: string;
  captureMode: "browser-extension" | "in-app-webview";
}

export interface ImportBundle {
  capturedAt: string;
  url: string;
  title: string;
  html: string;
  headings: Array<{ tag: string; text: string }>;
  links: Array<{ href: string; text: string }>;
}

export interface ImportJob {
  jobId: string;
  sourceUrl: string;
  sourceMode: "url" | "bundle";
  stage: ImportStage;
  progress: number;
  detectedKind?: LibraryKind;
  completeness: "full" | "partial" | "fallback";
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  logs: string[];
  item?: LibraryItem;
}

export interface OpenBookState {
  library: LibraryItem[];
  highlights: Highlight[];
  notes: NoteEntry[];
  chatThreads: ChatThread[];
  importJobs: ImportJob[];
  settings: AppSettings;
  readerPreferences: ReaderPreferences;
}

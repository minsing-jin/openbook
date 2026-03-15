"use client";

import {
  createId,
  createSeedState,
  formatNow,
  getActiveApiKey,
  mergeState,
  snippetFromText,
  upsertJob,
  type Anchor,
  type AppSettings,
  type ChatMessage,
  type ChatThread,
  type Highlight,
  type ImportBundle,
  type ImportJob,
  type LibraryItem,
  type NoteEntry,
  type OpenBookState,
  type ReaderPreferences,
  type SketchStroke
} from "@openbook/core";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "openbook-state-v1";

interface CreateTextNoteInput {
  docId: string;
  title: string;
  body: string;
  pageIndex?: number;
  anchor?: Anchor;
}

interface SaveSketchNoteInput {
  docId: string;
  noteId?: string;
  title: string;
  pageIndex?: number;
  strokes: SketchStroke[];
}

interface AskBookInput {
  docId: string;
  question: string;
  selection?: string;
}

type SettingsUpdate = Partial<Omit<AppSettings, "apiKeys">> & {
  apiKeys?: Partial<AppSettings["apiKeys"]>;
};

interface OpenBookContextValue {
  ready: boolean;
  state: OpenBookState;
  importUrl: (url: string) => Promise<ImportJob>;
  importBundle: (bundle: ImportBundle) => Promise<ImportJob>;
  importPdfFile: (file: File) => Promise<ImportJob>;
  addHighlight: (input: {
    docId: string;
    anchor: Anchor;
    selectedText: string;
    style: Highlight["style"];
  }) => void;
  addTextNote: (input: CreateTextNoteInput) => void;
  updateTextNote: (noteId: string, updates: Partial<Pick<NoteEntry, "title" | "body" | "pageIndex">>) => void;
  saveSketchNote: (input: SaveSketchNoteInput) => void;
  askBook: (input: AskBookInput) => Promise<void>;
  translateToKorean: (itemId: string) => Promise<LibraryItem | null>;
  updateSettings: (updates: SettingsUpdate) => void;
  updateReaderPreferences: (updates: Partial<ReaderPreferences>) => void;
  touchItem: (itemId: string) => void;
  updateReadingProgress: (itemId: string, pageIndex: number) => void;
  resetDemo: () => void;
}

const OpenBookContext = createContext<OpenBookContextValue | null>(null);

function withItemAndJob(state: OpenBookState, job: ImportJob): OpenBookState {
  const nextState: OpenBookState = {
    ...state,
    importJobs: upsertJob(state.importJobs, job)
  };

  if (!job.item) {
    return nextState;
  }

  const existingIndex = state.library.findIndex((item) => item.id === job.item!.id);
  const library =
    existingIndex === -1
      ? [job.item, ...state.library]
      : state.library.map((item, index) => (index === existingIndex ? job.item! : item));

  return {
    ...nextState,
    library
  };
}

function ensureThread(state: OpenBookState, docId: string, docTitle: string): ChatThread {
  return (
    state.chatThreads.find((thread) => thread.docId === docId) ?? {
      id: createId("thread"),
      docId,
      title: docTitle,
      messages: [],
      retrievedChunkIds: [],
      createdAt: formatNow()
    }
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function OpenBookProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OpenBookState>(createSeedState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedState = window.localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState) as Partial<OpenBookState>;
        setState((current) => mergeState(parsed, current));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const value = useMemo<OpenBookContextValue>(
    () => ({
      ready,
      state,
      async importUrl(url) {
        const response = await fetch("/api/import/url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url })
        });
        const job = (await response.json()) as ImportJob;
        setState((current) => withItemAndJob(current, job));
        return job;
      },
      async importBundle(bundle) {
        const response = await fetch("/api/import/bundle", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bundle)
        });
        const job = (await response.json()) as ImportJob;
        setState((current) => withItemAndJob(current, job));
        return job;
      },
      async importPdfFile(file) {
        const dataUrl = await fileToDataUrl(file);
        const response = await fetch("/api/import/pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, dataUrl })
        });
        const job = (await response.json()) as ImportJob;
        setState((current) => withItemAndJob(current, job));
        return job;
      },
      addHighlight(input) {
        const highlight: Highlight = {
          id: createId("highlight"),
          docId: input.docId,
          style: input.style,
          selectedText: input.selectedText,
          createdAt: formatNow(),
          anchor: input.anchor
        };

        setState((current) => ({
          ...current,
          highlights: [highlight, ...current.highlights]
        }));
      },
      addTextNote(input) {
        const now = formatNow();
        const note: NoteEntry = {
          id: createId("note"),
          docId: input.docId,
          type: "text_note",
          title: input.title,
          body: input.body,
          anchor: input.anchor,
          pageIndex: input.pageIndex,
          createdAt: now,
          updatedAt: now
        };

        setState((current) => ({
          ...current,
          notes: [note, ...current.notes]
        }));
      },
      updateTextNote(noteId, updates) {
        setState((current) => ({
          ...current,
          notes: current.notes.map((note) =>
            note.id === noteId
              ? {
                  ...note,
                  ...updates,
                  updatedAt: formatNow()
                }
              : note
          )
        }));
      },
      saveSketchNote(input) {
        setState((current) => {
          const existing = input.noteId ? current.notes.find((note) => note.id === input.noteId) : null;
          const nextNote: NoteEntry = {
            id: existing?.id ?? createId("note"),
            docId: input.docId,
            type: "sketch_note",
            title: input.title,
            strokes: input.strokes,
            pageIndex: input.pageIndex,
            createdAt: existing?.createdAt ?? formatNow(),
            updatedAt: formatNow()
          };

          const notes = existing
            ? current.notes.map((note) => (note.id === existing.id ? nextNote : note))
            : [nextNote, ...current.notes];

          return {
            ...current,
            notes
          };
        });
      },
      async askBook(input) {
        const item = state.library.find((entry) => entry.id === input.docId || entry.snapshot?.docId === input.docId);
        const snapshot = item?.snapshot ?? state.library.find((entry) => entry.id === input.docId)?.snapshot;
        if (!snapshot) {
          return;
        }

        const userMessage: ChatMessage = {
          id: createId("msg"),
          role: "user",
          content: input.question,
          createdAt: formatNow()
        };

        setState((current) => {
          const thread = ensureThread(current, snapshot.docId, snapshot.title);
          const nextThread = { ...thread, messages: [...thread.messages, userMessage] };
          const chatThreads = current.chatThreads.some((entry) => entry.id === thread.id)
            ? current.chatThreads.map((entry) => (entry.id === thread.id ? nextThread : entry))
            : [nextThread, ...current.chatThreads];
          return { ...current, chatThreads };
        });

        const response = await fetch("/api/chat/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snapshot,
            question: input.question,
            selection: input.selection,
            provider: state.settings.aiProvider,
            apiKey: getActiveApiKey(state.settings),
            model: state.settings.aiModel
          })
        });
        const payload = (await response.json()) as {
          assistantMessage: ChatMessage;
          retrievedChunkIds: string[];
        };

        setState((current) => {
          const thread = ensureThread(current, snapshot.docId, snapshot.title);
          const messages =
            thread.messages.length > 0 && thread.messages[thread.messages.length - 1]?.id === userMessage.id
              ? [...thread.messages, payload.assistantMessage]
              : [...thread.messages, userMessage, payload.assistantMessage];
          const nextThread = {
            ...thread,
            messages,
            retrievedChunkIds: payload.retrievedChunkIds
          };
          const chatThreads = current.chatThreads.some((entry) => entry.id === thread.id)
            ? current.chatThreads.map((entry) => (entry.id === thread.id ? nextThread : entry))
            : [nextThread, ...current.chatThreads];
          return { ...current, chatThreads };
        });
      },
      async translateToKorean(itemId) {
        const item = state.library.find((entry) => entry.id === itemId);
        if (!item?.snapshot) {
          return null;
        }

        const existingTranslation = state.library.find(
          (entry) => entry.translationOfItemId === item.id && entry.language === "ko"
        );
        if (existingTranslation) {
          return existingTranslation;
        }

        const response = await fetch("/api/translate/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            snapshot: item.snapshot,
            provider: state.settings.aiProvider,
            apiKey: getActiveApiKey(state.settings),
            model: state.settings.aiModel,
            targetLanguage: "ko"
          })
        });

        const payload = (await response.json()) as {
          translatedSnapshot?: LibraryItem["snapshot"];
          error?: string;
        };

        if (!response.ok || !payload.translatedSnapshot) {
          throw new Error(payload.error ?? "Translation failed");
        }

        const now = formatNow();
        const translatedItem: LibraryItem = {
          id: createId("item"),
          kind: item.kind,
          title: `${payload.translatedSnapshot.title} · 한국어`,
          sourceUrl: item.sourceUrl,
          description: snippetFromText(payload.translatedSnapshot.fullText, 220),
          createdAt: now,
          lastOpenedAt: now,
          translationOfItemId: item.id,
          language: "ko",
          tags: Array.from(new Set([...item.tags, "translation", "ko"])),
          importStatus: "ready",
          snapshot: {
            ...payload.translatedSnapshot,
            docId: createId("doc"),
            language: "ko"
          }
        };

        setState((current) => ({
          ...current,
          library: [translatedItem, ...current.library]
        }));

        return translatedItem;
      },
      updateSettings(updates) {
        setState((current) => ({
          ...current,
          settings: {
            ...current.settings,
            ...updates,
            apiKeys: updates.apiKeys
              ? {
                  ...current.settings.apiKeys,
                  ...updates.apiKeys
                }
              : current.settings.apiKeys
          }
        }));
      },
      updateReaderPreferences(updates) {
        setState((current) => ({
          ...current,
          readerPreferences: {
            ...current.readerPreferences,
            ...updates
          }
        }));
      },
      touchItem(itemId) {
        setState((current) => ({
          ...current,
          library: current.library.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  lastOpenedAt: formatNow()
                }
              : item
          )
        }));
      },
      updateReadingProgress(itemId, pageIndex) {
        setState((current) => ({
          ...current,
          library: current.library.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  lastReadPageIndex: pageIndex
                }
              : item
          )
        }));
      },
      resetDemo() {
        const seed = createSeedState();
        setState(seed);
      }
    }),
    [ready, state]
  );

  return <OpenBookContext.Provider value={value}>{children}</OpenBookContext.Provider>;
}

export function useOpenBook() {
  const context = useContext(OpenBookContext);
  if (!context) {
    throw new Error("useOpenBook must be used within OpenBookProvider");
  }

  return context;
}

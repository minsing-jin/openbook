import type {
  DocumentSnapshot,
  ImportJob,
  LibraryItem,
  NoteEntry,
  OpenBookState
} from "./types";

export function createId(prefix: string): string {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${randomPart}`;
}

export function formatNow(): string {
  return new Date().toISOString();
}

export function extractPlainText(snapshot?: DocumentSnapshot): string {
  if (!snapshot) {
    return "";
  }

  return snapshot.blocks.map((block) => block.text).join("\n\n").trim();
}

export function snippetFromText(text: string, limit = 180): string {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit - 1).trimEnd()}…`;
}

export function summarizeItem(item: LibraryItem): string {
  if (item.snapshot) {
    return snippetFromText(extractPlainText(item.snapshot), 220);
  }

  return item.description;
}

export function groupNotesByPage(notes: NoteEntry[]): Record<string, NoteEntry[]> {
  return notes.reduce<Record<string, NoteEntry[]>>((acc, note) => {
    const key = String(note.pageIndex ?? "unlinked");
    acc[key] = acc[key] ?? [];
    acc[key].push(note);
    return acc;
  }, {});
}

export function sortLibrary(library: LibraryItem[]): LibraryItem[] {
  return [...library].sort((left, right) => {
    const leftTime = left.lastOpenedAt ?? left.createdAt;
    const rightTime = right.lastOpenedAt ?? right.createdAt;
    return rightTime.localeCompare(leftTime);
  });
}

export function upsertJob(jobs: ImportJob[], job: ImportJob): ImportJob[] {
  const existingIndex = jobs.findIndex((entry) => entry.jobId === job.jobId);
  if (existingIndex === -1) {
    return [job, ...jobs];
  }

  return jobs.map((entry, index) => (index === existingIndex ? job : entry));
}

export function mergeState(partial: Partial<OpenBookState>, base: OpenBookState): OpenBookState {
  return {
    ...base,
    ...partial,
    library: partial.library ?? base.library,
    highlights: partial.highlights ?? base.highlights,
    notes: partial.notes ?? base.notes,
    chatThreads: partial.chatThreads ?? base.chatThreads,
    importJobs: partial.importJobs ?? base.importJobs,
    settings: partial.settings ?? base.settings,
    readerPreferences: partial.readerPreferences ?? base.readerPreferences
  };
}

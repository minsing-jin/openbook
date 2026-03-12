import type { Anchor, DocumentBlock, DocumentSnapshot, ReaderPreferences } from "@openbook/core";

export interface VirtualPage {
  index: number;
  title: string;
  chapterId: string;
  blocks: DocumentBlock[];
  startBlockId: string;
}

export function paginateSnapshot(
  snapshot: DocumentSnapshot,
  preferences: ReaderPreferences
): VirtualPage[] {
  const pages: VirtualPage[] = [];
  let currentPage: VirtualPage | null = null;
  let currentChars = 0;

  for (const block of snapshot.blocks) {
    const blockWeight = Math.max(block.text.length, 80);
    const limit = Math.round(preferences.pageCharLimit / preferences.fontScale);
    const shouldStartNewPage =
      currentPage === null || currentChars + blockWeight > limit || block.type === "heading";

    if (shouldStartNewPage) {
      currentPage = {
        index: pages.length + 1,
        title: block.type === "heading" ? block.text : snapshot.title,
        chapterId: block.chapterId,
        blocks: [],
        startBlockId: block.id
      };
      pages.push(currentPage);
      currentChars = 0;
    }

    if (!currentPage) {
      continue;
    }

    currentPage.blocks.push(block);
    currentChars += blockWeight;
  }

  return pages;
}

export function resolveAnchorText(snapshot: DocumentSnapshot, anchor: Anchor): string {
  const block = snapshot.blocks.find((entry) => entry.id === anchor.blockId);
  if (!block) {
    return "";
  }

  return block.text.slice(anchor.startOffset, anchor.endOffset);
}

export function findPageForBlock(pages: VirtualPage[], blockId: string): number {
  const page = pages.find((entry) => entry.blocks.some((block) => block.id === blockId));
  return page?.index ?? 1;
}

"use client";

import type { Anchor, Highlight, LibraryItem, ReadingFontPreset } from "@openbook/core";
import { paginateSnapshot, resolveAnchorText } from "@openbook/reader";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useOpenBook } from "./openbook-provider";
import { ReaderDock } from "./reader-dock";

const READING_FONT_OPTIONS: Array<{
  id: ReadingFontPreset;
  label: string;
}> = [
  {
    id: "serif",
    label: "Noto Serif KR"
  },
  {
    id: "sans",
    label: "Noto Sans KR"
  },
  {
    id: "classic",
    label: "Nanum Myeongjo"
  }
];

function readTextWithBreaksFromHtml(html?: string): string | null {
  if (!html || typeof window === "undefined") {
    return null;
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(html, "text/html");

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent ?? "";
    }

    if (!(node instanceof window.Element)) {
      return "";
    }

    if (node.tagName === "BR") {
      return "\n";
    }

    const text = Array.from(node.childNodes).map(walk).join("");
    if (node.tagName === "P" || node.tagName === "LI" || node.tagName === "BLOCKQUOTE" || node.tagName === "PRE") {
      return `${text}\n`;
    }

    return text;
  }

  const text = walk(document.body).replace(/\n{3,}/g, "\n\n").trim();
  return text || null;
}

function getDisplayText(text: string, html?: string): string {
  return readTextWithBreaksFromHtml(html) ?? text;
}

function renderHighlightedText(text: string, highlights: Highlight[]) {
  if (highlights.length === 0) {
    return text;
  }

  const sortedRanges = highlights
    .map((highlight) => [highlight.anchor.startOffset, highlight.anchor.endOffset, highlight.style] as const)
    .sort((left, right) => left[0] - right[0]);

  const segments: Array<{ text: string; style?: Highlight["style"] }> = [];
  let cursor = 0;

  for (const [start, end, style] of sortedRanges) {
    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start) });
    }
    segments.push({ text: text.slice(start, end), style });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return segments.map((segment, index) =>
    segment.style ? (
      <mark key={`${segment.text}-${index}`} className={`mark mark-${segment.style}`}>
        {segment.text}
      </mark>
    ) : (
      <span key={`${segment.text}-${index}`}>{segment.text}</span>
    )
  );
}

export function ReaderWorkspace({ itemId }: { itemId: string }) {
  const router = useRouter();
  const { ready, state, addHighlight, addTextNote, touchItem, updateReaderPreferences } = useOpenBook();
  const [currentPageIndex, setCurrentPageIndex] = useState(1);
  const [selectedText, setSelectedText] = useState("");
  const [pendingAnchor, setPendingAnchor] = useState<Anchor | undefined>(undefined);
  const [activeDockTab, setActiveDockTab] = useState<"chat" | "text" | "sketch" | null>(null);

  const item = state.library.find((entry) => entry.id === itemId);
  const pages = useMemo(() => {
    if (!item?.snapshot) {
      return [];
    }

    return paginateSnapshot(item.snapshot, state.readerPreferences);
  }, [item?.snapshot, state.readerPreferences]);

  const currentPage = pages[currentPageIndex - 1];

  const pageHighlights = useMemo(() => {
    if (!item?.snapshot) {
      return [];
    }

    return state.highlights.filter((highlight) =>
      currentPage?.blocks.some((block) => block.id === highlight.anchor.blockId)
    );
  }, [currentPage?.blocks, item?.snapshot, state.highlights]);

  useEffect(() => {
    if (item) {
      touchItem(item.id);
    }
  }, [item, touchItem]);

  useEffect(() => {
    setCurrentPageIndex(1);
    setActiveDockTab(null);
  }, [itemId]);

  useEffect(() => {
    if (selectedText) {
      setActiveDockTab("text");
    }
  }, [selectedText]);

  if (!ready) {
    return <section className="page-shell">Loading reader…</section>;
  }

  if (!item) {
    return (
      <section className="page-shell">
        <article className="panel">
          <h2>Document not found</h2>
          <p>The selected book is not in local storage. Return to the library and import it again.</p>
          <button className="button button-primary" type="button" onClick={() => router.push("/library")}>
            Back to library
          </button>
        </article>
      </section>
    );
  }

  const activeItem = item;
  const activeSnapshot = activeItem.snapshot;

  function handleSelection() {
    if (!activeSnapshot) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      return;
    }

    const anchorElement =
      selection.anchorNode instanceof Element ? selection.anchorNode : selection.anchorNode?.parentElement;
    const blockElement = anchorElement?.closest<HTMLElement>("[data-block-id]");
    const blockId = blockElement?.dataset.blockId;
    if (!blockId) {
      return;
    }

    const block = activeSnapshot.blocks.find((entry) => entry.id === blockId);
    if (!block) {
      return;
    }

    const startOffset = block.text.indexOf(text);
    if (startOffset === -1) {
      return;
    }

    const anchor: Anchor = {
      docId: activeSnapshot.docId,
      blockId,
      startOffset,
      endOffset: startOffset + text.length,
      createdPageIndex: currentPageIndex
    };
    setSelectedText(text);
    setPendingAnchor(anchor);
  }

  function createLinkedNote() {
    if (!activeSnapshot || !pendingAnchor || !selectedText) {
      return;
    }

    addTextNote({
      docId: activeSnapshot.docId,
      title: `Linked note: ${selectedText.slice(0, 24)}`,
      body: selectedText,
      pageIndex: currentPageIndex,
      anchor: pendingAnchor
    });
    window.getSelection()?.removeAllRanges();
  }

  function renderReader(itemToRender: LibraryItem) {
    if (itemToRender.kind === "pdf_book") {
      return (
        <article
          className={
            activeDockTab ? "reader-surface reader-surface-docked reader-surface-docked-open" : "reader-surface reader-surface-docked"
          }
        >
          <div className="reader-toolbar">
            <strong>{itemToRender.title}</strong>
            <span className="badge badge-soft">PDF viewer</span>
          </div>
          <iframe className="pdf-frame" src={itemToRender.sourceUrl} title={itemToRender.title} />
          <ReaderDock
            notesDocId={itemToRender.id}
            currentPageIndex={currentPageIndex}
            pendingAnchor={pendingAnchor}
            pendingSelection={selectedText}
            activeTab={activeDockTab}
            onActiveTabChange={setActiveDockTab}
          />
        </article>
      );
    }

    if (itemToRender.kind === "web_shortcut") {
      return (
        <article
          className={
            activeDockTab ? "reader-surface reader-surface-docked reader-surface-docked-open" : "reader-surface reader-surface-docked"
          }
        >
          <div className="reader-toolbar">
            <strong>{itemToRender.title}</strong>
            <span className="badge badge-soft">Web shortcut</span>
          </div>
          <p className="empty-state">Full snapshot import was not available. Open the live page inside the fallback viewer.</p>
          <iframe className="pdf-frame" src={itemToRender.sourceUrl} title={itemToRender.title} />
          <ReaderDock
            notesDocId={itemToRender.id}
            currentPageIndex={currentPageIndex}
            pendingAnchor={pendingAnchor}
            pendingSelection={selectedText}
            activeTab={activeDockTab}
            onActiveTabChange={setActiveDockTab}
          />
        </article>
      );
    }

    if (!itemToRender.snapshot || !currentPage) {
      return (
        <article className="reader-surface">
          <p>No snapshot blocks available for this item yet.</p>
        </article>
      );
    }

    return (
      <article
        className={
          activeDockTab ? "reader-surface reader-surface-docked reader-surface-docked-open" : "reader-surface reader-surface-docked"
        }
      >
        <div className="reader-toolbar">
          <div>
            <strong>{itemToRender.snapshot.title}</strong>
            <p>
              Page {currentPage.index} of {pages.length}
            </p>
          </div>
          <div className="reader-toolbar-actions">
            <div className="reader-font-switcher" role="radiogroup" aria-label="Reading font choices">
              <span className="reader-toolbar-label">Font</span>
              {READING_FONT_OPTIONS.map((fontOption) => (
                <label
                  key={fontOption.id}
                  className={
                    state.readerPreferences.fontPreset === fontOption.id
                      ? "reader-font-chip reader-font-chip-active"
                      : "reader-font-chip"
                  }
                >
                  <input
                    type="radio"
                    name="reading-font"
                    value={fontOption.id}
                    checked={state.readerPreferences.fontPreset === fontOption.id}
                    onChange={() => updateReaderPreferences({ fontPreset: fontOption.id })}
                  />
                  <span className={`reader-font-chip-label reader-font-chip-label-${fontOption.id}`}>
                    {fontOption.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="card-actions">
              <button
                className="button button-ghost"
                type="button"
                onClick={() => setCurrentPageIndex((value) => Math.max(1, value - 1))}
              >
                Previous
              </button>
              <button
                className="button button-ghost"
                type="button"
                onClick={() => setCurrentPageIndex((value) => Math.min(pages.length, value + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="reader-layout">
          <div className="toc-panel">
            <h3>Contents</h3>
            <div className="toc-list">
              {itemToRender.snapshot.toc.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={currentPage.blocks.some((block) => block.id === entry.blockId) ? "toc-link toc-link-active" : "toc-link"}
                  onClick={() => {
                    const pageIndex = pages.findIndex((page) => page.blocks.some((block) => block.id === entry.blockId));
                    setCurrentPageIndex((pageIndex >= 0 ? pageIndex : 0) + 1);
                  }}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>

          <div className="page-stage">
            <div
              className={`page-card reader-font-${state.readerPreferences.fontPreset}`}
              onMouseUp={handleSelection}
            >
              {currentPage.blocks.map((block) => {
                const blockHighlights = pageHighlights.filter((highlight) => highlight.anchor.blockId === block.id);
                const displayText = getDisplayText(block.text, block.html);
                return (
                  <div key={block.id} className={`reader-block reader-block-${block.type}`} data-block-id={block.id}>
                    {block.type === "heading" ? (
                      <h3>{block.text}</h3>
                    ) : block.type === "image" && block.imageUrl ? (
                      <figure className="image-block">
                        <img src={block.imageUrl} alt={block.text} />
                        <figcaption>{block.text}</figcaption>
                      </figure>
                    ) : (
                      <p className="reader-copy">{renderHighlightedText(displayText, blockHighlights)}</p>
                    )}
                    {blockHighlights.length > 0 ? (
                      <div className="annotation-meta">
                        {blockHighlights.map((highlight) => (
                          <span key={highlight.id} className="tag">
                            {resolveAnchorText(itemToRender.snapshot!, highlight.anchor)}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {pendingAnchor && selectedText ? (
              <div className="selection-toolbar">
                <p>Selected: “{selectedText}”</p>
                <div className="card-actions">
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={() =>
                      addHighlight({
                        docId: activeSnapshot!.docId,
                        anchor: pendingAnchor,
                        selectedText,
                        style: "yellow"
                      })
                    }
                  >
                    Highlight
                  </button>
                  <button className="button button-ghost" type="button" onClick={createLinkedNote}>
                    Linked note
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <ReaderDock
          notesDocId={itemToRender.snapshot.docId}
          chatDocId={itemToRender.snapshot.docId}
          currentPageIndex={currentPageIndex}
          pendingAnchor={pendingAnchor}
          pendingSelection={selectedText}
          activeTab={activeDockTab}
          onActiveTabChange={setActiveDockTab}
        />
      </article>
    );
  }

  return (
    <section className="reader-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">{activeItem.kind.replace(/_/g, " ")}</p>
          <h2>{activeItem.title}</h2>
        </div>
        <a className="button button-ghost" href={activeItem.sourceUrl} target="_blank" rel="noreferrer">
          Open source
        </a>
      </div>

      <div className="reader-grid">{renderReader(activeItem)}</div>
    </section>
  );
}

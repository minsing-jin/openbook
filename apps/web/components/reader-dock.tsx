"use client";

import type { Anchor, NoteEntry, SketchStroke } from "@openbook/core";
import { useEffect, useMemo, useState } from "react";
import { SketchCanvas } from "./sketch-canvas";
import { useOpenBook } from "./openbook-provider";

type ReaderDockTab = "chat" | "text" | "sketch";

interface ReaderDockProps {
  notesDocId: string;
  chatDocId?: string;
  currentPageIndex?: number;
  pendingAnchor?: Anchor;
  pendingSelection?: string;
  activeTab: ReaderDockTab | null;
  onActiveTabChange: (tab: ReaderDockTab | null) => void;
}

export function ReaderDock({
  notesDocId,
  chatDocId,
  currentPageIndex,
  pendingAnchor,
  pendingSelection,
  activeTab,
  onActiveTabChange
}: ReaderDockProps) {
  const { state, addTextNote, askBook, saveSketchNote, updateTextNote } = useOpenBook();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sketchTitle, setSketchTitle] = useState("Sketch note");
  const [activeSketchId, setActiveSketchId] = useState<string | undefined>(undefined);

  const notes = useMemo(() => state.notes.filter((note) => note.docId === notesDocId), [notesDocId, state.notes]);
  const textNotes = notes.filter((note) => note.type === "text_note");
  const sketchNotes = notes.filter((note) => note.type === "sketch_note");
  const activeSketch = sketchNotes.find((note) => note.id === activeSketchId) ?? sketchNotes[0];
  const chatThread = useMemo(
    () => (chatDocId ? state.chatThreads.find((entry) => entry.docId === chatDocId) : undefined),
    [chatDocId, state.chatThreads]
  );

  useEffect(() => {
    if (pendingSelection) {
      onActiveTabChange("text");
    }
  }, [onActiveTabChange, pendingSelection]);

  function handleCreateTextNote() {
    if (!title.trim() && !body.trim()) {
      return;
    }

    addTextNote({
      docId: notesDocId,
      title: title.trim() || "Untitled note",
      body: body.trim() || pendingSelection || "",
      pageIndex: currentPageIndex,
      anchor: pendingAnchor
    });
    setTitle("");
    setBody("");
  }

  function handleSaveSketch(strokes: SketchStroke[]) {
    saveSketchNote({
      docId: notesDocId,
      noteId: activeSketch?.id,
      title: sketchTitle,
      pageIndex: currentPageIndex,
      strokes
    });
  }

  async function handleAskBook() {
    if (!chatDocId || !question.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await askBook({
        docId: chatDocId,
        question: question.trim(),
        selection: pendingSelection
      });
      setQuestion("");
    } finally {
      setSubmitting(false);
    }
  }

  const tabs: Array<{ id: ReaderDockTab; label: string; disabled?: boolean }> = [
    { id: "chat", label: "Chat", disabled: !chatDocId },
    { id: "text", label: "Text" },
    { id: "sketch", label: "Sketch" }
  ];

  return (
    <aside className={activeTab ? "reader-dock reader-dock-open" : "reader-dock"} aria-label="Reader tools dock">
      {activeTab ? (
        <div className="reader-dock-panel">
          {activeTab === "chat" ? (
            <div className="tool-column">
              <div className="tool-panel-header">
                <div>
                  <h3>Chat with book</h3>
                  <p>Ask about the current book while keeping the selected passage in context.</p>
                </div>
              </div>
              {pendingSelection ? <p className="linked-selection">Current selection: “{pendingSelection}”</p> : null}
              <div className="chat-thread">
                {chatThread?.messages.map((message) => (
                  <article
                    key={message.id}
                    className={message.role === "assistant" ? "chat-bubble chat-assistant" : "chat-bubble chat-user"}
                  >
                    <strong>{message.role === "assistant" ? "OpenBook" : "You"}</strong>
                    <p>{message.content}</p>
                  </article>
                ))}
              </div>
              <div className="field-group">
                <label htmlFor="chat-question">Question</label>
                <textarea
                  id="chat-question"
                  className="text-area"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                  placeholder="What is the main point of this section?"
                />
              </div>
              <button className="button button-primary" type="button" onClick={handleAskBook} disabled={submitting || !chatDocId}>
                Ask the book
              </button>
            </div>
          ) : null}

          {activeTab === "text" ? (
            <div className="tool-column">
              <div className="tool-panel-header">
                <div>
                  <h3>Text notebook</h3>
                  <p>Save page-linked notes beside the book.</p>
                </div>
              </div>
              {pendingSelection ? <p className="linked-selection">Linked to selection: “{pendingSelection}”</p> : null}
              <div className="field-group">
                <label htmlFor="note-title">Title</label>
                <input id="note-title" className="text-input" value={title} onChange={(event) => setTitle(event.target.value)} />
              </div>
              <div className="field-group">
                <label htmlFor="note-body">Body</label>
                <textarea id="note-body" className="text-area" value={body} onChange={(event) => setBody(event.target.value)} />
              </div>
              <button className="button button-primary" type="button" onClick={handleCreateTextNote}>
                Save note
              </button>
              <div className="note-list">
                {textNotes.map((note: NoteEntry) => (
                  <article key={note.id} className="note-card">
                    <input
                      className="text-input note-title-input"
                      value={note.title}
                      onChange={(event) => updateTextNote(note.id, { title: event.target.value })}
                    />
                    <textarea
                      className="text-area note-body-input"
                      value={note.body ?? ""}
                      onChange={(event) => updateTextNote(note.id, { body: event.target.value })}
                    />
                    <p className="fine-print">Page {note.pageIndex ?? "unlinked"}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "sketch" ? (
            <div className="tool-column">
              <div className="tool-panel-header">
                <div>
                  <h3>Sketch notebook</h3>
                  <p>Open a page-linked canvas for stylus notes.</p>
                </div>
              </div>
              <div className="field-group">
                <label htmlFor="sketch-title">Sketch title</label>
                <input
                  id="sketch-title"
                  className="text-input"
                  value={activeSketch?.title ?? sketchTitle}
                  onChange={(event) => {
                    setSketchTitle(event.target.value);
                    setActiveSketchId(activeSketch?.id);
                  }}
                />
              </div>
              {sketchNotes.length > 0 ? (
                <div className="sketch-list">
                  {sketchNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      className={activeSketch?.id === note.id ? "segment segment-active" : "segment"}
                      onClick={() => {
                        setActiveSketchId(note.id);
                        setSketchTitle(note.title);
                      }}
                    >
                      {note.title}
                    </button>
                  ))}
                </div>
              ) : null}
              <SketchCanvas
                initialStrokes={activeSketch?.strokes ?? []}
                onSave={handleSaveSketch}
                onTitleReset={() => {
                  setActiveSketchId(undefined);
                  setSketchTitle("Sketch note");
                }}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="reader-bookmark-rail" aria-label="Reader bookmark tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={activeTab === tab.id ? "reader-bookmark-tab reader-bookmark-tab-active" : "reader-bookmark-tab"}
            onClick={() => {
              if (tab.disabled) {
                return;
              }
              onActiveTabChange(activeTab === tab.id ? null : tab.id);
            }}
            disabled={tab.disabled}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

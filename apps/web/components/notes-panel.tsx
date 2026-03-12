"use client";

import type { Anchor, NoteEntry, SketchStroke } from "@openbook/core";
import { useMemo, useState } from "react";
import { useOpenBook } from "./openbook-provider";
import { SketchCanvas } from "./sketch-canvas";

interface NotesPanelProps {
  docId: string;
  currentPageIndex?: number;
  pendingAnchor?: Anchor;
  pendingSelection?: string;
}

export function NotesPanel({ docId, currentPageIndex, pendingAnchor, pendingSelection }: NotesPanelProps) {
  const { state, addTextNote, saveSketchNote, updateTextNote } = useOpenBook();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sketchTitle, setSketchTitle] = useState("Sketch note");
  const [activeSketchId, setActiveSketchId] = useState<string | undefined>(undefined);

  const notes = useMemo(() => state.notes.filter((note) => note.docId === docId), [docId, state.notes]);
  const textNotes = notes.filter((note) => note.type === "text_note");
  const sketchNotes = notes.filter((note) => note.type === "sketch_note");
  const activeSketch = sketchNotes.find((note) => note.id === activeSketchId) ?? sketchNotes[0];

  function handleCreateTextNote() {
    if (!title.trim() && !body.trim()) {
      return;
    }

    addTextNote({
      docId,
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
      docId,
      noteId: activeSketch?.id,
      title: sketchTitle,
      pageIndex: currentPageIndex,
      strokes
    });
  }

  return (
    <div className="tool-column">
      <section className="tool-panel">
        <h3>Text notebook</h3>
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
          {textNotes.map((note) => (
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
      </section>

      <section className="tool-panel">
        <div className="tool-panel-header">
          <div>
            <h3>Sketch notebook</h3>
            <p>Use pencil or stylus gestures in a page-linked canvas.</p>
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
      </section>
    </div>
  );
}

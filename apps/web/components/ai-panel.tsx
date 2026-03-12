"use client";

import { useMemo, useState } from "react";
import { useOpenBook } from "./openbook-provider";

interface AIPanelProps {
  docId: string;
  selection?: string;
}

export function AIPanel({ docId, selection }: AIPanelProps) {
  const { state, askBook } = useOpenBook();
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const thread = useMemo(
    () => state.chatThreads.find((entry) => entry.docId === docId),
    [docId, state.chatThreads]
  );

  async function handleSubmit() {
    if (!question.trim()) {
      return;
    }

    setSubmitting(true);
    try {
      await askBook({
        docId,
        question: question.trim(),
        selection
      });
      setQuestion("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="tool-panel">
      <h3>Book chat</h3>
      <p>Ask about the full book while keeping the current passage in context.</p>
      {selection ? <p className="linked-selection">Current selection: “{selection}”</p> : null}
      <div className="chat-thread">
        {thread?.messages.map((message) => (
          <article key={message.id} className={message.role === "assistant" ? "chat-bubble chat-assistant" : "chat-bubble chat-user"}>
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
          placeholder="What design trade-off does the author make in this chapter?"
        />
      </div>
      <button className="button button-primary" type="button" onClick={handleSubmit} disabled={submitting}>
        Ask the book
      </button>
    </section>
  );
}

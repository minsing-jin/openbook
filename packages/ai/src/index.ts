import type { ChatMessage, DocumentSnapshot } from "@openbook/core";
import { createId, formatNow, snippetFromText } from "@openbook/core";

export interface RetrievalChunk {
  id: string;
  title: string;
  text: string;
  score: number;
}

export function buildChunks(snapshot: DocumentSnapshot): RetrievalChunk[] {
  const chunks: RetrievalChunk[] = [];
  let currentText = "";
  let currentTitle = snapshot.title;

  for (const block of snapshot.blocks) {
    if (block.type === "heading") {
      if (currentText.trim()) {
        chunks.push({
          id: createId("chunk"),
          title: currentTitle,
          text: currentText.trim(),
          score: 0
        });
      }
      currentTitle = block.text;
      currentText = `${block.text}\n\n`;
      continue;
    }

    currentText += `${block.text}\n\n`;
    if (currentText.length > 700) {
      chunks.push({
        id: createId("chunk"),
        title: currentTitle,
        text: currentText.trim(),
        score: 0
      });
      currentText = "";
    }
  }

  if (currentText.trim()) {
    chunks.push({
      id: createId("chunk"),
      title: currentTitle,
      text: currentText.trim(),
      score: 0
    });
  }

  return chunks;
}

export function retrieveRelevantChunks(
  snapshot: DocumentSnapshot,
  question: string,
  limit = 3
): RetrievalChunk[] {
  const tokens = question
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/i)
    .filter(Boolean);

  const chunks = buildChunks(snapshot).map((chunk) => {
    const score = tokens.reduce((acc, token) => acc + (chunk.text.toLowerCase().includes(token) ? 1 : 0), 0);
    return { ...chunk, score };
  });

  return chunks
    .sort((left, right) => right.score - left.score || right.text.length - left.text.length)
    .slice(0, limit);
}

export function buildPrompt({
  snapshot,
  selection,
  question
}: {
  snapshot: DocumentSnapshot;
  selection?: string;
  question: string;
}): string {
  const chunks = retrieveRelevantChunks(snapshot, question);
  const context = chunks
    .map((chunk, index) => `Context ${index + 1} [${chunk.title}]\n${chunk.text}`)
    .join("\n\n");

  return [
    "You are OpenBook, an assistant helping the user reason over the current book.",
    `Book title: ${snapshot.title}`,
    selection ? `Current selection: ${selection}` : "",
    `Relevant context:\n${context}`,
    `Question: ${question}`
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function createFallbackAnswer(snapshot: DocumentSnapshot, question: string): ChatMessage {
  const chunks = retrieveRelevantChunks(snapshot, question, 2);
  const content =
    chunks.length > 0
      ? chunks.map((chunk, index) => `${index + 1}. ${chunk.title}: ${snippetFromText(chunk.text, 220)}`).join("\n")
      : "No strong local context match was found. Try asking about a specific passage or chapter.";

  return {
    id: createId("msg"),
    role: "assistant",
    content,
    createdAt: formatNow()
  };
}

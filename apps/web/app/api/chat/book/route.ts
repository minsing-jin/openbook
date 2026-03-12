import type { ChatMessage, DocumentSnapshot } from "@openbook/core";
import { createFallbackAnswer, retrieveRelevantChunks } from "@openbook/ai";
import { createId, formatNow } from "@openbook/core";

function getOutputText(payload: any): string {
  if (typeof payload?.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (Array.isArray(payload?.output)) {
    const texts = payload.output
      .flatMap((item: any) => item?.content ?? [])
      .map((item: any) => item?.text)
      .filter((value: unknown): value is string => typeof value === "string");
    return texts.join("\n").trim();
  }

  return "";
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    snapshot?: DocumentSnapshot;
    question?: string;
    selection?: string;
    apiKey?: string;
    model?: string;
  };

  if (!body.snapshot || !body.question) {
    return Response.json({ error: "Missing snapshot or question" }, { status: 400 });
  }

  const retrieved = retrieveRelevantChunks(body.snapshot, body.question);

  if (!body.apiKey) {
    const assistantMessage = createFallbackAnswer(body.snapshot, body.question);
    return Response.json({ assistantMessage, retrievedChunkIds: retrieved.map((chunk) => chunk.id) });
  }

  try {
    const prompt = [
      `Book title: ${body.snapshot.title}`,
      body.selection ? `Current selection: ${body.selection}` : "",
      "Answer using the supplied book context and cite the relevant section titles when possible.",
      ...retrieved.map((chunk, index) => `Context ${index + 1} [${chunk.title}]:\n${chunk.text}`),
      `Question: ${body.question}`
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${body.apiKey}`
      },
      body: JSON.stringify({
        model: body.model || "gpt-4.1-mini",
        input: prompt
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const payload = await response.json();
    const content = getOutputText(payload);
    if (!content) {
      throw new Error("No output text returned");
    }

    const assistantMessage: ChatMessage = {
      id: createId("msg"),
      role: "assistant",
      content,
      createdAt: formatNow()
    };

    return Response.json({ assistantMessage, retrievedChunkIds: retrieved.map((chunk) => chunk.id) });
  } catch {
    const assistantMessage = createFallbackAnswer(body.snapshot, body.question);
    return Response.json({ assistantMessage, retrievedChunkIds: retrieved.map((chunk) => chunk.id), degraded: true });
  }
}

import { createId, formatNow, type AIProvider, type ChatMessage, type DocumentSnapshot } from "@openbook/core";
import { createFallbackAnswer, retrieveRelevantChunks } from "@openbook/ai";
import { requestProviderText } from "../../../../lib/provider-text";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    snapshot?: DocumentSnapshot;
    question?: string;
    selection?: string;
    provider?: AIProvider;
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
    const provider = body.provider ?? "openai";
    const prompt = [
      `Book title: ${body.snapshot.title}`,
      body.selection ? `Current selection: ${body.selection}` : "",
      "Answer using the supplied book context and cite the relevant section titles when possible.",
      ...retrieved.map((chunk, index) => `Context ${index + 1} [${chunk.title}]:\n${chunk.text}`),
      `Question: ${body.question}`
    ]
      .filter(Boolean)
      .join("\n\n");

    const content = await requestProviderText({
      provider,
      apiKey: body.apiKey,
      model: body.model,
      prompt
    });
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

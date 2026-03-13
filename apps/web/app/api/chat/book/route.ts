import { DEFAULT_AI_MODELS, createId, formatNow, type AIProvider, type ChatMessage, type DocumentSnapshot } from "@openbook/core";
import { createFallbackAnswer, retrieveRelevantChunks } from "@openbook/ai";

export const runtime = "nodejs";

function getResponsesOutputText(payload: any): string {
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

function getAnthropicOutputText(payload: any): string {
  if (!Array.isArray(payload?.content)) {
    return "";
  }

  return payload.content
    .map((item: any) => item?.text)
    .filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
    .join("\n")
    .trim();
}

function getGeminiOutputText(payload: any): string {
  if (!Array.isArray(payload?.candidates)) {
    return "";
  }

  return payload.candidates
    .flatMap((candidate: any) => candidate?.content?.parts ?? [])
    .map((part: any) => part?.text)
    .filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
    .join("\n")
    .trim();
}

async function requestProviderCompletion(input: {
  provider: AIProvider;
  apiKey: string;
  model: string;
  prompt: string;
}): Promise<string> {
  const { apiKey, model, prompt, provider } = input;

  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status}`);
    }

    return getAnthropicOutputText(await response.json());
  }

  if (provider === "gemini") {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed: ${response.status}`);
    }

    return getGeminiOutputText(await response.json());
  }

  const endpoint = provider === "xai" ? "https://api.x.ai/v1/responses" : "https://api.openai.com/v1/responses";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      input: prompt
    })
  });

  if (!response.ok) {
    throw new Error(`${provider} request failed: ${response.status}`);
  }

  return getResponsesOutputText(await response.json());
}

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

    const content = await requestProviderCompletion({
      provider,
      apiKey: body.apiKey,
      model: body.model || DEFAULT_AI_MODELS[provider],
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

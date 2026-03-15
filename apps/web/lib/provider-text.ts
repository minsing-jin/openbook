import { DEFAULT_AI_MODELS, type AIProvider } from "@openbook/core";

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

export async function requestProviderText(input: {
  provider?: AIProvider;
  apiKey: string;
  model?: string;
  prompt: string;
}): Promise<string> {
  const provider = input.provider ?? "openai";
  const model = input.model || DEFAULT_AI_MODELS[provider];

  if (provider === "anthropic") {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": input.apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: 1400,
        messages: [{ role: "user", content: input.prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed: ${response.status}`);
    }

    return getAnthropicOutputText(await response.json());
  }

  if (provider === "gemini") {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(input.apiKey)}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: input.prompt }]
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
      Authorization: `Bearer ${input.apiKey}`
    },
    body: JSON.stringify({
      model,
      input: input.prompt
    })
  });

  if (!response.ok) {
    throw new Error(`${provider} request failed: ${response.status}`);
  }

  return getResponsesOutputText(await response.json());
}

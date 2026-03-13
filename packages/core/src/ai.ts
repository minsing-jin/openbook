import type { AIProvider, AppSettings } from "./types";

export const DEFAULT_AI_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4.1-mini",
  anthropic: "claude-sonnet-4-20250514",
  xai: "grok-4.20-beta-latest-non-reasoning",
  gemini: "gemini-2.5-flash"
};

export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  xai: "xAI / Grok",
  gemini: "Google Gemini"
};

export const AI_MODEL_PRESETS: Record<AIProvider, string[]> = {
  openai: ["gpt-4.1-mini", "gpt-4.1", "gpt-5"],
  anthropic: ["claude-sonnet-4-20250514", "claude-opus-4-20250514"],
  xai: ["grok-4.20-beta-latest-non-reasoning", "grok-4-1-fast-reasoning"],
  gemini: ["gemini-2.5-flash", "gemini-2.5-pro"]
};

export function getActiveApiKey(settings: AppSettings): string {
  return settings.apiKeys[settings.aiProvider] ?? "";
}

import { createAnthropic } from "@ai-sdk/anthropic";

export const routerhub = createAnthropic({
  baseURL: process.env.ROUTERHUB_API_KEY?.startsWith("sk-rh")
    ? "https://api.routerhub.ai"
    : undefined,
  apiKey: process.env.ROUTERHUB_API_KEY,
});

export const DEFAULT_MODEL = process.env.ROUTERHUB_MODEL || "anthropic/claude-opus-4-20250514";

export function getModel() {
  return routerhub(DEFAULT_MODEL);
}

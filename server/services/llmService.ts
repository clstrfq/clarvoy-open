import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

export type LLMProvider = "openai" | "claude" | "gemini";

export interface LLMStreamOptions {
  provider: LLMProvider;
  systemPrompt: string;
  userMessage: string;
  onChunk: (content: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  shouldAbort?: () => boolean;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const gemini = new GoogleGenAI({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
});

export const PROVIDER_INFO: Record<LLMProvider, { name: string; model: string }> = {
  openai: { name: "OpenAI", model: "gpt-4o" },
  claude: { name: "Claude", model: "claude-sonnet-4-5" },
  gemini: { name: "Gemini", model: "gemini-2.5-flash" },
};

export async function streamLLMResponse(options: LLMStreamOptions): Promise<void> {
  const { provider, systemPrompt, userMessage, onChunk, onDone, onError, shouldAbort } = options;

  try {
    switch (provider) {
      case "openai":
        await streamOpenAI(systemPrompt, userMessage, onChunk, onDone, shouldAbort);
        break;
      case "claude":
        await streamClaude(systemPrompt, userMessage, onChunk, onDone, shouldAbort);
        break;
      case "gemini":
        await streamGemini(systemPrompt, userMessage, onChunk, onDone, shouldAbort);
        break;
      default:
        onError(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`LLM streaming error (${provider}):`, error);
    onError("AI coaching temporarily unavailable");
  }
}

async function streamOpenAI(
  systemPrompt: string,
  userMessage: string,
  onChunk: (content: string) => void,
  onDone: () => void,
  shouldAbort?: () => boolean
) {
  const stream = await openai.chat.completions.create({
    model: PROVIDER_INFO.openai.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    stream: true,
    max_completion_tokens: 8192,
  });

  for await (const chunk of stream) {
    if (shouldAbort?.()) return;
    const content = chunk.choices[0]?.delta?.content || "";
    if (content) onChunk(content);
  }
  if (shouldAbort?.()) return;
  onDone();
}

async function streamClaude(
  systemPrompt: string,
  userMessage: string,
  onChunk: (content: string) => void,
  onDone: () => void,
  shouldAbort?: () => boolean
) {
  const stream = anthropic.messages.stream({
    model: PROVIDER_INFO.claude.model,
    max_tokens: 8192,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  for await (const event of stream) {
    if (shouldAbort?.()) return;
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      const content = event.delta.text;
      if (content) onChunk(content);
    }
  }
  if (shouldAbort?.()) return;
  onDone();
}

async function streamGemini(
  systemPrompt: string,
  userMessage: string,
  onChunk: (content: string) => void,
  onDone: () => void,
  shouldAbort?: () => boolean
) {
  const stream = await gemini.models.generateContentStream({
    model: PROVIDER_INFO.gemini.model,
    contents: [
      { role: "user", parts: [{ text: userMessage }] },
    ],
    config: {
      maxOutputTokens: 8192,
      systemInstruction: systemPrompt,
    },
  });

  for await (const chunk of stream) {
    if (shouldAbort?.()) return;
    const content = chunk.text || "";
    if (content) onChunk(content);
  }
  if (shouldAbort?.()) return;
  onDone();
}

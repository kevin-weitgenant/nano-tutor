// TypeScript interfaces for Chrome's Prompt API (Gemini Nano)

export interface LanguageModelSession {
  promptStreaming: (prompt: string) => AsyncIterable<string>
  destroy?: () => void
  temperature?: number
  topK?: number

  // Token counting and quota management (official API)
  measureInputUsage: (input: string) => Promise<number>
  inputUsage: number  // Current token usage (read-only)
  inputQuota: number  // Total token quota available (read-only)

  // Legacy properties (for backward compatibility, not in official spec)
  maxTokens?: number
  tokensSoFar?: number
  tokensLeft?: number
}

export interface LanguageModel {
  create: (options: {
    temperature?: number
    topK?: number
    initialPrompts?: Array<{ role: string; content: string }>
  }) => Promise<LanguageModelSession>
  params?: () => Promise<{
    defaultTopK: number
    maxTopK: number
    defaultTemperature: number
    maxTemperature: number
  }>
}

declare global {
  interface Window {
    // Stable API shape
    LanguageModel?: LanguageModel
  }
  // Stable API shape
  var LanguageModel: LanguageModel | undefined
}

export {}


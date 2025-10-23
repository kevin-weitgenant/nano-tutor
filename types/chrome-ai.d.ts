// TypeScript interfaces for Chrome's Prompt API (Gemini Nano)

export interface LanguageModelSession {
  promptStreaming: (prompt: string) => AsyncIterable<string>
  destroy?: () => void
  temperature?: number
  topK?: number
  maxTokens?: number
  tokensSoFar?: number
  tokensLeft?: number
  inputQuota?: number
  inputUsage?: number
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
    // New API shape (Chrome Canary/newer versions)
    ai?: {
      languageModel?: LanguageModel
    }
    // Old API shape (Chrome Stable/older versions)
    LanguageModel?: LanguageModel
  }
  // New API shape
  var ai:
    | {
        languageModel?: LanguageModel
      }
    | undefined
  // Old API shape
  var LanguageModel: LanguageModel | undefined
}

export {}


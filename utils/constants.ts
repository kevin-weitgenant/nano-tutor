export const SYSTEM_PROMPT = "You are a helpful and friendly assistant."

export const AI_CONFIG = {
  temperature: 1,
  topK: 3
} as const

export const ERROR_MESSAGES = {
  API_NOT_AVAILABLE:
    "⚠️ Prompt API not available. Please ensure you're using Chrome 138+ or enable Chrome AI in chrome://flags/#optimization-guide-on-device-model and restart Chrome.",
  SESSION_INIT_FAILED: "Failed to initialize AI session",
  STREAMING_ERROR: "Error occurred during streaming"
} as const

export const INITIAL_BOT_MESSAGE = {
  text: "Hello! I'm your AI assistant powered by Gemini Nano. How can I help you today?",
  sender: "bot" as const
}


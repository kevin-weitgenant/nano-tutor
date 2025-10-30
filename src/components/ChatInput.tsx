import { useEffect, useState } from "react"
import type { TokenInfo } from "../hooks/useStreamingResponse"
import type { LanguageModelSession } from "../types/chrome-ai"
import type { EmbeddingProgress } from "../types/transcript"
import { EmbeddingProgressBar } from "./EmbeddingProgressBar"

interface ChatInputProps {
  inputText: string
  setInputText: (text: string) => void
  onSend: () => void
  isStreaming: boolean
  apiAvailable: boolean | null
  tokenInfo: TokenInfo
  session: LanguageModelSession | null
  onReset: () => void
  isEmbedding: boolean
  embeddingProgress?: EmbeddingProgress
}

/**
 * Input area component with textarea and send button
 * Handles user message input and submission
 */
export function ChatInput({
  inputText,
  setInputText,
  onSend,
  isStreaming,
  apiAvailable,
  tokenInfo,
  session,
  onReset,
  isEmbedding,
  embeddingProgress
}: ChatInputProps) {
  const [inputTokenCount, setInputTokenCount] = useState<number | null>(null)
  const [measuringTokens, setMeasuringTokens] = useState(false)

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  // Measure input tokens with debounce
  useEffect(() => {
    if (!session || !inputText.trim()) {
      setInputTokenCount(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        setMeasuringTokens(true)
        const count = await session.measureInputUsage(inputText)
        setInputTokenCount(count)
      } catch (error) {
        console.error("Failed to measure input tokens:", error)
        setInputTokenCount(null)
      } finally {
        setMeasuringTokens(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [inputText, session])

  const { inputUsage, tokensLeft, inputQuota, systemPromptTokens, totalUsage } = tokenInfo
  const hasTokenInfo = inputQuota > 0

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      {/* Show embedding progress if embedding is in progress */}
      {isEmbedding && embeddingProgress && (
        <EmbeddingProgressBar progress={embeddingProgress} />
      )}

      <div className="flex gap-2">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={!apiAvailable}
          className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          rows={3}
        />
        <div className="flex flex-col gap-2">
          <button
            onClick={onReset}
            disabled={!apiAvailable}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm">
            Reset
          </button>
          <button
            onClick={onSend}
            disabled={!inputText.trim() || isStreaming || !apiAvailable || !session || isEmbedding}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm">
            {isEmbedding ? "Embedding..." : isStreaming ? "Thinking..." : "Send"}
          </button>
        </div>
      </div>

      {/* Input token counter */}
      {inputTokenCount !== null && apiAvailable && (
        <p className="text-xs text-gray-600 mt-2">
          This message will use ~{inputTokenCount.toLocaleString()} tokens
          {measuringTokens && " (calculating...)"}
        </p>
      )}

      {/* Comprehensive token display */}
      <div className="flex flex-col gap-2 mt-3 mb-2">
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
            Quota: {hasTokenInfo ? inputQuota.toLocaleString() : "--"}
          </span>
          <span className="text-gray-400">•</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
            System: {hasTokenInfo ? systemPromptTokens.toLocaleString() : "--"}
          </span>
          <span className="text-gray-400">•</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            Messages: {hasTokenInfo ? inputUsage.toLocaleString() : "--"}
          </span>
          <span className="text-gray-400">•</span>
          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
            Left: {hasTokenInfo ? tokensLeft.toLocaleString() : "--"}
          </span>
        </div>
        {systemPromptTokens > 0 && hasTokenInfo && (
          <p className="text-xs text-gray-600">
            Total used: {totalUsage.toLocaleString()} tokens (System: {systemPromptTokens.toLocaleString()} + Messages: {inputUsage.toLocaleString()})
          </p>
        )}
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-500">
        {apiAvailable
          ? "Press Enter to send, Shift+Enter for new line"
          : "Enable Chrome AI to use this chatbot"}
      </p>
    </div>
  )
}


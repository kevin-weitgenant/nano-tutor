import { useRef, useState } from "react"
import type { LanguageModelSession } from "../types/chrome-ai"
import type { Message } from "../types/message"
import { ERROR_MESSAGES } from "../utils/constants"

interface UseStreamingResponseReturn {
  isStreaming: boolean
  sendMessage: (text: string) => Promise<void>
}

/**
 * Custom hook to handle streaming AI responses
 * Manages message streaming state and updates messages in real-time
 */
export function useStreamingResponse(
  session: LanguageModelSession | null,
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
): UseStreamingResponseReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const streamingMessageRef = useRef<string>("")
  const streamingMessageIdRef = useRef<number | null>(null)

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming || !session) return

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: text,
      sender: "user",
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])

    // Set streaming state
    setIsStreaming(true)
    streamingMessageRef.current = ""

    try {
      // Stream the response
      const stream = await session.promptStreaming(text)
      let previousContent = ""

      for await (const chunk of stream) {
        // Calculate new content (avoiding repetition)
        const newChunk = chunk.startsWith(previousContent)
          ? chunk.slice(previousContent.length)
          : chunk

        streamingMessageRef.current += newChunk
        previousContent = chunk

        // Update or create bot message
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1]

          // If we're updating the current streaming message
          if (
            streamingMessageIdRef.current &&
            lastMessage?.id === streamingMessageIdRef.current
          ) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                text: streamingMessageRef.current
              }
            ]
          }

          // Create new bot message
          const newBotMessage: Message = {
            id: Date.now(),
            text: streamingMessageRef.current,
            sender: "bot",
            timestamp: new Date()
          }
          streamingMessageIdRef.current = newBotMessage.id

          return [...prev, newBotMessage]
        })
      }
    } catch (error) {
      console.error("Error during streaming:", error)
      const errorMessage: Message = {
        id: Date.now(),
        text: `${ERROR_MESSAGES.STREAMING_ERROR}: ${error instanceof Error ? error.message : "Unknown error"}`,
        sender: "bot",
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      // Reset streaming state
      setIsStreaming(false)
      streamingMessageRef.current = ""
      streamingMessageIdRef.current = null
    }
  }

  return { isStreaming, sendMessage }
}


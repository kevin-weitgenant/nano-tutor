import { useEffect, useRef, useState } from "react"
import type { LanguageModelSession } from "../types/chrome-ai"
import type { Message } from "../types/message"
import { ERROR_MESSAGES } from "../utils/constants"

export interface TokenInfo {
  inputUsage: number         // Tokens used so far (user messages only)
  tokensLeft: number         // Tokens remaining (calculated)
  inputQuota: number         // Total token quota
  systemPromptTokens: number // Tokens used by system prompt (transcript)
  totalUsage: number         // Total tokens used (system + user messages)
}

interface UseStreamingResponseReturn {
  isStreaming: boolean
  sendMessage: (text: string) => Promise<void>
  tokenInfo: TokenInfo
  resetTokenInfo: () => void
}

/**
 * Custom hook to handle streaming AI responses
 * Manages message streaming state and updates messages in real-time
 */
export function useStreamingResponse(
  session: LanguageModelSession | null,
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  systemPromptTokens: number = 0
): UseStreamingResponseReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    inputUsage: 0,
    tokensLeft: 0,
    inputQuota: 0,
    systemPromptTokens: 0,
    totalUsage: 0
  })
  const streamingMessageRef = useRef<string>("")
  const streamingMessageIdRef = useRef<number | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize token info when session is ready
  useEffect(() => {
    if (session?.inputUsage !== undefined && session?.inputQuota !== undefined) {
      const usage = session.inputUsage ?? 0
      const quota = session.inputQuota ?? 0
      const totalUsage = usage + systemPromptTokens

      setTokenInfo({
        inputUsage: usage,
        tokensLeft: quota - totalUsage,
        inputQuota: quota,
        systemPromptTokens: systemPromptTokens,
        totalUsage: totalUsage
      })
    }
  }, [session, systemPromptTokens])

  // Cleanup throttle timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  // Throttled update function to limit re-renders during streaming
  // Updates at most every 16ms (60 FPS) for optimal performance
  const updateStreamingMessage = (forceUpdate: boolean = false) => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current
    const THROTTLE_MS = 16 // 60 FPS

    const performUpdate = () => {
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
          sender: "bot"
        }
        streamingMessageIdRef.current = newBotMessage.id

        return [...prev, newBotMessage]
      })
      lastUpdateTimeRef.current = Date.now()
    }

    // Clear any pending timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
      updateTimeoutRef.current = null
    }

    // Force immediate update or check throttle window
    if (forceUpdate || timeSinceLastUpdate >= THROTTLE_MS) {
      performUpdate()
    } else {
      // Schedule update for next throttle window
      const delay = THROTTLE_MS - timeSinceLastUpdate
      updateTimeoutRef.current = setTimeout(() => {
        performUpdate()
        updateTimeoutRef.current = null
      }, delay)
    }
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming || !session) return

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: text,
      sender: "user"
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

        // Update with throttling (max 60 FPS)
        updateStreamingMessage()
      }

      // Force final update to ensure last chunk is displayed
      updateStreamingMessage(true)
    } catch (error) {
      console.error("Error during streaming:", error)
      const errorMessage: Message = {
        id: Date.now(),
        text: `${ERROR_MESSAGES.STREAMING_ERROR}: ${error instanceof Error ? error.message : "Unknown error"}`,
        sender: "bot"
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      // Clear any pending throttle timeout
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
        updateTimeoutRef.current = null
      }

      // Reset streaming state
      setIsStreaming(false)
      streamingMessageRef.current = ""
      streamingMessageIdRef.current = null

      // Update token information from session
      if (session?.inputUsage !== undefined && session?.inputQuota !== undefined) {
        const usage = session.inputUsage ?? 0
        const quota = session.inputQuota ?? 0
        const totalUsage = usage + systemPromptTokens
        setTokenInfo({
          inputUsage: usage,
          tokensLeft: quota - totalUsage,
          inputQuota: quota,
          systemPromptTokens: systemPromptTokens,
          totalUsage: totalUsage
        })
      }
    }
  }

  const resetTokenInfo = () => {
    setTokenInfo({
      inputUsage: 0,
      tokensLeft: 0,
      inputQuota: 0,
      systemPromptTokens: 0,
      totalUsage: 0
    })
  }

  return { isStreaming, sendMessage, tokenInfo, resetTokenInfo }
}


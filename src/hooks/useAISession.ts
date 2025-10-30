import { useEffect, useState } from "react"
import type { LanguageModelSession } from "../types/chrome-ai"
import type { Message } from "../types/message"
import type { VideoContext } from "../types/transcript"
import { AI_CONFIG, buildSystemPrompt, ERROR_MESSAGES } from "../utils/constants"
import { decideRAGStrategy } from "../utils/ragDecision"
import { estimateTokens } from "../utils/tokenEstimation"

interface UseAISessionProps {
  videoContext: VideoContext | null
  shouldInitialize: boolean
  setUsingRAG: (using: boolean) => void
}

interface UseAISessionReturn {
  session: LanguageModelSession | null
  apiAvailable: boolean | null
  initializationMessages: Message[]
  resetSession: () => Promise<void>
  systemPromptTokens: number
}

/**
 * Custom hook to manage AI session initialization and cleanup.
 * Checks for Prompt API availability and creates a session based on video context.
 * @param videoContext The video context to use for the session.
 */
export function useAISession({
  videoContext,
  shouldInitialize,
  setUsingRAG
}: UseAISessionProps): UseAISessionReturn {
  const [session, setSession] = useState<LanguageModelSession | null>(null)
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null)
  const [initializationMessages, setInitializationMessages] = useState<
    Message[]
  >([])
  const [systemPromptTokens, setSystemPromptTokens] = useState<number>(0)

  useEffect(() => {
    const initializeSession = async () => {
      // Don't initialize if we shouldn't yet (e.g., model not available)
      if (!shouldInitialize) {
        return
      }

      if (!("LanguageModel" in self)) {
        setApiAvailable(false)
        const errorMessage: Message = {
          id: Date.now(),
          text: ERROR_MESSAGES.API_NOT_AVAILABLE,
          sender: "bot"
        }
        setInitializationMessages([errorMessage])
        return
      }

      setApiAvailable(true)

      try {
        const newSession = await createSession(videoContext)
        setSession(newSession)
      } catch (error) {
        console.error("Failed to create session:", error)
        const errorMessage: Message = {
          id: Date.now(),
          text: `${ERROR_MESSAGES.SESSION_INIT_FAILED}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          sender: "bot"
        }
        setInitializationMessages([errorMessage])
      }
    }

    initializeSession()

    // Cleanup: destroy session on unmount or when videoContext changes
    return () => {
      session?.destroy()
    }
  }, [videoContext, shouldInitialize])

  // Helper function to create a new session with dynamic system prompt
  const createSession = async (
    context?: VideoContext
  ): Promise<LanguageModelSession | null> => {
    if (!("LanguageModel" in self)) return null

    const languageModel = self.LanguageModel!
    let systemPrompt: string
    
    // Decide strategy based on context
    if (!context) {
      systemPrompt = buildSystemPrompt()
      setUsingRAG(false)
    } else {
      const { systemPrompt: ragPrompt, shouldUseRAG } = await decideRAGStrategy(
        context,
        languageModel
      )
      systemPrompt = ragPrompt
      setUsingRAG(shouldUseRAG)
    }
    
    console.log(`💬 System Prompt (${systemPrompt.length} chars):`, systemPrompt.substring(0, 150) + '...')
    
    // Create session with determined system prompt
    const session = await languageModel.create({
      temperature: AI_CONFIG.temperature,
      topK: AI_CONFIG.topK,
      initialPrompts: [{ role: "system", content: systemPrompt }]
    })

    // Use fast estimation instead of async measurement to avoid race condition
    setSystemPromptTokens(estimateTokens(systemPrompt))

    return session
  }

  // Reset session function - destroys current session and creates a new one
  const resetSession = async () => {
    try {
      // Destroy current session if it exists
      if (session?.destroy) {
        session.destroy()
      }

      // Create new session with current video context
      const newSession = await createSession(videoContext)
      setSession(newSession)
    } catch (error) {
      console.error("Failed to reset session:", error)
      const errorMessage: Message = {
        id: Date.now(),
        text: `Failed to reset session: ${error instanceof Error ? error.message : "Unknown error"}`,
        sender: "bot"
      }
      setInitializationMessages([errorMessage])
    }
  }

  return {
    session,
    apiAvailable,
    initializationMessages,
    resetSession,
    systemPromptTokens
  }
}
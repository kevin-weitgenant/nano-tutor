import { useEffect, useState } from "react";



import type { LanguageModelSession } from "../types/chrome-ai";
import type { Message } from "../types/message";
import type { VideoContext } from "../types/transcript";
import { AI_CONFIG, buildSystemPrompt, ERROR_MESSAGES } from "../utils/constants";


interface UseAISessionProps {
  videoContext: VideoContext | null
  shouldInitialize: boolean
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
  shouldInitialize
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
    if (!("LanguageModel" in self)) {
      return null
    }

    const languageModel = self.LanguageModel!

    // Build system prompt based on video context
    const systemPrompt = buildSystemPrompt(context)

    const newSession = await languageModel.create({
      temperature: AI_CONFIG.temperature,
      topK: AI_CONFIG.topK,
      initialPrompts: [
        {
          role: "system",
          content: systemPrompt
        }
      ]
    })

    // Measure system prompt tokens
    try {
      const tokens = await newSession.measureInputUsage(systemPrompt)
      setSystemPromptTokens(tokens)
    } catch (error) {
      console.error("Failed to measure system prompt tokens:", error)
      setSystemPromptTokens(0)
    }

    return newSession
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
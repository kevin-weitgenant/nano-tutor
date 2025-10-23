import { useEffect, useState } from "react"
import type { LanguageModelSession } from "../types/chrome-ai"
import type { Message } from "../types/message"
import { SYSTEM_PROMPT, AI_CONFIG, ERROR_MESSAGES } from "../utils/constants"

interface UseAISessionReturn {
  session: LanguageModelSession | null
  apiAvailable: boolean | null
  initializationMessages: Message[]
  resetSession: () => Promise<void>
}

/**
 * Custom hook to manage AI session initialization and cleanup
 * Checks for Prompt API availability and creates a session
 */
export function useAISession(): UseAISessionReturn {
  const [session, setSession] = useState<LanguageModelSession | null>(null)
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null)
  const [initializationMessages, setInitializationMessages] = useState<
    Message[]
  >([])

  // Helper function to create a new session
  const createSession = async (): Promise<LanguageModelSession | null> => {
    // Check if LanguageModel API is available (supports both old and new API shapes)
    const hasNewAPI = "ai" in self && self.ai?.languageModel
    const hasOldAPI = "LanguageModel" in self

    if (!hasNewAPI && !hasOldAPI) {
      return null
    }

    const languageModel = hasNewAPI
      ? self.ai!.languageModel!
      : self.LanguageModel!

    const newSession = await languageModel.create({
      temperature: AI_CONFIG.temperature,
      topK: AI_CONFIG.topK,
      initialPrompts: [
        {
          role: "system",
          content: SYSTEM_PROMPT
        }
      ]
    })
    return newSession
  }

  // Reset session function - destroys current session and creates a new one
  const resetSession = async () => {
    try {
      // Destroy current session if it exists
      if (session?.destroy) {
        session.destroy()
      }

      // Create new session
      const newSession = await createSession()
      setSession(newSession)
    } catch (error) {
      console.error("Failed to reset session:", error)
      const errorMessage: Message = {
        id: Date.now(),
        text: `Failed to reset session: ${error instanceof Error ? error.message : "Unknown error"}`,
        sender: "bot",
        timestamp: new Date()
      }
      setInitializationMessages([errorMessage])
    }
  }

  useEffect(() => {
    const checkAPIAndInitialize = async () => {
      // Check if LanguageModel API is available (supports both old and new API shapes)
      const hasNewAPI = "ai" in self && self.ai?.languageModel
      const hasOldAPI = "LanguageModel" in self

      if (!hasNewAPI && !hasOldAPI) {
        setApiAvailable(false)
        const errorMessage: Message = {
          id: Date.now(),
          text: ERROR_MESSAGES.API_NOT_AVAILABLE,
          sender: "bot",
          timestamp: new Date()
        }
        setInitializationMessages([errorMessage])
        return
      }

      setApiAvailable(true)

      // Create initial session
      try {
        const newSession = await createSession()
        setSession(newSession)
      } catch (error) {
        console.error("Failed to create session:", error)
        const errorMessage: Message = {
          id: Date.now(),
          text: `${ERROR_MESSAGES.SESSION_INIT_FAILED}: ${error instanceof Error ? error.message : "Unknown error"}`,
          sender: "bot",
          timestamp: new Date()
        }
        setInitializationMessages([errorMessage])
      }
    }

    checkAPIAndInitialize()

    // Cleanup: destroy session on unmount
    return () => {
      if (session?.destroy) {
        session.destroy()
      }
    }
  }, [])

  return { session, apiAvailable, initializationMessages, resetSession }
}


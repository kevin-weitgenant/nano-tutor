import { useEffect, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import type { LanguageModelSession } from "../types/chrome-ai"
import type { Message } from "../types/message"
import type { VideoContext } from "../types/transcript"
import { buildSystemPrompt, AI_CONFIG, ERROR_MESSAGES } from "../utils/constants"
import { storage } from "../utils/storage"

interface UseAISessionReturn {
  session: LanguageModelSession | null
  apiAvailable: boolean | null
  initializationMessages: Message[]
  resetSession: () => Promise<void>
  videoContext: VideoContext | null
  systemPromptTokens: number
}

/**
 * Custom hook to manage AI session initialization and cleanup
 * Checks for Prompt API availability and creates a session
 * Now includes video context support via Storage API
 */
export function useAISession(): UseAISessionReturn {
  const [session, setSession] = useState<LanguageModelSession | null>(null)
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null)
  const [initializationMessages, setInitializationMessages] = useState<
    Message[]
  >([])
  const [systemPromptTokens, setSystemPromptTokens] = useState<number>(0)

  // Read video context from storage (using local storage instance)
  const [videoContext] = useStorage<VideoContext>({
    key: "videoContext",
    instance: storage
  })

  // Helper function to create a new session with dynamic system prompt
  const createSession = async (context?: VideoContext): Promise<LanguageModelSession | null> => {
    // Check if LanguageModel API is available (supports both old and new API shapes)
    const hasNewAPI = "ai" in self && self.ai?.languageModel
    const hasOldAPI = "LanguageModel" in self

    if (!hasNewAPI && !hasOldAPI) {
      return null
    }

    const languageModel = hasNewAPI
      ? self.ai!.languageModel!
      : self.LanguageModel!

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
      const newSession = await createSession(videoContext || undefined)
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
          sender: "bot"
        }
        setInitializationMessages([errorMessage])
        return
      }

      setApiAvailable(true)

      // Create initial session with video context
      try {
        const newSession = await createSession(videoContext || undefined)
        setSession(newSession)
      } catch (error) {
        console.error("Failed to create session:", error)
        const errorMessage: Message = {
          id: Date.now(),
          text: `${ERROR_MESSAGES.SESSION_INIT_FAILED}: ${error instanceof Error ? error.message : "Unknown error"}`,
          sender: "bot"
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

  // Re-create session when video context changes
  useEffect(() => {
    const updateSessionWithContext = async () => {
      if (!apiAvailable) return

      try {
        // Destroy current session if it exists
        if (session?.destroy) {
          session.destroy()
        }

        // Create new session with updated video context
        const newSession = await createSession(videoContext || undefined)
        setSession(newSession)
      } catch (error) {
        console.error("Failed to update session with video context:", error)
      }
    }

    // Only update if we already have API available and videoContext has changed
    if (apiAvailable !== null && videoContext !== undefined) {
      updateSessionWithContext()
    }
  }, [videoContext])

  return { session, apiAvailable, initializationMessages, resetSession, videoContext, systemPromptTokens }
}


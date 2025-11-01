import { useEffect, useState } from "react"
import { JSONParser } from "@streamparser/json-whatwg"
import { zodToJsonSchema } from "zod-to-json-schema"
import type { LanguageModelSession } from "../types/chrome-ai"
import type { Concept, QuizQuestions } from "../components/quiz/quizSchema"
import { quizQuestionSchema } from "../components/quiz/quizSchema"
import { QUIZ_GENERATOR_SYSTEM_PROMPT, generateQuizPrompt } from "../components/quiz/quizPrompts"
import { AI_CONFIG } from "../utils/constants"

interface UseQuizGenerationSessionReturn {
  baseSession: LanguageModelSession | null
  isInitializing: boolean
  error: string | null
  generateQuizForConcept: (concept: Concept) => Promise<QuizQuestions>
}

/**
 * Hook for managing quiz generation sessions using Chrome AI session cloning
 * Creates a base session with quiz generation system prompt
 * Clones the session for each concept's quiz generation
 */
export function useQuizGenerationSession(): UseQuizGenerationSessionReturn {
  const [baseSession, setBaseSession] = useState<LanguageModelSession | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize base session on mount
  useEffect(() => {
    initializeBaseSession()

    // Cleanup on unmount
    return () => {
      if (baseSession?.destroy) {
        baseSession.destroy()
      }
    }
  }, [])

  const initializeBaseSession = async () => {
    setIsInitializing(true)
    setError(null)

    try {
      // Check if API is available
      if (!("LanguageModel" in self)) {
        throw new Error("AI Model API is not available in this browser. Please use Chrome 138+ with Chrome AI enabled.")
      }

      const languageModel = self.LanguageModel!

      // Create empty session
      const session = await languageModel.create({
        temperature: AI_CONFIG.temperature,
        topK: AI_CONFIG.topK
      })

      // Append system prompt
      await session.append([{
        role: "system",
        content: QUIZ_GENERATOR_SYSTEM_PROMPT
      }])

      console.log("🎯 Quiz Generation Base Session Created")
      console.log(`  System Prompt Length: ${QUIZ_GENERATOR_SYSTEM_PROMPT.length} chars`)

      setBaseSession(session)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      console.error("Failed to create base quiz session:", err)
      setError(errorMessage)
    } finally {
      setIsInitializing(false)
    }
  }

  /**
   * Generate quiz questions for a specific concept by cloning the base session
   * This ensures each quiz generation is isolated with clean context
   */
  const generateQuizForConcept = async (concept: Concept): Promise<QuizQuestions> => {
    if (!baseSession) {
      throw new Error("Base session not initialized. Cannot generate quiz.")
    }

    // Clone the base session for this specific concept
    const clonedSession = await baseSession.clone()

    try {
      const prompt = generateQuizPrompt(concept)
      const questions = await streamQuizQuestions(clonedSession, prompt)

      console.log(`✅ Generated ${questions.length} questions for concept: ${concept.title}`)

      return questions
    } finally {
      // Always destroy cloned session to free memory
      if (clonedSession?.destroy) {
        clonedSession.destroy()
      }
    }
  }

  return {
    baseSession,
    isInitializing,
    error,
    generateQuizForConcept
  }
}

/**
 * Stream quiz questions from a cloned session using structured output
 */
async function streamQuizQuestions(
  session: LanguageModelSession,
  prompt: string
): Promise<QuizQuestions> {
  const abortController = new AbortController()

  try {
    // Convert Zod schema to JSON schema for AI constraint
    const jsonSchema = zodToJsonSchema(quizQuestionSchema, {
      $refStrategy: "none"
    })

    // Create parser for streaming JSON array
    const parser = new JSONParser({
      paths: ["$.*"], // Parse array items
      keepStack: false
    })

    let accumulatedQuestions: any[] = []

    // Start streaming from AI with schema constraint
    const aiStream = session.promptStreaming(prompt, {
      responseConstraint: jsonSchema,
      signal: abortController.signal
    })

    // Create readable stream from AI stream
    const inputStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of aiStream) {
            controller.enqueue(chunk)
          }
          controller.close()
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            controller.error(err)
          }
          controller.close()
        }
      }
    })

    // Pipe through JSON parser
    const reader = inputStream.pipeThrough(parser).getReader()

    // Read and accumulate questions as they stream in
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      if (value.value !== undefined) {
        accumulatedQuestions.push(value.value)
      }
    }

    // Validate final result with Zod schema
    const validated = quizQuestionSchema.parse(accumulatedQuestions)
    return validated
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error("Quiz generation was cancelled")
    }
    throw err
  }
}

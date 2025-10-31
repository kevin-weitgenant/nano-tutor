import { useState } from "react"
import { z } from "zod"
import { useStreamingObject } from "../../hooks/useStreamingObject"
import type { LanguageModelSession } from "../../types/chrome-ai"

const quizSchema = z.array(
  z.object({
    id: z.number().describe("The question number"),
    question: z
      .string()
      .describe("A true or false statement about the solar system"),
    answer: z.boolean().describe("Whether the statement is true")
  })
)
  .min(5)
  .max(5)
  .describe("A list of true or false questions")

type QuizArray = z.infer<typeof quizSchema>

export function StreamingObjectDemoPage() {
  const [testStatus, setTestStatus] = useState<string>("Ready")
  const [session, setSession] = useState<LanguageModelSession | null>(null)

  const initializeSession = async () => {
    if (!("LanguageModel" in self)) {
      setTestStatus("ERROR: LanguageModel API not available")
      return null
    }

    try {
      const newSession = await (self as any).LanguageModel.create()
      return newSession
    } catch (error) {
      setTestStatus(`ERROR: ${error instanceof Error ? error.message : "Unknown error"}`)
      return null
    }
  }

  const { object, error, isLoading, submit, stop } = useStreamingObject<QuizArray>({
    schema: quizSchema,
    session,
    onFinish: () => {
      setTestStatus("Complete!")
    }
  })

  const runStreamingTest = async () => {
    setTestStatus("Loading...")
    
    const newSession = await initializeSession()
    if (!newSession) return

    setSession(newSession)

    await submit(
      "Generate exactly 5 true or false questions about the solar system. For each question, return an object with fields id (1-5), question (string), and answer (boolean where true means the statement is correct)."
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">
            Streaming Object Demo
          </h1>
          <p className="text-gray-600 mb-8">
            Watch items stream in real-time as they are generated
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={runStreamingTest}
                disabled={isLoading}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                {isLoading ? "Streaming..." : "Start"}
              </button>

              {isLoading && (
                <button
                  onClick={stop}
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">
                  Stop
                </button>
              )}

              <div className="flex-1 p-3 bg-gray-50 rounded border border-gray-200">
                <div className="text-sm font-mono text-gray-700">
                  Status: {testStatus}
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
                <p className="text-sm text-red-700">{error.message}</p>
              </div>
            )}

            {object && Array.isArray(object) && object.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold mb-2">
                  Results ({object.length} items):
                </h3>
                <div className="space-y-2">
                  {object.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white rounded border border-green-300">
                      <div className="flex items-start gap-3">
                        <span className="font-bold text-green-600">#{item.id || idx + 1}</span>
                        <div className="space-y-1">
                          <div className="text-sm text-gray-700">
                            {item.question || "Loading question..."}
                          </div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Answer: {"answer" in item && typeof item.answer === "boolean"
                              ? item.answer
                                ? "True"
                                : "False"
                              : "Loading..."}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from "react"
import { z } from "zod"
import { useStreamingObject } from "../../hooks/useStreamingObject"
import type { VideoContext } from "~types/transcript"
import { useModelAvailability } from "~hooks/useModelAvailability"
import { useQuizSession } from "~hooks/useQuizSession"
import { ModelDownload } from "~components/chat/ModelDownload"

interface StreamingObjectDemoPageProps {
  videoContext: VideoContext
}

const quizSchema = z.array(
  z.object({
    id: z.number().describe("The question number"),
    question: z
      .string()
      .describe("A true or false statement about the video content"),
    answer: z.boolean().describe("Whether the statement is true")
  })
)
  .min(5)
  .max(5)
  .describe("A list of true or false questions")

type QuizArray = z.infer<typeof quizSchema>

export function StreamingObjectDemoPage({ videoContext }: StreamingObjectDemoPageProps) {
  const [testStatus, setTestStatus] = useState<string>("Ready")

  // Check model availability and handle downloads
  const {
    availability,
    downloadProgress,
    isExtracting,
    startDownload
  } = useModelAvailability()

  // Initialize quiz session with video context
  const {
    session,
    apiAvailable,
    initializationMessage
  } = useQuizSession({ 
    videoContext, 
    shouldInitialize: availability === 'available'
  })

  const { object, error, isLoading, submit, stop } = useStreamingObject<QuizArray>({
    schema: quizSchema,
    session,
    onFinish: () => {
      setTestStatus("Complete!")
    }
  })

  const runStreamingTest = async () => {
    if (!session) {
      setTestStatus("ERROR: Session not ready")
      return
    }

    setTestStatus("Generating quiz...")

    await submit(
      `Generate exactly 5 true or false questions about the video "${videoContext.title}". For each question, return an object with fields id (1-5), question (string statement about the video content), and answer (boolean where true means the statement is correct).`
    )
  }

  // Show model download UI if model isn't available
  if (availability !== 'available') {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold mb-2">
              Quiz Generator
            </h1>
            <p className="text-gray-600 mb-8">
              Generate AI-powered quizzes from video content
            </p>

            <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
              <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-1">
                Video Ready
              </h2>
              <p className="text-lg font-medium text-blue-900">
                {videoContext.title}
              </p>
              <div className="text-sm text-blue-700">
                <span className="font-semibold">Channel:</span> {videoContext.channel}
              </div>
            </div>

            <ModelDownload
              availability={availability}
              downloadProgress={downloadProgress}
              isExtracting={isExtracting}
              onStartDownload={startDownload}
            />
          </div>
        </div>
      </div>
    )
  }

  const isSessionReady = session !== null

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-2">
            Quiz Generator
          </h1>
          <p className="text-gray-600 mb-8">
            Generate AI-powered quizzes from video content
          </p>

          <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
            <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-1">
              Video Ready
            </h2>
            <p className="text-lg font-medium text-blue-900">
              {videoContext.title}
            </p>
            <div className="text-sm text-blue-700">
              <span className="font-semibold">Channel:</span> {videoContext.channel}
            </div>
          </div>

          {/* Show initialization error if present */}
          {initializationMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{initializationMessage}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={runStreamingTest}
                disabled={isLoading || !isSessionReady}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
                {isLoading ? "Generating..." : "Generate Quiz"}
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
                  Quiz Questions ({object.length} items):
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

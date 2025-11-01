import { useState } from "react"
import { Sparkles } from "lucide-react"
import type { Concept } from "./quizSchema"

interface QuizContentAreaProps {
  concept: Concept
  conceptNumber: number
  totalConcepts: number
  isCompleted: boolean
  onMarkComplete: () => void
}

export function QuizContentArea({
  concept,
  conceptNumber,
  totalConcepts,
  isCompleted,
  onMarkComplete
}: QuizContentAreaProps) {
  const [quizGenerated, setQuizGenerated] = useState(false)

  const handleGenerateQuiz = () => {
    // Placeholder - just toggle UI state for now
    setQuizGenerated(true)
    // Future: Actual quiz generation logic will go here
  }

  return (
    <div className="space-y-8">
      {/* Top Section - Progress & Title */}
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Concept {conceptNumber} of {totalConcepts}
          </p>
          {isCompleted && (
            <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
              Completed
            </span>
          )}
        </div>

        {/* Concept Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {concept.title}
          </h1>
        </div>
      </div>

      {/* Quiz Content Area - Fixed Height, Scrollable */}
      <div className="h-[450px] overflow-y-auto">
        {quizGenerated ? (
          <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <Sparkles size={40} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Quiz Content Area
              </h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Quiz questions will appear here.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-400 text-sm">
              Click "Generate Quiz" to start
            </p>
          </div>
        )}
      </div>

      {/* Generate Quiz Button */}
      <div className="flex justify-center">
        <button
          onClick={handleGenerateQuiz}
          disabled={quizGenerated}
          className={`
            flex items-center gap-2 px-8 py-3 font-semibold rounded-lg transition-all shadow-sm hover:shadow-md
            ${quizGenerated
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }
          `}
        >
          <Sparkles size={18} />
          {quizGenerated ? 'Quiz Generated' : 'Generate Quiz'}
        </button>
      </div>
    </div>
  )
}

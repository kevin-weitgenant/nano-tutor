import { useState } from "react"
import { Check, X } from "lucide-react"

interface QuizQuestionProps {
  questionNumber: number
  question: string
  correctAnswer: boolean
}

/**
 * Interactive quiz question component
 * Shows question with True/False buttons, reveals answer after user clicks
 */
export function QuizQuestion({ questionNumber, question, correctAnswer }: QuizQuestionProps) {
  const [userAnswer, setUserAnswer] = useState<boolean | null>(null)

  const handleAnswer = (answer: boolean) => {
    setUserAnswer(answer)
  }

  const isAnswered = userAnswer !== null
  const isCorrect = isAnswered && userAnswer === correctAnswer

  return (
    <div className="p-4 bg-white rounded border border-gray-300">
      <div className="flex items-start gap-3">
        <span className="font-bold text-blue-600 text-lg">#{questionNumber}</span>
        <div className="flex-1 space-y-3">
          {/* Question Text */}
          <div className="text-sm text-gray-800 font-medium">
            {question}
          </div>

          {/* Answer Buttons or Result */}
          {!isAnswered ? (
            <div className="flex gap-3">
              <button
                onClick={() => handleAnswer(true)}
                className="flex-1 px-4 py-2 bg-green-100 text-green-800 font-semibold rounded-lg hover:bg-green-200 transition-colors border border-green-300">
                True
              </button>
              <button
                onClick={() => handleAnswer(false)}
                className="flex-1 px-4 py-2 bg-red-100 text-red-800 font-semibold rounded-lg hover:bg-red-200 transition-colors border border-red-300">
                False
              </button>
            </div>
          ) : (
            <div className={`p-3 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <>
                    <Check size={20} className="text-green-600" />
                    <span className="font-semibold text-green-800">Correct!</span>
                  </>
                ) : (
                  <>
                    <X size={20} className="text-red-600" />
                    <span className="font-semibold text-red-800">Incorrect</span>
                  </>
                )}
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Your answer:</span>{" "}
                <span className={userAnswer ? "text-green-700" : "text-red-700"}>
                  {userAnswer ? "True" : "False"}
                </span>
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-semibold">Correct answer:</span>{" "}
                <span className="font-bold">
                  {correctAnswer ? "True" : "False"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


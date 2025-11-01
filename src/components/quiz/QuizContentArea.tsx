import { useState, useEffect } from "react"
import { Sparkles } from "lucide-react"
import type { Concept, QuizQuestions } from "./quizSchema"
import type { QuizData, QuizCompletion } from "~hooks/useQuizStorage"
import { QuizQuestion } from "./QuizQuestion"
import { QuizResults } from "./QuizResults"

interface QuizContentAreaProps {
  concept: Concept
  conceptNumber: number
  totalConcepts: number
  completion: QuizCompletion | undefined
  getQuizForConcept: (conceptId: number) => QuizData | undefined
  generateQuizForConcept: (concept: Concept) => Promise<QuizQuestions>
  saveQuiz: (conceptId: number, questions: QuizQuestions) => Promise<void>
  onQuizComplete: (score: number, total: number) => void
  onRetake: () => void
  onContinue: () => void
}

export function QuizContentArea({
  concept,
  conceptNumber,
  totalConcepts,
  completion,
  getQuizForConcept,
  generateQuizForConcept,
  saveQuiz,
  onQuizComplete,
  onRetake,
  onContinue
}: QuizContentAreaProps) {
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestions>([])
  const [userAnswers, setUserAnswers] = useState<(boolean | undefined)[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)

  // Load quiz when concept changes
  useEffect(() => {
    const savedQuiz = getQuizForConcept(concept.id)
    if (savedQuiz) {
      setQuizQuestions(savedQuiz.questions)
      setUserAnswers(new Array(savedQuiz.questions.length).fill(undefined))
    } else {
      setQuizQuestions([])
      setUserAnswers([])
    }
    setGenerationError(null)
  }, [concept.id, getQuizForConcept])

  const handleGenerateQuiz = async () => {
    setIsGenerating(true)
    setGenerationError(null)

    try {
      // Check if already generated and saved
      const savedQuiz = getQuizForConcept(concept.id)
      if (savedQuiz) {
        setQuizQuestions(savedQuiz.questions)
        setUserAnswers(new Array(savedQuiz.questions.length).fill(undefined))
        return
      }

      // Generate new quiz using cloned session
      const questions = await generateQuizForConcept(concept)

      // Save to storage
      await saveQuiz(concept.id, questions)

      setQuizQuestions(questions)
      setUserAnswers(new Array(questions.length).fill(undefined))
    } catch (err) {
      console.error("Quiz generation failed:", err)
      setGenerationError(err instanceof Error ? err.message : "Failed to generate quiz")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleAnswer = (questionIndex: number, answer: boolean) => {
    const newAnswers = [...userAnswers]
    newAnswers[questionIndex] = answer
    setUserAnswers(newAnswers)
  }

  const handleRetake = async () => {
    await onRetake()
    // Reset answers for fresh attempt
    setQuizQuestions([])
    setUserAnswers([])
  }

  // Check if all questions are answered
  const allQuestionsAnswered = quizQuestions.length > 0 &&
    userAnswers.every(answer => answer !== undefined)

  // Calculate score
  const calculateScore = () => {
    let correct = 0
    quizQuestions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswer) {
        correct++
      }
    })
    return correct
  }

  // Trigger completion when all questions answered
  useEffect(() => {
    if (allQuestionsAnswered && quizQuestions.length > 0) {
      const score = calculateScore()
      onQuizComplete(score, quizQuestions.length)
    }
  }, [allQuestionsAnswered, quizQuestions.length])

  const quizGenerated = quizQuestions.length > 0

  return (
    <div className="space-y-8">
      {/* Top Section - Progress & Title */}
      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Concept {conceptNumber} of {totalConcepts}
          </p>
          {completion && (
            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${
              completion.passed
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {completion.passed ? '✓' : '✗'} {completion.score}%
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
          <div className="space-y-6 pr-2">
            {quizQuestions.map((q, index) => (
              <QuizQuestion
                key={index}
                questionNumber={index + 1}
                question={q.question}
                correctAnswer={q.correctAnswer}
                onAnswer={(answer) => handleAnswer(index, answer)}
                disabled={userAnswers[index] !== undefined}
              />
            ))}

            {allQuestionsAnswered && (
              <QuizResults
                score={calculateScore()}
                total={quizQuestions.length}
                onContinue={onContinue}
                onRetake={handleRetake}
              />
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-400 text-sm">
              Click "Generate Quiz" to start
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {generationError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {generationError}
        </div>
      )}

      {/* Generate Quiz Button */}
      {!quizGenerated && (
        <div className="flex justify-center">
          <button
            onClick={handleGenerateQuiz}
            disabled={isGenerating}
            className={`
              flex items-center gap-2 px-8 py-3 font-semibold rounded-lg transition-all shadow-sm hover:shadow-md
              ${isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            <Sparkles size={18} />
            {isGenerating ? 'Generating...' : 'Generate Quiz'}
          </button>
        </div>
      )}
    </div>
  )
}

import { useState } from "react"
import { ArrowLeft } from "lucide-react"
import type { ConceptArray } from "./quizSchema"
import { ConceptSidebar } from "./ConceptSidebar"
import { QuizContentArea } from "./QuizContentArea"
import { QuizNavigation } from "./QuizNavigation"

interface QuizSessionPageProps {
  concepts: ConceptArray
  onBack: () => void
}

export function QuizSessionPage({ concepts, onBack }: QuizSessionPageProps) {
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0)
  const [completedConceptIds, setCompletedConceptIds] = useState<Set<number>>(new Set())

  const currentConcept = concepts[currentConceptIndex]

  const handlePrevious = () => {
    if (currentConceptIndex > 0) {
      setCurrentConceptIndex(currentConceptIndex - 1)
    }
  }

  const handleNext = () => {
    if (currentConceptIndex < concepts.length - 1) {
      setCurrentConceptIndex(currentConceptIndex + 1)
    }
  }

  const handleSelectConcept = (index: number) => {
    setCurrentConceptIndex(index)
  }

  const handleMarkComplete = () => {
    setCompletedConceptIds(prev => {
      const newSet = new Set(prev)
      newSet.add(currentConcept.id)
      return newSet
    })
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <ConceptSidebar
        concepts={concepts}
        currentConceptIndex={currentConceptIndex}
        completedConceptIds={completedConceptIds}
        onSelectConcept={handleSelectConcept}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Concepts</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <QuizContentArea
                concept={currentConcept}
                conceptNumber={currentConceptIndex + 1}
                totalConcepts={concepts.length}
                isCompleted={completedConceptIds.has(currentConcept.id)}
                onMarkComplete={handleMarkComplete}
              />

              {/* Navigation - Fixed at bottom */}
              <QuizNavigation
                currentIndex={currentConceptIndex}
                totalConcepts={concepts.length}
                onPrevious={handlePrevious}
                onNext={handleNext}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

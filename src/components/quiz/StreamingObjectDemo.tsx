import { useState, useEffect } from "react"
import { useStreamingObject } from "../../hooks/useStreamingObject"
import type { VideoContext } from "~types/transcript"
import { useModelAvailability } from "~hooks/useModelAvailability"
import { useQuizSession } from "~hooks/useQuizSession"
import { useConceptStorage } from "~hooks/useConceptStorage"
import { ModelDownload } from "~components/chat/ModelDownload"
import { conceptSchema, type ConceptArray, type Concept } from "./quizSchema"
import { QuizControls } from "./QuizControls"
import { ErrorDisplay } from "./ErrorDisplay"
import { ConceptList } from "./QuizList"
import { generateConceptPrompt } from "./quizPrompts"
import { QuizPageLayout } from "./QuizPageLayout"
import { QuizHeader } from "./QuizHeader"

interface StreamingObjectDemoPageProps {
  videoContext: VideoContext
}

export function StreamingObjectDemoPage({ videoContext }: StreamingObjectDemoPageProps) {
  const [testStatus, setTestStatus] = useState<string>("Ready")
  const [concepts, setConcepts] = useState<ConceptArray | null>(null)

  // Concept storage hook
  const {
    savedConcepts,
    saveConcepts,
    isLoading: isLoadingStorage
  } = useConceptStorage(videoContext.videoId)

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

  const { object, error, isLoading, submit, stop } = useStreamingObject<ConceptArray>({
    schema: conceptSchema,
    session,
    onFinish: (finalConcepts) => {
      setTestStatus("Complete!")
      // Auto-save concepts when generation completes
      if (finalConcepts) {
        saveConcepts(finalConcepts).catch(err =>
          console.error("Failed to save concepts:", err)
        )
      }
    }
  })

  // Load saved concepts on mount
  useEffect(() => {
    if (savedConcepts && !isLoadingStorage) {
      setConcepts(savedConcepts)
      setTestStatus("Loaded from storage")
    }
  }, [savedConcepts, isLoadingStorage])

  // Update concepts when streaming object changes
  useEffect(() => {
    if (object) {
      setConcepts(object)
    }
  }, [object])

  const runStreamingTest = async () => {
    if (!session) {
      setTestStatus("ERROR: Session not ready")
      return
    }

    // Clear existing concepts when starting fresh generation
    setConcepts(null)
    setTestStatus("Extracting concepts...")
    await submit(generateConceptPrompt(videoContext))
  }

  // Handle concept update
  const handleUpdateConcept = async (id: number, updates: Partial<Omit<Concept, 'id'>>) => {
    if (!concepts) return

    const updatedConcepts = concepts.map(concept =>
      concept.id === id ? { ...concept, ...updates } : concept
    )

    setConcepts(updatedConcepts)

    // Save to storage
    try {
      await saveConcepts(updatedConcepts)
    } catch (err) {
      console.error("Failed to save updated concept:", err)
    }
  }

  // Handle concept deletion
  const handleDeleteConcept = async (id: number) => {
    if (!concepts) return

    const filteredConcepts = concepts.filter(concept => concept.id !== id)

    // Renumber remaining concepts
    const renumberedConcepts = filteredConcepts.map((concept, index) => ({
      ...concept,
      id: index + 1
    }))

    setConcepts(renumberedConcepts)

    // Save to storage
    try {
      await saveConcepts(renumberedConcepts)
    } catch (err) {
      console.error("Failed to save after deletion:", err)
    }
  }

  const isSessionReady = session !== null

  return (
    <QuizPageLayout>
      <QuizHeader />

      {availability !== 'available' ? (
        <ModelDownload
          availability={availability}
          downloadProgress={downloadProgress}
          isExtracting={isExtracting}
          onStartDownload={startDownload}
        />
      ) : (
        <>
          {/* Show initialization error if present */}
          {initializationMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-sm text-red-700">{initializationMessage}</p>
            </div>
          )}

          <div className="space-y-8">
            <QuizControls
              onGenerate={runStreamingTest}
              onStop={stop}
              isLoading={isLoading}
              isDisabled={!isSessionReady}
              status={testStatus}
            />

            {error && <ErrorDisplay message={error.message} />}

            {concepts && (
              <ConceptList
                concepts={concepts}
                onUpdateConcept={handleUpdateConcept}
                onDeleteConcept={handleDeleteConcept}
              />
            )}
          </div>
        </>
      )}
    </QuizPageLayout>
  )
}

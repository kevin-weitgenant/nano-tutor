import { X } from "lucide-react"
import { StreamingObjectDemoPage } from "~components/quiz/StreamingObjectDemo"
import type { VideoContext } from "~types/transcript"

interface QuizModalProps {
  onClose: () => void
  videoContext: VideoContext
}

/**
 * Modal displaying StreamingObjectDemo for testing streaming functionality
 */
export function QuizModal({ onClose, videoContext }: QuizModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Streaming Object Demo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="overflow-y-auto flex-1">
          <StreamingObjectDemoPage videoContext={videoContext} />
        </div>
      </div>
    </div>
  )
}

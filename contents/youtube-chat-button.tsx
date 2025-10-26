import type { PlasmoCSConfig } from "plasmo"
import { useState } from "react"
import { MessageCircle, Loader2, AlertCircle } from "lucide-react"
import { sendToBackground } from "@plasmohq/messaging"
import { useStorage } from "@plasmohq/storage/hook"
import { storage } from "~utils/storage"
import { extractYouTubeContext } from "~utils/youtubeTranscript"
import type { EmbeddingProgress } from "~types/transcript"

// Only run on YouTube video pages
export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/watch*"]
}

// Inject Tailwind styles into the shadow DOM
import cssText from "data-text:~style.css"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

/**
 * Extract YouTube video ID from current page URL
 */
function getCurrentVideoId(): string | null {
  const match = window.location.href.match(/[?&]v=([^&]+)/)
  return match ? match[1] : null
}

/**
 * YouTube Chat Button
 * A floating button that extracts transcript and opens the sidepanel
 */
const YoutubeChatButton = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Watch embedding progress for current video
  const videoId = getCurrentVideoId()
  const [embeddingProgress] = useStorage<EmbeddingProgress>(
    videoId ? `embeddingProgress-${videoId}` : null
  )

  const handleOpenChat = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Extract video context (transcript + metadata)
      const videoContext = await extractYouTubeContext()

      // Store in Plasmo Storage for sidepanel to access
      await storage.set("videoContext", videoContext)

      // Trigger chunking + embedding in background (fire-and-forget, non-blocking)
      sendToBackground({
        name: "embedTranscript",
        body: {
          transcript: videoContext.transcript,
          url: videoContext.url
        }
      }).then((result) => {
        console.log("✅ Embedding complete:", result)
      })

      // Open sidepanel (don't wait for embedding)
      await sendToBackground({ name: "openSidePanel" })
    } catch (err) {
      console.error("Failed to extract video context:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to extract transcript. Make sure the video has captions available."
      )

      // Still open sidepanel even if extraction fails
      setTimeout(async () => {
        await sendToBackground({ name: "openSidePanel" })
      }, 2000)
    } finally {
      setIsLoading(false)
      // Clear error after 5 seconds
      setTimeout(() => setError(null), 5000)
    }
  }

  return (
    <>
      <button
        onClick={handleOpenChat}
        disabled={isLoading}
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Open AI Chat">
        {isLoading ? (
          <>
            <Loader2 size={24} className="animate-spin" />
            <span className="font-medium">Loading...</span>
          </>
        ) : (
          <>
            <MessageCircle size={24} />
            <span className="font-medium">Chat</span>
          </>
        )}
      </button>

      {/* Error notification */}
      {error && (
        <div className="fixed bottom-20 right-6 z-[9999] bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
          <AlertCircle size={20} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Embedding progress bar */}
      {embeddingProgress &&
        (embeddingProgress.status === "embedding" ||
          embeddingProgress.status === "ready") && (
          <div className="fixed bottom-24 right-6 z-[9999] bg-white rounded-lg shadow-xl p-4 w-80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {embeddingProgress.currentStep}
              </span>
              <span className="text-xs text-gray-500">
                {embeddingProgress.progress}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${embeddingProgress.progress}%` }}
              />
            </div>

            {/* Chunk counter */}
            {embeddingProgress.currentChunk !== undefined &&
              embeddingProgress.totalChunks !== undefined && (
                <div className="text-xs text-gray-500 text-center">
                  {embeddingProgress.currentChunk} / {embeddingProgress.totalChunks}{" "}
                  chunks
                </div>
              )}
          </div>
        )}

      {/* Error status from embedding */}
      {embeddingProgress && embeddingProgress.status === "error" && (
        <div className="fixed bottom-24 right-6 z-[9999] bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
          <AlertCircle size={20} />
          <div>
            <p className="text-sm font-medium">Embedding failed</p>
            {embeddingProgress.error && (
              <p className="text-xs mt-1">{embeddingProgress.error}</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default YoutubeChatButton

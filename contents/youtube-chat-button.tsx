import type { PlasmoCSConfig } from "plasmo"
import { useState } from "react"
import { MessageCircle, Loader2, AlertCircle } from "lucide-react"
import { storage } from "~utils/storage"
import { extractYouTubeContext } from "~utils/youtubeTranscript"

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
 * YouTube Chat Button
 * A floating button that extracts transcript and opens the sidepanel
 */
const YoutubeChatButton = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpenChat = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Extract video context (transcript + metadata)
      const videoContext = await extractYouTubeContext()

      // Store in Plasmo Storage for sidepanel to access
      await storage.set("videoContext", videoContext)

      // Open sidepanel
      chrome.runtime.sendMessage({ action: "openSidePanel" })
    } catch (err) {
      console.error("Failed to extract video context:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to extract transcript. Make sure the video has captions available."
      )

      // Still open sidepanel even if extraction fails
      setTimeout(() => {
        chrome.runtime.sendMessage({ action: "openSidePanel" })
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
    </>
  )
}

export default YoutubeChatButton

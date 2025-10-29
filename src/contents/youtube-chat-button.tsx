;
// Inject Tailwind styles into the shadow DOM
import cssText from "data-text:~style.css";
import { AlertCircle, Loader2, MessageCircle } from "lucide-react";
import type { PlasmoCSConfig } from "plasmo";
import { useState } from "react";



import { sendToBackground } from "@plasmohq/messaging";



import { storage } from "~utils/storage";
import { extractYouTubeContext } from "~utils/youtubeTranscript";





// Only run on YouTube video pages
export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/watch*"]
}




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
      // Open the side panel and get the tab ID
      const response = await sendToBackground({ name: "openSidePanel" })
      const tabId = response?.tabId

      if (!tabId) {
        throw new Error("Could not determine tab ID")
      }

      // Extract video context (transcript + metadata)
      const videoContext = await extractYouTubeContext()

      // Store in Plasmo Storage with tab-scoped key
      await storage.set(`videoContext_${tabId}`, videoContext)

      // Set video for current tab to enable auto-closing panel on navigation
      await sendToBackground({
        name: "setVideoForTab",
        body: { videoId: videoContext.videoId }
      })
    } catch (err) {
      console.error("Failed to extract video context:", err)
      setError(
        err instanceof Error
          ? err.message
          : "Failed to extract transcript. Make sure the video has captions available."
      )

    
    
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
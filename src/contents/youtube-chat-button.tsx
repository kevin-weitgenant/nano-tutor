;
// Inject Tailwind styles into the shadow DOM
import cssText from "data-text:~style.css";
import { AlertCircle, Loader2, MessageCircle } from "lucide-react";
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo";
import { useState } from "react";



import { sendToBackground } from "@plasmohq/messaging";



import { storage, cleanupVideoStorage } from "~utils/storage";
import type { VideoContext } from "~types/transcript";
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

// Configure shadow DOM host ID for better debugging
export const getShadowHostId = () => "youtube-chat-button-shadow-host"

/**
 * Find YouTube's button container and inject our button inline
 * This positions our button alongside YouTube's native buttons (Like, Share, etc.)
 */
export const getInlineAnchor: PlasmoGetInlineAnchor = async () => {
  // Multiple selectors to handle YouTube's varying DOM structure
  const selectors = [
    "#top-level-buttons-computed",
    "#menu-container #top-level-buttons",
    ".ytd-menu-renderer #top-level-buttons-computed",
    "#actions #top-level-buttons-computed",
    "#actions-inner #top-level-buttons-computed"
  ]

  // Try to find the button container with retries
  const findContainer = (): Promise<Element> => {
    return new Promise((resolve) => {
      const maxAttempts = 20 // Try for ~10 seconds
      let attempts = 0

      const checkForContainer = () => {
        attempts++

        // Try each selector
        for (const selector of selectors) {
          const container = document.querySelector(selector)
          if (container) {
            console.log(`✅ Found YouTube button container: ${selector}`)
            resolve(container)
            return
          }
        }

        // If not found and haven't exceeded max attempts, try again
        if (attempts < maxAttempts) {
          setTimeout(checkForContainer, 500)
        } else {
          console.warn("⚠️ Could not find YouTube button container after retries")
          // Fallback: return body so button still appears somewhere
          resolve(document.body)
        }
      }

      checkForContainer()
    })
  }

  const container = await findContainer()

  return {
    element: container,
    insertPosition: "afterbegin" // Insert as first child (leftmost button)
  }
}

/**
 * YouTube Chat Button
 * Positioned inline with YouTube's native buttons
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

      // Extract videoId from URL
      const videoId = new URL(window.location.href).searchParams.get("v")
      if (!videoId) {
        throw new Error("Could not determine video ID")
      }

      // Check if video context already exists (cache check)
      let videoContext = await storage.get<VideoContext>(`videoContext_${videoId}`)
      
      if (!videoContext) {
        // Cache miss - extract fresh context
        console.log("📥 Extracting fresh video context for", videoId)
        videoContext = await extractYouTubeContext()
        
        // Cleanup before storing new video
        await cleanupVideoStorage()
        
        // Store with videoId key (persistent)
        await storage.set(`videoContext_${videoId}`, videoContext)
      } else {
        // Cache hit - instant!
        console.log("✅ Using cached video context for", videoId)
      }

      // Set video for tab (session storage mapping - already implemented)
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
    <div className="relative inline-block">
      <button
        onClick={handleOpenChat}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mr-2"
        title="Chat with the video">
        {isLoading ? (
          <>
            <Loader2 size={24} className="animate-spin" />
            <span className="font-medium">Loading...</span>
          </>
        ) : (
          <>
            <MessageCircle size={24} />
          </>
        )}
      </button>

      {/* Error notification - positioned below the button */}
      {error && (
        <div className="absolute top-full left-0 mt-2 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm whitespace-normal z-[10000]">
          <AlertCircle size={20} className="flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  )
}

export default YoutubeChatButton
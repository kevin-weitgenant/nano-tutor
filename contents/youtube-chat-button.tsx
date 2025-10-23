import type { PlasmoCSConfig } from "plasmo"
import { MessageCircle } from "lucide-react"

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
 * A floating button that opens the sidepanel when clicked
 */
const YoutubeChatButton = () => {
  const handleOpenChat = () => {
    // Send message to background script to open sidepanel
    chrome.runtime.sendMessage({ action: "openSidePanel" })
  }

  return (
    <button
      onClick={handleOpenChat}
      className="fixed bottom-6 right-6 z-[9999] flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
      title="Open AI Chat"
    >
      <MessageCircle size={24} />
      <span className="font-medium">Chat</span>
    </button>
  )
}

export default YoutubeChatButton

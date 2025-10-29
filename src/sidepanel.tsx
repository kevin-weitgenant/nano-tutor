import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";



import type { Message } from "./types/message";
import type { VideoContext } from "./types/transcript";
import { storage } from "./utils/storage";



import "~style.css";



import { useStorage } from "@plasmohq/storage/hook";



import { ChatInput } from "./components/ChatInput";
import { MessageList } from "./components/MessageList";
import { ModelDownload } from "./components/ModelDownload";
import { useAISession } from "./hooks/useAISession";
import { useModelAvailability } from "./hooks/useModelAvailability";
import { useStreamingResponse } from "./hooks/useStreamingResponse";
import { buildInitialBotMessage } from "./utils/constants";


/**
 * Main SidePanel component
 * AI-powered chatbot interface using Chrome's Prompt API (Gemini Nano)
 * Now includes YouTube video context support
 */
function SidePanel() {
  // Initialize AI session (includes video context)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [currentTabId, setCurrentTabId] = useState<number | null>(null)

  // Detect current tab ID
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
      if (tabs[0]?.id) {
        setCurrentTabId(tabs[0].id)
      }
    })
  }, [])

  const [videoContext] = useStorage<VideoContext>({
    key: currentTabId ? `videoContext_${currentTabId}` : null,
    instance: storage
  })

  // Check model availability and handle downloads
  const { 
    availability, 
    downloadProgress, 
    isExtracting, 
    startDownload 
  } = useModelAvailability()

  const {
    session,
    apiAvailable,
    initializationMessages,
    resetSession,
    systemPromptTokens
  } = useAISession({ 
    videoContext, 
    shouldInitialize: availability === 'available'
  })
  
  // Handle message streaming
  const { isStreaming, sendMessage, tokenInfo, resetTokenInfo } =
    useStreamingResponse(session, messages, setMessages, systemPromptTokens)
  
  
    // Effect to handle initialization messages and readiness
  useEffect(() => {
    if (initializationMessages.length > 0) {
      setMessages(initializationMessages)
    }
  }, [initializationMessages])


 

  const handleSend = async () => {
    await sendMessage(inputText)
    setInputText("")
  }

  // Handle session reset - resets both session and messages
  const handleResetSession = async () => {
    await resetSession()
    resetTokenInfo()
    setMessages([
      {
        id: Date.now(),
        ...buildInitialBotMessage(videoContext || undefined)
      }
    ])
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Video Context Display */}
      {videoContext ? (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="text-xl">💬</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-blue-900 text-sm truncate">
                {videoContext.title}
              </h3>
              <p className="text-xs text-blue-700 truncate">
                by {videoContext.channel}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Loader2 size={20} className="animate-spin text-gray-600" />
            <div className="flex-1">
              <p className="text-sm text-gray-700 font-medium">
                Waiting for video context...
              </p>
             
            </div>
          </div>
        </div>
      )}

      <MessageList messages={messages} />
      {availability !== 'available' ? (
        <ModelDownload
          availability={availability}
          downloadProgress={downloadProgress}
          isExtracting={isExtracting}
          onStartDownload={startDownload}
        />
      ) : (
        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          onSend={handleSend}
          isStreaming={isStreaming}
          apiAvailable={apiAvailable}
          tokenInfo={tokenInfo}
          session={session}
          onReset={handleResetSession}
        />
      )}
    </div>
  )
}

export default SidePanel
import { useEffect, useState } from "react"
import type { Message } from "./types/message"
import { useAISession } from "./hooks/useAISession"
import { useStreamingResponse } from "./hooks/useStreamingResponse"
import { MessageList } from "./components/MessageList"
import { ChatInput } from "./components/ChatInput"
import { buildInitialBotMessage } from "./utils/constants"
import "./style.css"

/**
 * Main SidePanel component
 * AI-powered chatbot interface using Chrome's Prompt API (Gemini Nano)
 * Now includes YouTube video context support
 */
function SidePanel() {
  // Initialize AI session (includes video context)
  const { session, apiAvailable, initializationMessages, resetSession, videoContext, systemPromptTokens } =
    useAISession()

  // Initialize messages with context-aware welcome message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      ...buildInitialBotMessage(videoContext || undefined)
    }
  ])

  // Sync initialization messages (e.g., API errors) into local state
  useEffect(() => {
    if (initializationMessages.length > 0) {
      setMessages(initializationMessages)
    }
  }, [initializationMessages])

  // Update initial message when video context changes
  useEffect(() => {
    setMessages([
      {
        id: Date.now(),
        ...buildInitialBotMessage(videoContext || undefined)
      }
    ])
  }, [videoContext])

  // Handle message streaming
  const { isStreaming, sendMessage, tokenInfo, resetTokenInfo } = useStreamingResponse(
    session,
    messages,
    setMessages,
    systemPromptTokens
  )

  // Input state
  const [inputText, setInputText] = useState("")

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
      {videoContext && (
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
      )}

      <MessageList messages={messages} />
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
    </div>
  )
}

export default SidePanel

import { useEffect, useState } from "react"
import type { Message } from "./types/message"
import { useAISession } from "./hooks/useAISession"
import { useStreamingResponse } from "./hooks/useStreamingResponse"
import { ChatHeader } from "./components/ChatHeader"
import { MessageList } from "./components/MessageList"
import { ChatInput } from "./components/ChatInput"
import { INITIAL_BOT_MESSAGE } from "./utils/constants"
import "./style.css"

/**
 * Main SidePanel component
 * AI-powered chatbot interface using Chrome's Prompt API (Gemini Nano)
 */
function SidePanel() {
  // Initialize AI session
  const { session, apiAvailable, initializationMessages } = useAISession()

  // Initialize messages with welcome message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      ...INITIAL_BOT_MESSAGE,
      timestamp: new Date()
    }
  ])

  // Sync initialization messages (e.g., API errors) into local state
  useEffect(() => {
    if (initializationMessages.length > 0) {
      setMessages(initializationMessages)
    }
  }, [initializationMessages])

  // Handle message streaming
  const { isStreaming, sendMessage } = useStreamingResponse(
    session,
    messages,
    setMessages
  )

  // Input state
  const [inputText, setInputText] = useState("")

  const handleSend = async () => {
    await sendMessage(inputText)
    setInputText("")
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <ChatHeader apiAvailable={apiAvailable} />
      <MessageList messages={messages} />
      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        onSend={handleSend}
        isStreaming={isStreaming}
        apiAvailable={apiAvailable}
      />
    </div>
  )
}

export default SidePanel

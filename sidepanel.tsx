import { useEffect, useRef, useState } from "react"

import "./style.css"

// TypeScript interfaces for Chrome's Prompt API (Gemini Nano)
// Supports both old API (LanguageModel) and new API (ai.languageModel)
interface LanguageModelSession {
  promptStreaming: (prompt: string) => AsyncIterable<string>
  destroy?: () => void
  temperature?: number
  topK?: number
  maxTokens?: number
  tokensSoFar?: number
  tokensLeft?: number
  inputQuota?: number
  inputUsage?: number
}

interface LanguageModel {
  create: (options: {
    temperature?: number
    topK?: number
    initialPrompts?: Array<{ role: string; content: string }>
  }) => Promise<LanguageModelSession>
  params?: () => Promise<{
    defaultTopK: number
    maxTopK: number
    defaultTemperature: number
    maxTemperature: number
  }>
}

declare global {
  interface Window {
    // New API shape (Chrome Canary)
    ai?: {
      languageModel?: LanguageModel
    }
    // Old API shape (Chrome Stable)
    LanguageModel?: LanguageModel
  }
  // New API shape
  var ai:
    | {
        languageModel?: LanguageModel
      }
    | undefined
  // Old API shape
  var LanguageModel: LanguageModel | undefined
}

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

const SYSTEM_PROMPT = "You are a helpful and friendly assistant."

function SidePanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your AI assistant powered by Gemini Nano. How can I help you today?",
      sender: "bot",
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [session, setSession] = useState<LanguageModelSession | null>(null)
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null)
  const currentBotMessageRef = useRef<string>("")
  const currentBotMessageIdRef = useRef<number | null>(null)

  // Check if Prompt API is available and initialize session
  useEffect(() => {
    const checkAPIAndInitialize = async () => {
      // Check if LanguageModel API is available (supports both old and new API shapes)
      const hasNewAPI = "ai" in self && self.ai?.languageModel
      const hasOldAPI = "LanguageModel" in self

      if (!hasNewAPI && !hasOldAPI) {
        setApiAvailable(false)
        const errorMessage: Message = {
          id: Date.now(),
          text: "⚠️ Prompt API not available. Please enable Chrome AI Early Preview in chrome://flags/#optimization-guide-on-device-model and restart Chrome.",
          sender: "bot",
          timestamp: new Date()
        }
        setMessages([errorMessage])
        return
      }

      setApiAvailable(true)

      // Create initial session using whichever API is available
      try {
        const languageModel = hasNewAPI
          ? self.ai!.languageModel!
          : self.LanguageModel!

        const newSession = await languageModel.create({
          temperature: 1,
          topK: 3,
          initialPrompts: [
            {
              role: "system",
              content: SYSTEM_PROMPT
            }
          ]
        })
        setSession(newSession)
      } catch (error) {
        console.error("Failed to create session:", error)
        const errorMessage: Message = {
          id: Date.now(),
          text: `Failed to initialize AI session: ${error instanceof Error ? error.message : "Unknown error"}`,
          sender: "bot",
          timestamp: new Date()
        }
        setMessages((prev) => [...prev, errorMessage])
      }
    }

    checkAPIAndInitialize()

    // Cleanup: destroy session on unmount
    return () => {
      if (session?.destroy) {
        session.destroy()
      }
    }
  }, [])

  const handleSend = async () => {
    if (!inputText.trim() || isStreaming || !session) return

    // Add user message
    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      sender: "user",
      timestamp: new Date()
    }

    setMessages((prev) => [...prev, userMessage])
    const promptText = inputText
    setInputText("")

    // Set streaming state
    setIsStreaming(true)
    currentBotMessageRef.current = ""

    try {
      // Stream the response
      const stream = await session.promptStreaming(promptText)
      let previousChunk = ""

      for await (const chunk of stream) {
        // Calculate new content (avoiding repetition)
        const newChunk = chunk.startsWith(previousChunk)
          ? chunk.slice(previousChunk.length)
          : chunk

        currentBotMessageRef.current += newChunk
        previousChunk = chunk

        // Update or create bot message
        setMessages((prev) => {
          const lastMessage = prev[prev.length - 1]

          // If we're updating the current streaming message
          if (
            currentBotMessageIdRef.current &&
            lastMessage?.id === currentBotMessageIdRef.current
          ) {
            return [
              ...prev.slice(0, -1),
              {
                ...lastMessage,
                text: currentBotMessageRef.current
              }
            ]
          }

          // Create new bot message
          const newBotMessage: Message = {
            id: Date.now(),
            text: currentBotMessageRef.current,
            sender: "bot",
            timestamp: new Date()
          }
          currentBotMessageIdRef.current = newBotMessage.id

          return [...prev, newBotMessage]
        })
      }
    } catch (error) {
      console.error("Error during streaming:", error)
      const errorMessage: Message = {
        id: Date.now(),
        text: `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`,
        sender: "bot",
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      // Reset streaming state
      setIsStreaming(false)
      currentBotMessageRef.current = ""
      currentBotMessageIdRef.current = null
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">AI Chatbot</h1>
        <p className="text-sm text-blue-100">
          {apiAvailable === null
            ? "Initializing..."
            : apiAvailable
              ? "Powered by Gemini Nano"
              : "API not available"}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-800 border border-gray-200"
              }`}>
              <p className="text-sm whitespace-pre-wrap break-words">
                {message.text}
              </p>
              <span
                className={`text-xs mt-1 block ${
                  message.sender === "user" ? "text-blue-100" : "text-gray-500"
                }`}>
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={!apiAvailable}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            rows={3}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isStreaming || !apiAvailable}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium">
            {isStreaming ? "Thinking..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {apiAvailable
            ? "Press Enter to send, Shift+Enter for new line"
            : "Enable Chrome AI to use this chatbot"}
        </p>
      </div>
    </div>
  )
}

export default SidePanel

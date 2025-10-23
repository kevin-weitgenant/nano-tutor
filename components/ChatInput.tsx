interface ChatInputProps {
  inputText: string
  setInputText: (text: string) => void
  onSend: () => void
  isStreaming: boolean
  apiAvailable: boolean | null
}

/**
 * Input area component with textarea and send button
 * Handles user message input and submission
 */
export function ChatInput({
  inputText,
  setInputText,
  onSend,
  isStreaming,
  apiAvailable
}: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  return (
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
          onClick={onSend}
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
  )
}


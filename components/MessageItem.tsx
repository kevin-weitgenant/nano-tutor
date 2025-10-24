import type { Message } from "../types/message"

interface MessageItemProps {
  message: Message
}

/**
 * Individual message bubble component
 * Displays a single message
 */
export function MessageItem({ message }: MessageItemProps) {
  return (
    <div
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
      </div>
    </div>
  )
}


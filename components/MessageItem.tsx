import type { Message } from "../types/message"

interface MessageItemProps {
  message: Message
}

/**
 * Individual message bubble component
 * Displays a single message with timestamp
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
  )
}


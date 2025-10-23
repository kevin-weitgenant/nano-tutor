interface ChatHeaderProps {
  apiAvailable: boolean | null
}

/**
 * Header component displaying app title and API status
 */
export function ChatHeader({ apiAvailable }: ChatHeaderProps) {
  return (
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
  )
}


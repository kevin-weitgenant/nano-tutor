import type { TokenInfo } from "../hooks/useStreamingResponse"

interface TokenDisplayProps {
  tokenInfo: TokenInfo
}

/**
 * Displays token usage information in a compact badge format
 * Shows tokens used, tokens left, and total tokens
 */
export function TokenDisplay({ tokenInfo }: TokenDisplayProps) {
  const { inputUsage, tokensLeft, inputQuota } = tokenInfo

  // Don't display if no token info available
  if (inputQuota === 0) {
    return null
  }

  // Calculate percentage for visual warning
  const percentageUsed = inputQuota > 0 ? (inputUsage / inputQuota) * 100 : 0
  const isLowTokens = percentageUsed > 90

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
        isLowTokens
          ? "bg-red-100 text-red-700"
          : "bg-blue-100 text-blue-700"
      }`}>
      <span>{inputUsage} used</span>
      <span className="text-gray-400">•</span>
      <span>{tokensLeft} left</span>
      <span className="text-gray-400">•</span>
      <span>{inputQuota} total</span>
      {isLowTokens && <span className="ml-1">⚠️</span>}
    </div>
  )
}

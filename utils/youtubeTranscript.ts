import type { VideoContext } from "~types/transcript"

/**
 * YouTube Transcript Extraction Utilities
 * Based on the reference implementation for extracting transcripts from YouTube
 */

// Selectors for finding the transcript button
const TRANSCRIPT_BUTTON_SELECTORS = [
  "button[aria-label*='transcript' i]",
  "button[aria-label*='Show transcript' i]",
  "ytd-video-description-transcript-section-renderer button",
  "#description button[aria-label*='transcript' i]"
]

// Selectors for finding transcript segments
const TRANSCRIPT_SEGMENT_SELECTORS = [
  "ytd-transcript-segment-renderer",
  ".ytd-transcript-segment-renderer",
  "[role='button'] .ytd-transcript-segment-renderer"
]

/**
 * Opens the YouTube transcript panel by clicking the transcript button
 * Waits for the panel to load
 */
async function openTranscriptPanel(): Promise<void> {
  let transcriptButton: HTMLElement | null = null

  // Try multiple selectors to find the transcript button
  for (const selector of TRANSCRIPT_BUTTON_SELECTORS) {
    transcriptButton = document.querySelector<HTMLElement>(selector)
    if (transcriptButton) break
  }

  if (!transcriptButton) {
    throw new Error("Transcript button not found")
  }

  // Click to open the transcript panel
  transcriptButton.click()

  // Wait for the transcript panel to load
  await new Promise((resolve) => setTimeout(resolve, 1000))
}

/**
 * Extracts transcript segments from the DOM
 * Returns a NodeList of transcript segment elements
 */
function extractTranscriptSegments(): NodeListOf<Element> {
  let transcriptItems: NodeListOf<Element> = document.querySelectorAll(
    "nothing-will-match"
  )

  // Try multiple selectors to find transcript segments
  for (const selector of TRANSCRIPT_SEGMENT_SELECTORS) {
    transcriptItems = document.querySelectorAll(selector)
    if (transcriptItems.length > 0) break
  }

  if (transcriptItems.length === 0) {
    throw new Error("No transcript segments found")
  }

  return transcriptItems
}

/**
 * Formats the transcript segments into a plain text string
 */
function formatTranscript(segments: NodeListOf<Element>): string {
  const lines = Array.from(segments)
    .map((segment) => {
      // Extract text element
      const textElement =
        segment.querySelector("[class*='segment-text']") ||
        segment.querySelector("#content") ||
        segment.querySelector("#text")

      const text = textElement ? textElement.textContent?.trim() : ""

      return text || null
    })
    .filter((line) => line !== null)

  return lines.join(" ")
}

/**
 * Extracts video metadata (title, URL, channel)
 */
function getVideoMetadata(): {
  title: string
  url: string
  channel: string
} {
  // Get video title
  const titleElement =
    document.querySelector("h1.ytd-video-primary-info-renderer") ||
    document.querySelector("h1.title") ||
    document.querySelector("ytd-watch-metadata h1") ||
    document.querySelector("h1 yt-formatted-string")

  const title = titleElement?.textContent?.trim() || "Unknown Video"

  // Get current URL
  const url = window.location.href

  // Get channel name
  const channelElement =
    document.querySelector("ytd-channel-name a") ||
    document.querySelector("#channel-name a") ||
    document.querySelector(
      "ytd-video-owner-renderer .ytd-channel-name a"
    )

  const channel = channelElement?.textContent?.trim() || "Unknown Channel"

  return { title, url, channel }
}

/**
 * Main function to extract YouTube video context
 * Extracts transcript and metadata, returns VideoContext object
 */
export async function extractYouTubeContext(): Promise<VideoContext> {
  try {
    // Step 1: Open transcript panel
    await openTranscriptPanel()

    // Step 2: Extract transcript segments
    const segments = extractTranscriptSegments()

    // Step 3: Format transcript into plain text
    const transcript = formatTranscript(segments)

    // Step 4: Get video metadata
    const { title, url, channel } = getVideoMetadata()

    // Return the complete context
    return {
      transcript,
      title,
      url,
      channel,
      timestamp: Date.now()
    }
  } catch (error) {
    console.error("Error extracting YouTube context:", error)
    throw error
  }
}

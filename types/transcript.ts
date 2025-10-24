/**
 * Video Context Interface
 * Stores YouTube video metadata and transcript for AI context
 */
export interface VideoContext {
  /** The full transcript text from the YouTube video */
  transcript: string
  /** The title of the YouTube video */
  title: string
  /** The URL of the YouTube video */
  url: string
  /** The channel/creator name */
  channel: string
  /** Timestamp when the context was created */
  timestamp: number
}

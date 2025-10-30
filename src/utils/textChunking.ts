import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters"
import type { TranscriptChunk } from "~types/transcript"

/**
 * Configuration for text chunking
 */
const CHUNK_CONFIG = {
  chunkSize: 512, // Target characters per chunk
  chunkOverlap: 100, // Overlap between chunks for context continuity
  separators: ["\n\n", "\n", ". ", " ", ""] // Prefer splitting on paragraph/sentence boundaries
}

/**
 * Chunks a transcript into overlapping segments suitable for embedding
 *
 * @param transcript - Full video transcript text (clean, no timestamps)
 * @param videoId - YouTube video ID
 * @param chunkSize - Dynamic chunk size based on model context window
 * @returns Array of transcript chunks
 */
export async function chunkTranscript(
  transcript: string,
  videoId: string,
  chunkSize: number
): Promise<TranscriptChunk[]> {
  // Initialize text splitter with dynamic chunk size
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap: CHUNK_CONFIG.chunkOverlap,
    separators: CHUNK_CONFIG.separators,
    lengthFunction: (text: string) => text.length
  })

  // Split transcript into chunks
  const textChunks = await splitter.splitText(transcript)

  // Map text chunks to TranscriptChunk objects
  const chunks: TranscriptChunk[] = textChunks.map((text, index) => ({
    id: `${videoId}-chunk-${index}`,
    videoId,
    text,
    chunkIndex: index
  }))

  return chunks
}

/**
 * Checks if transcript needs RAG (too long for context window)
 */
export function shouldUseRAG(transcript: string): boolean {
  const TRANSCRIPT_CHAR_LIMIT = 2000
  return transcript.length > TRANSCRIPT_CHAR_LIMIT
}

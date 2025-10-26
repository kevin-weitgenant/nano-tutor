import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getEmbedder } from "~background"
import { chunkTranscript } from "~utils/textChunking"
import type { TranscriptChunk } from "~types/transcript"

export type RequestBody = {
  transcript: string
  url: string
}

export type ResponseBody = {
  success: boolean
  chunkCount: number
  totalTimeMs: number
  avgTimePerChunk: number
}

/**
 * Extract YouTube video ID from URL
 */
function extractVideoId(url: string): string {
  const match = url.match(/[?&]v=([^&]+)/)
  return match ? match[1] : "unknown"
}

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = async (req, res) => {
  const startTime = performance.now()

  try {
    const { transcript, url } = req.body

    console.log("🔄 Starting chunking and embedding process...")
    console.log(`📝 Transcript length: ${transcript.length} characters`)

    // Extract video ID
    const videoId = extractVideoId(url)
    console.log(`🎬 Video ID: ${videoId}`)

    // Step 1: Chunk the transcript
    const chunkingStart = performance.now()
    const chunks = await chunkTranscript(transcript, videoId)
    const chunkingTime = performance.now() - chunkingStart
    console.log(
      `✂️  Chunked into ${chunks.length} chunks in ${chunkingTime.toFixed(2)}ms`
    )

    // Step 2: Get embedder
    const embedder = await getEmbedder()

    // Step 3: Embed each chunk
    const embeddingStart = performance.now()
    const embeddedChunks: TranscriptChunk[] = []

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      const chunkStart = performance.now()

      // Generate embedding
      const output = await embedder(chunk.text, {
        pooling: "mean",
        normalize: true
      })

      // Convert to array and attach to chunk
      chunk.embedding = Array.from(output.data)

      const chunkTime = performance.now() - chunkStart
      console.log(
        `  ⚡ Chunk ${i + 1}/${chunks.length}: ${chunkTime.toFixed(2)}ms (${chunk.text.length} chars)`
      )

      embeddedChunks.push(chunk)
    }

    const embeddingTime = performance.now() - embeddingStart
    const totalTime = performance.now() - startTime

    // Log summary
    console.log("\n📊 Embedding Summary:")
    console.log(`  Total chunks: ${chunks.length}`)
    console.log(`  Chunking time: ${chunkingTime.toFixed(2)}ms`)
    console.log(`  Embedding time: ${embeddingTime.toFixed(2)}ms`)
    console.log(`  Total time: ${totalTime.toFixed(2)}ms`)
    console.log(
      `  Avg per chunk: ${(embeddingTime / chunks.length).toFixed(2)}ms`
    )
    console.log(`  Embedding dimensions: ${embeddedChunks[0].embedding?.length}`)

    res.send({
      success: true,
      chunkCount: chunks.length,
      totalTimeMs: totalTime,
      avgTimePerChunk: embeddingTime / chunks.length
    })
  } catch (error) {
    console.error("❌ Embedding failed:", error)
    res.send({
      success: false,
      chunkCount: 0,
      totalTimeMs: performance.now() - startTime,
      avgTimePerChunk: 0
    })
  }
}

export default handler

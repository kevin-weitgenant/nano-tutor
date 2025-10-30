import { sendToBackground } from "@plasmohq/messaging"
import type { VideoContext } from "~types/transcript"
import { RAG_CONFIG } from "./constants"

interface RAGDecisionResult {
  systemPrompt: string
  shouldUseRAG: boolean
}

export async function decideRAGStrategy(
  context: VideoContext,
  languageModel: any
): Promise<RAGDecisionResult> {
  // If session.inputQuota proves slow, we can optimize this later
  const tempSession = await languageModel.create()
  const inputQuota = tempSession.inputQuota
  const transcriptTokens = await tempSession.measureInputUsage(context.transcript)
  const ragThreshold = Math.floor(inputQuota * RAG_CONFIG.threshold)

  if (transcriptTokens > ragThreshold) {
    // === RAG MODE ===
    console.log(`🎯 RAG Decision: Using RAG mode (transcript: ${transcriptTokens} tokens > threshold: ${ragThreshold} tokens)`)
    
    const ragSystemPrompt = `You are an assistant that answers questions about the video: ${context.title}. You will receive the question of the user and some relevant chunks of the transcript. Make use of them and write the best reply.`
    
    // Check if embeddings exist for this video
    const { exists } = await sendToBackground({
      name: "checkEmbeddings",
      body: { videoId: context.videoId }
    })
    
    // Generate embeddings if they don't exist
    if (!exists) {
      await sendToBackground({
        name: "embedTranscript",
        body: {
          transcript: context.transcript,
          url: context.url,
          videoTitle: context.title
        }
      })
    }

    else {
      console.log("Embeddings already exist for this videoid and chunk size")
    }
    
    
    tempSession.destroy()
    return { systemPrompt: ragSystemPrompt, shouldUseRAG: true }
  } else {
    // === FULL TRANSCRIPT MODE ===
    console.log(`📄 RAG Decision: Using full transcript mode (transcript: ${transcriptTokens} tokens <= threshold: ${ragThreshold} tokens)`)
    
    const fullTranscriptPrompt = `You are an assistant that answers questions about the video: ${context.title}. Here is the full transcript:\n\n${context.transcript}`
    tempSession.destroy()
    return { systemPrompt: fullTranscriptPrompt, shouldUseRAG: false }
  }
}


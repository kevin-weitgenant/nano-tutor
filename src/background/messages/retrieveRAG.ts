import type { PlasmoMessaging } from "@plasmohq/messaging"
import { getEmbedder } from "~background"
import { retrieveRelevantContext } from "~background/utils/ragRetrieval"

export type RequestBody = {
  userQuery: string
  videoId: string
  tokenBudget: number
}

export type ResponseBody = {
  context: string | null
}

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = async (req, res) => {
  console.log("📬 Background: Received RAG retrieval request")

  const { userQuery, videoId, tokenBudget } = req.body

  try {
    // Get the embedder instance (cached after first load)
    const embedder = await getEmbedder()

    // Perform RAG retrieval
    const context = await retrieveRelevantContext(
      userQuery,
      videoId,
      embedder,
      tokenBudget
    )

    console.log("📬 Background: RAG retrieval complete, sending response")
    res.send({ context })
  } catch (error) {
    console.error("📬 Background: RAG retrieval failed:", error)
    res.send({ context: null })
  }
}

export default handler

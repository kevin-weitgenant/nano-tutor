import type { PlasmoMessaging } from "@plasmohq/messaging"
import { checkEmbeddingsExist } from "~utils/mememoStore"

export type RequestBody = {
  videoId: string
  chunkSize: number
}

export type ResponseBody = {
  exists: boolean
}

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = async (req, res) => {
  const { videoId, chunkSize } = req.body
  const exists = await checkEmbeddingsExist(videoId, chunkSize)
  
  res.send({ exists })
}

export default handler


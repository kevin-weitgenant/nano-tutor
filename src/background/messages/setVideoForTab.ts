import type { PlasmoMessaging } from "@plasmohq/messaging";





const handler: PlasmoMessaging.MessageHandler = async (req, res) => {
  if (req.sender.tab?.id) {
    await chrome.storage.session.set({ [req.sender.tab.id]: req.body.videoId })
    res.send({ success: true })
  }
}

export default handler
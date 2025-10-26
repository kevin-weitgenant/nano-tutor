import type { PlasmoMessaging } from "@plasmohq/messaging"

export type RequestBody = {}

export type ResponseBody = {
  success: boolean
}

const handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody> = async (req, res) => {
  try {
    // Get the tab that sent the message
    const windowId = req.sender?.tab?.windowId

    if (!windowId) {
      res.send({ success: false })
      return
    }

    // Open the side panel for the current window
    await chrome.sidePanel.open({ windowId })

    res.send({ success: true })
  } catch (error) {
    console.error("Failed to open side panel:", error)
    res.send({ success: false })
  }
}

export default handler

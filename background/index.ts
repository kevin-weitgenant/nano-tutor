import { env, pipeline } from "@huggingface/transformers";





console.log(env,pipeline)

env.backends.onnx.wasm.proxy = false;
(async () => {
  const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { device: "webgpu" })
  const output = await embedder("hello world", { pooling: "mean", normalize: true })
  console.log("✅ GPU embeddings working! Shape:", output.dims)
})()


// Listen for extension icon clicks to open side panel
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId })
})

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openSidePanel" && sender.tab?.windowId) {
    chrome.sidePanel.open({ windowId: sender.tab.windowId })
    sendResponse({ success: true })
  }
  return true // Required for async sendResponse
})



export {}
import { env, pipeline } from "@huggingface/transformers"

console.log(env, pipeline)

env.backends.onnx.wasm.proxy = false

// Global embedder instance - accessible to message handlers
let embedder: any = null

// Initialize embedder on background script load
;(async () => {
  console.log("🔄 Loading embedder model...")
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    device: "webgpu"
  })
  const output = await embedder("hello world", {
    pooling: "mean",
    normalize: true
  })
  console.log("✅ GPU embeddings working! Shape:", output.dims)
})()

/**
 * Get the embedder instance (waits if still loading)
 */
export async function getEmbedder() {
  // Poll until embedder is ready
  while (!embedder) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  return embedder
}

// Listen for extension icon clicks to open side panel
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId })
})

export {}

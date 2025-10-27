import { env, pipeline } from "@huggingface/transformers";





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

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return
  const url = new URL(tab.url)
  // Enables the side panel on google.com
  if (url.origin === "https://www.youtube.com") {
    await chrome.sidePanel.setOptions({
      tabId,
      path: "sidepanel.html",
      enabled: true
    })
  } else {
    // Disables the side panel on all other sites
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false
    })
  }
})

export {}
export {}

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

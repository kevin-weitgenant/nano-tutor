import { Storage } from "@plasmohq/storage"

/**
 * Shared Storage Instance
 * Configured to use chrome.storage.local (10MB+ limit)
 * Instead of chrome.storage.sync (8KB per item limit)
 *
 * This prevents quota exceeded errors when storing large YouTube transcripts
 */
export const storage = new Storage({
  area: "local"
})

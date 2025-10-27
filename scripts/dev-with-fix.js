const { spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

// Start plasmo dev
console.log("🚀 Starting Plasmo dev server...\n")
const plasmoProcess = spawn("pnpm", ["with-env", "plasmo", "dev"], {
  stdio: "inherit",
  shell: true
})

// Watch for manifest.json changes
const manifestPath = path.join(
  __dirname,
  "../build/chrome-mv3-dev/manifest.json"
)

let hasRun = false
let watcherStarted = false

// Give Plasmo a moment to start building
setTimeout(() => {
  console.log("\n⏳ Waiting for initial build to complete...\n")
  
  // Check periodically for manifest file
  const checkInterval = setInterval(() => {
    if (fs.existsSync(manifestPath) && !hasRun) {
      clearInterval(checkInterval)
      // Wait a bit more to ensure file is fully written
      setTimeout(() => {
        console.log("\n🔧 Running manifest fix...\n")
        try {
          require("../postbuild/fix-manifest")()
          hasRun = true
          console.log("\n✅ Manifest fixed! Dev server is ready.\n")
          
          // Start watching for future changes
          if (!watcherStarted) {
            startWatcher()
          }
        } catch (error) {
          console.error("❌ Error fixing manifest:", error)
        }
      }, 500)
    }
  }, 500)
}, 2000)

function startWatcher() {
  watcherStarted = true
  console.log("👀 Watching for manifest changes...\n")
  
  fs.watch(path.dirname(manifestPath), (eventType, filename) => {
    if (filename === "manifest.json" && fs.existsSync(manifestPath)) {
      // Debounce to avoid multiple rapid fixes
      setTimeout(() => {
        try {
          const content = fs.readFileSync(manifestPath, "utf8")
          const manifest = JSON.parse(content)
          
          // Only fix if side_panel exists (build regenerated it)
          if (manifest.side_panel) {
            console.log("\n🔧 Detected manifest regeneration, fixing...\n")
            require("../postbuild/fix-manifest")()
            console.log("✅ Manifest fixed!\n")
          }
        } catch (error) {
          // Ignore parse errors during file write
        }
      }, 1000)
    }
  })
}

// Handle exit signals
process.on("SIGINT", () => {
  plasmoProcess.kill()
  process.exit()
})

process.on("SIGTERM", () => {
  plasmoProcess.kill()
  process.exit()
})

plasmoProcess.on("exit", (code) => {
  process.exit(code)
})


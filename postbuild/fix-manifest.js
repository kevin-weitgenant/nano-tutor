const fs = require("fs")
const path = require("path")

const fixManifest = () => {
  // Try to get Plasmo env vars, fallback to defaults for dev mode
  const buildDir = process.env.PLASMO_BUILD_DIR || path.join(__dirname, "../build")
  const target = process.env.PLASMO_TARGET || "chrome-mv3"
  const tag = process.env.PLASMO_TAG || "dev"
  
  const targetDir = `${buildDir}/${target}-${tag}`
  const manifestFile = `${targetDir}/manifest.json`

  try {
    // Read the manifest file
    const content = fs.readFileSync(manifestFile, "utf8")
    const manifest = JSON.parse(content)

    // Remove the side_panel field entirely
    if (manifest.side_panel) {
      delete manifest.side_panel
      console.log("✓ Removed side_panel from manifest.json")
    }

    // Write the modified manifest back
    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2), "utf8")
  } catch (error) {
    console.error(`Error processing manifest ${manifestFile}:`, error)
  }
}

module.exports = fixManifest

// Allow running directly
if (require.main === module) {
  fixManifest()
}


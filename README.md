This is a [Plasmo extension](https://docs.plasmo.com/) project bootstrapped with [`plasmo init`](https://www.npmjs.com/package/plasmo).

## Storage Architecture

This extension uses multiple storage systems to manage different types of data efficiently. Here's where everything is stored on the user's computer:

### 1. **Transformers v3 Embedding Model** (`Xenova/all-MiniLM-L6-v2`)
- **Storage Type**: Browser's **Cache Storage API**
- **Location**: Managed by `@huggingface/transformers` library automatically
- **What's Stored**: ONNX model files for text embeddings
- **Details**: On first run, the model is downloaded and cached by the browser. Subsequent loads reuse the cached model.
- **Path**: Viewable in Chrome DevTools → Application → Cache Storage
- **Persistent**: Yes

### 2. **Chrome Local Storage** (`chrome.storage.local`)
- **Storage Type**: Chrome extension's local storage
- **What's Stored**:
  - `videoContext_${videoId}` - Video metadata (title, transcript, channel, URL) - **video-centric, persistent**
- **Size Limit**: 10MB+ (much larger than sync storage, ~100-200 videos)
- **Lifecycle**: Persistent - cached indefinitely for instant access on revisit
- **Path on Disk**: 
  ```
  C:\Users\{Username}\AppData\Local\Google\Chrome\User Data\Default\Extensions\{extension-id}\
  ```
- **Persistent**: Yes

### 3. **Chrome Session Storage** (`chrome.storage.session`)
- **Storage Type**: In-memory storage (RAM)
- **What's Stored**: 
  - `${tabId}` → `videoId` - Mapping from tab to current video
  - `embeddingProgress-${videoId}` - Temporary progress tracking during embedding generation
- **Lifecycle**: Temporary - cleared when browser closes
- **Persistent**: No (session only)

### 4. **IndexedDB via MeMemo**
- **Storage Type**: Browser's IndexedDB (persistent database)
- **What's Stored**: `TranscriptChunk[]` - Text chunks with their 384-dimensional embedding vectors
- **Details**: Each chunk contains both the text and its corresponding embedding vector together
- **Path on Disk**:
  ```
  C:\Users\{Username}\AppData\Local\Google\Chrome\User Data\Default\IndexedDB\chrome-extension_{extension-id}_0.indexeddb.leveldb\
  ```
- **Persistent**: Yes

### 5. **Gemini Nano** (Chrome's Built-in AI)
- **Storage Type**: Chrome-managed internal storage
- **What's Stored**: Gemini Nano language model
- **Details**: Completely managed by Chrome's Prompt API - not accessible to the extension directly
- **Path on Disk** (approximate):
  ```
  C:\Users\{Username}\AppData\Local\Google\Chrome\User Data\OptimizationGuide\models\
  ```
- **Access**: Via `LanguageModel` API only
- **Persistent**: Yes (Chrome-controlled)

### Storage Summary Table

| Component | Storage Type | Location | What's Stored | Persistent? |
|-----------|-------------|----------|---------------|-------------|
| Embedding Model | Cache Storage API | Browser cache | ONNX model files | Yes |
| Video Context | `chrome.storage.local` | Extension storage | Video metadata (video-centric) | Yes |
| Tab-Video Mapping & Progress | `chrome.storage.session` | RAM | Tab→Video mapping, embedding progress | No |
| Embedded Chunks | IndexedDB (MeMemo) | Browser database | Text + 384D vectors | Yes |
| Gemini Nano | Chrome-managed | Chrome internal | Language model | Yes |

All storage is located within the user's local Chrome profile directory and managed by different browser APIs.

### Video-Centric Storage Architecture

The extension uses a **video-centric** storage model for optimal performance:

- **Video contexts are stored once per video** (`videoContext_${videoId}`) and persist indefinitely
- **Session storage maps tabs to videos** (`${tabId}` → `videoId`)
- **Benefits**:
  - Second tab with same video loads instantly (no transcript extraction)
  - Revisiting a video weeks later is instant (persistent cache)
  - Simple architecture with automatic cleanup
- **Storage capacity**: Max 50 videos (~4MB of 10MB limit)
- **Automatic cleanup**: When limit reached, removes oldest 10 videos (down to 40)
- **Privacy**: All data is local-only, never synced (similar to browser history)

## Getting Started

First, run the development server:

```bash
pnpm dev
# or
npm run dev
```

Open your browser and load the appropriate development build. For example, if you are developing for the chrome browser, using manifest v3, use: `build/chrome-mv3-dev`.

You can start editing the popup by modifying `popup.tsx`. It should auto-update as you make changes. To add an options page, simply add a `options.tsx` file to the root of the project, with a react component default exported. Likewise to add a content page, add a `content.ts` file to the root of the project, importing some module and do some logic, then reload the extension on your browser.

For further guidance, [visit our Documentation](https://docs.plasmo.com/)

## Making production build

Run the following:

```bash
pnpm build
# or
npm run build
```

This should create a production bundle for your extension, ready to be zipped and published to the stores.

## Submit to the webstores

The easiest way to deploy your Plasmo extension is to use the built-in [bpp](https://bpp.browser.market) GitHub action. Prior to using this action however, make sure to build your extension and upload the first version to the store to establish the basic credentials. Then, simply follow [this setup instruction](https://docs.plasmo.com/framework/workflows/submit) and you should be on your way for automated submission!

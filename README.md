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

### 4. **IndexedDB for Vector Storage**
- **Storage Type**: Browser's IndexedDB (persistent database)
- **What's Stored**:
  - **Chunk Store** (`transcript-chunks`): Full `TranscriptChunk[]` objects with text and metadata
  - **Vector Index** (HNSW): 384-dimensional embedding vectors for similarity search
- **Chunking Strategy**:
  - Chunk size: 512 characters
  - Overlap: 100 characters (ensures context continuity)
  - Format: `{videoId}-chunk-{index}` (e.g., `abc123xyz-chunk-7`)
- **Vector Search**: HNSW (Hierarchical Navigable Small World) index for fast semantic similarity queries
- **Details**: Each chunk contains the text, chunk index, video ID, and its 384-dim embedding vector
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
| Chunked Transcripts | IndexedDB | Browser database | 512-char chunks + 384D vectors (HNSW index) | Yes |
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

## RAG Strategy

The extension intelligently decides between two modes when handling video transcripts:

### RAG Decision Logic

**When transcripts are evaluated:**
- At session initialization, the extension compares transcript size against the model's context window
- **Threshold**: 80% of the model's input quota (configurable via `RAG_CONFIG.threshold`)

**Two modes:**

1. **Full Transcript Mode** (transcript ≤ 80% of quota)
   - Entire transcript included directly in the system prompt
   - No chunking or embedding needed
   - Fast, simple, direct access to all content
   - Best for short videos (<10 minutes typically)

2. **RAG Mode** (transcript > 80% of quota)
   - Transcript is chunked (512 chars with 100 char overlap)
   - Each chunk embedded into 384-dimensional vectors
   - Vectors stored in HNSW index for fast similarity search
   - Only relevant chunks retrieved at query time

### RAG Retrieval Strategy (First Message Only)

When RAG mode is active, retrieval happens **only on the first user message**:

**Budget Calculation:**
```
Available Tokens = Model Quota - System Prompt - User Message
Chunk Budget = Available Tokens × 50%
Buffer (for assistant + follow-ups) = Available Tokens × 50%
```

**Retrieval Process:**
1. Calculate how many 512-char chunks fit in the chunk budget
2. Embed user query into 384-dim vector
3. Query HNSW index for top-K most similar chunks (K = calculated chunk count)
4. Retrieve full chunk text from IndexedDB
5. Inject chunks into first message: `{chunks}\n\nUser question: {query}`
6. Send augmented message to model

**Subsequent messages:**
- Skip RAG retrieval (chunks already in context from Turn 1)
- Send user message directly
- Relies on established context for follow-up questions

**Why 50%?**
- Simple, naive strategy that works well across different model quotas
- Leaves ample buffer for assistant responses and follow-up conversation
- Scales automatically: 4K quota → ~13 chunks, 128K quota → ~460 chunks
- No need to predict assistant response length or future turns

**Key Characteristics:**
- Single retrieval per session (first message only)
- Budget-aware: adapts chunk count to available quota
- Fast: character-based token estimation (no API calls per chunk)
- Predictable: same inputs always retrieve same chunk count

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

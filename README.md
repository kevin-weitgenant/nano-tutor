<div align="center">

<img src="assets/icon.png" alt="chrome extension logo" width="256" />

# Nano Tutor

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://react.dev/)
[![Plasmo](https://img.shields.io/badge/Plasmo-0b8fe9?logo=googlechrome&logoColor=white)](https://docs.plasmo.com/)
[![Chrome AI](https://img.shields.io/badge/Chrome%20AI-Gemini%20Nano-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/ai/)
[![Transformers v3](https://img.shields.io/badge/Transformers%20v3-Xenova%2Fall--MiniLM--L6--v2-FFD21E?logo=huggingface)](https://huggingface.co/docs/transformers.js/index)

</div>

Chat with YouTube videos directly inside Chrome using Gemini Nano, Plasmo, and on-device embeddings powered by `@huggingface/transformers`.

## Highlights

- Local-first video context cache for instant revisits with zero extra network calls.
- Lightweight RAG pipeline that only applies chunking and embeddings when transcripts exceed the model window.
- Gemini Nano side panel experience that mirrors native Chrome UX.
- Custom build patches that keep Plasmo + Transformers v3 working inside Manifest V3 constraints.

## RAG Status & Performance Snapshot

- **Current approach**: A first-pass, intentionally naive implementation used to test GPU-backed embeddings in the browser. It works for demos but will be replaced by a more robust retrieval strategy later on.

- **Embedding timing (Chrome on GPU)**
  - 6 min video → **5.2 s total** (chunking 0.01 s · embedding 5.2 s · 45 chunks ≈ 116 ms each)
  - 2 h 28 min video → **46 s total** (chunking 0.26 s · embedding 45.9 s · 729 chunks ≈ 63 ms each)

## Storage Architecture

This extension uses multiple storage systems to manage transcripts, embeddings, and session state. Everything lives inside the user's Chrome profile.

### 1. Transformers v3 Embedding Model (`Xenova/all-MiniLM-L6-v2`)

- **Storage Type**: Browser **Cache Storage API**
- **Location**: Automatically managed by `@huggingface/transformers`
- **Stored Assets**: ONNX model files for text embeddings
- **Lifecycle**: Downloaded on first use, then cached for reuse
- **Inspect via**: Chrome DevTools → Application → Cache Storage

### 2. Chrome Local Storage (`chrome.storage.local`)

- **Data**: `videoContext_${videoId}` objects (title, transcript, channel, URL)
- **Capacity**: ~10 MB (enough for ~100–200 videos)
- **Lifecycle**: Persistent cache with automatic LRU cleanup (drops oldest 10 when limit reached)
- **Disk Path**:

  ```
  C:\Users\{Username}\AppData\Local\Google\Chrome\User Data\Default\Extensions\{extension-id}\
  ```

### 3. Chrome Session Storage (`chrome.storage.session`)

- **Data**: Temporary tab → video mapping (`${tabId}` → `videoId`) plus `embeddingProgress-${videoId}` entries
- **Lifecycle**: In-memory; cleared when the browser closes

### 4. IndexedDB Vector Store

- **Stores**: `TranscriptChunk[]` items (text + metadata) and 384-dim embeddings for HNSW similarity search
- **Chunking**: 512 characters with 100-character overlap (`{videoId}-chunk-{index}`)
- **Benefits**: Fast semantic lookups with persistent storage
- **Disk Path**:

  ```
  C:\Users\{Username}\AppData\Local\Google\Chrome\User Data\Default\IndexedDB\chrome-extension_{extension-id}_0.indexeddb.leveldb\
  ```

### 5. Gemini Nano (Chrome managed)

- **Usage**: Accessed via the `LanguageModel` Prompt API; extension cannot read files directly
- **Disk Path (approx)**:

  ```
  C:\Users\{Username}\AppData\Local\Google\Chrome\User Data\OptimizationGuide\models\
  ```

### Storage Summary

| Component | Storage Type | Location | What's Stored | Persistent? |
|-----------|-------------|----------|---------------|-------------|
| Embedding Model | Cache Storage API | Browser cache | ONNX model files | Yes |
| Video Context | `chrome.storage.local` | Extension storage | Video metadata | Yes |
| Tab ↔ Video & Progress | `chrome.storage.session` | RAM | Session mappings | No |
| Transcript Chunks & Vectors | IndexedDB | Browser database | 512-char chunks + 384D vectors (HNSW) | Yes |
| Gemini Nano | Chrome managed | Internal | Language model | Yes |

## RAG Flow (Current)

1. **Decision Stage**: On session start, transcripts are compared against 80% of the model's context window (`RAG_CONFIG.threshold`).
2. **Full Transcript Mode**: For smaller transcripts—typically up to ~30 minutes of video when the token density stays reasonable—Gemini Nano can ingest the entire transcript in the system prompt, so no embeddings or extra storage hops are needed.
3. **RAG Mode**: Longer or denser transcripts are chunked (512 chars · 100 char overlap), embedded, stored in IndexedDB, and queried through an HNSW index.
4. **First Message Retrieval**: Only the initial user prompt triggers a vector search. Available tokens are split 50/50 between chunk budget and assistant responses, yielding deterministic chunk counts.
5. **Follow-up Messages**: Skip retrieval and rely on established context.

Expect upcoming iterations to incorporate better chunk selection, re-ranking, and conversational memory.

## Transformers v3 × Plasmo Notes

Bundling `@huggingface/transformers@3` into a Manifest V3 service worker requires a few workarounds:

- **URL resolution patches**: `postbuild/sed.js` replaces `new URL(import.meta.url)` with `new URL(self.location.href)` so ONNX assets resolve inside the service worker sandbox.
- **Manifest cleanup**: `postbuild/fix-manifest.js` strips the generated `side_panel` entry that conflicts with Chrome's side panel permission model in this setup.
- **Dev convenience**: `scripts/dev-with-fix.js` wraps `plasmo dev`, waits for the first build, applies the manifest patch, and keeps watching for regenerations.

These scripts keep the build stable today, but upstream improvements or a different bundler strategy could remove the need for manual patches.

## Observations

- **Transformers v3 inside Plasmo**: The combination works, but only after patching URL resolution and pruning Plasmo’s generated manifest. Without the post-build script, model assets fail to resolve in the service worker.
- **Plasmo side panel ergonomics**: Plasmo treats the side panel as a global definition, so the generated manifest always declares it. To keep the extension scoped to YouTube we rely on a `manifest.json` fix script—otherwise the side panel surfaces everywhere, which is noisy and requires annoying manual configuration.

## Video-Centric Storage Model

- Each video stores one persistent context record (`videoContext_${videoId}`) for instant reloads.
- Session storage tracks which tab belongs to which video, so duplicate tabs skip re-processing.
- Everything stays on-device; nothing leaves the Chrome profile.

## Getting Started

```bash
pnpm install
pnpm dev
```

Load `build/chrome-mv3-dev` into Chrome as an unpacked extension. Edit `src/sidepanel.tsx` (or any component) and Plasmo will hot-reload it into the side panel.

For production bundles:

```bash
pnpm build
```

The output lives in `build/` and is ready for manual packaging.

## Roadmap Ideas

- Replace the naive first-pass RAG with a more selective retriever and conversational memory.
- Experiment with model distillation for faster embeddings.
- Integrate better progress UI for long transcripts.

## License

Distributed under the [MIT License](./LICENSE).


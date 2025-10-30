# RAG System Upgrade Plan

## Scope

Implement adaptive transcript chunking, persistence, and retrieval so the side panel can answer questions using a RAG workflow backed by MeMemo.

## Phases

1. Phase 1 – Dynamic Prompt Detection

- Files: `src/hooks/useAISession.ts`, `src/utils/constants.ts`, `src/utils/textChunking.ts`, new `src/utils/tokenUtils.ts`.
- Tasks:
- Measure quota using `newSession.measureInputUsage`, branch between full-transcript and RAG modes.
- Update system prompt builder to handle metadata-only prompts and expose mode metadata.
- Refactor chunk utilities to accept dynamic sizes and expose token counts.
- Testing: verify prompt selection by logging token counts; ensure transcript display toggles in UI.

2. Phase 2 – MeMemo Storage & Embedding Pipeline

- Files: `src/background/messages/embedTranscript.ts`, new `src/background/services/mememoStore.ts`, new `src/types/rag.ts`, `src/utils/tokenUtils.ts` (shared helpers).
- Tasks:
- Build MeMemo service to load/store/query embeddings with metadata.
- Update embed handler to reuse or regenerate embeddings based on chunk size; record status in storage.
- Testing: run embedding flow twice to confirm reuse path and inspect stored metadata.

3. Phase 3 – Progress UI Integration

- Files: new `src/components/EmbeddingProgress.tsx`, `src/sidepanel.tsx`, `src/hooks/useModelAvailability.ts`.
- Tasks:
- Create progress component observing `embeddingProgress-*` keys; render status, chunk size, reuse info.
- Mount component in the side panel, conditionally show based on mode.
- Testing: trigger embedding workflow, watch progress UI update; confirm reuse shows immediate ready state.

4. Phase 4 – Query Retrieval Pipeline

- Files: new `src/utils/ragPipeline.ts`, `src/hooks/useStreamingResponse.ts`, `src/background/services/mememoStore.ts` (query helper).
- Tasks:
- Implement query embedding + top-K retrieval; integrate into streaming hook when in RAG mode.
- Ensure prompts stay within quota by re-measuring with `measureInputUsage` and truncating as needed.
- Testing: send user queries, verify retrieved chunk texts influence responses; inspect token usage updates.

5. Phase 5 – Lifecycle & Cleanup Wiring

- Files: `src/hooks/useAISession.ts`, `src/hooks/useStreamingResponse.ts`, `src/background/index.ts`, `src/utils/storage.ts`.
- Tasks:
- Persist RAG metadata per `videoId`, clear on tab/video changes; reset state on session reset.
- Ensure background listeners remove stale indices/progress when tabs close.
- Testing: switch videos/tabs to confirm state resets cleanly without leftover metadata.

## Files to Touch / Add

- Update: `src/hooks/useAISession.ts`, `src/hooks/useStreamingResponse.ts`, `src/utils/constants.ts`, `src/utils/textChunking.ts`, `src/background/messages/embedTranscript.ts`, `src/sidepanel.tsx`, `src/hooks/useModelAvailability.ts`, `src/background/index.ts`.
- Add: `src/utils/tokenUtils.ts`, `src/utils/ragPipeline.ts`, `src/background/services/mememoStore.ts`, `src/components/EmbeddingProgress.tsx`, `src/types/rag.ts`.

## Testing & Validation

- Phase-by-phase manual validation as listed above; final regression covers both small and large transcripts, embedding reuse, and RAG query responses.
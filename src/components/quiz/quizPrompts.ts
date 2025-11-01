import type { VideoContext } from "~types/transcript"

export function generateConceptPrompt(videoContext: VideoContext): string {
  return `Extract ALL key concepts from the following video transcript. For each concept, provide a concise title and a detailed description that explains the concept thoroughly.

Video: "${videoContext.title}"
Channel: ${videoContext.channel}

Transcript:
${videoContext.transcript}

For each key concept, return an object with:
- id: sequential number starting from 1
- title: concise title of the concept (2-8 words)
- description: detailed explanation of the concept (2-4 sentences providing comprehensive context and explanation)

Extract as many concepts as are present in the video. Focus on substantive concepts that represent important ideas, topics, or themes discussed in the video.`
}


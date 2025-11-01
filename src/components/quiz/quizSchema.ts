import { z } from "zod"

export const conceptSchema = z.array(
  z.object({
    id: z.number().describe("The concept number"),
    title: z
      .string()
      .describe("A concise title for the key concept"),
    description: z
      .string()
      .describe("A detailed description explaining the concept")
  })
)
  .min(1)
  .describe("A list of key concepts extracted from the video")

export type ConceptArray = z.infer<typeof conceptSchema>
export type Concept = ConceptArray[number]


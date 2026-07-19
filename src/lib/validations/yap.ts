import { z } from "zod";

export const YAP_MAX_LENGTH = 280;

export const yapSchema = z.object({
  content: z
    .string({ error: "Say something." })
    .trim()
    .min(1, "Say something.")
    .max(YAP_MAX_LENGTH, `Keep it under ${YAP_MAX_LENGTH} characters.`),
  parentId: z.string().optional(),
});

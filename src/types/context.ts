import { z } from 'zod';

/**
 * SPEC §3.2 — incident state consumed by the fast-path check and the policy
 * engine. Keywords are scoped to the incident record itself, so the keyword
 * path is only armed while an incident is active.
 */
export const OutageStatusSchema = z.object({
  active: z.boolean(),
  incident_id: z.string().nullable(),
  keywords: z.array(z.string()),
  macro_id: z.string().nullable(),
});
export type OutageStatus = z.infer<typeof OutageStatusSchema>;

/**
 * SPEC §3.2 — a KB chunk (one markdown-heading section, SPEC §6) as
 * retrieval hands it to drafting/groundedness. The approved filter applies
 * to doc frontmatter before chunks are surfaced.
 */
export const ChunkSchema = z.object({
  id: z.string(), // `${doc_id}#${heading-slug}`
  doc_id: z.string(),
  heading: z.string(),
  text: z.string(),
  region: z.enum(['US', 'UK', 'ALL']),
});
export type Chunk = z.infer<typeof ChunkSchema>;

/** SPEC §3.2 — one turn of chat history as passed to LLMProvider.classify. */
export const MsgSchema = z.object({
  role: z.enum(['customer', 'assistant']),
  content: z.string(),
});
export type Msg = z.infer<typeof MsgSchema>;

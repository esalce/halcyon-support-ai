import { z } from 'zod';

/**
 * Incident state consumed by the fast-path check and the policy engine
 * (SPEC §4/§5). Keywords are scoped to the incident record itself, so the
 * keyword path is only armed while an incident is active — an inactive
 * status carries no keywords or macro to match against.
 */
export const OutageStatusSchema = z.discriminatedUnion('active', [
  z.object({ active: z.literal(false) }),
  z.object({
    active: z.literal(true),
    incident_id: z.string(),
    keywords: z.array(z.string()).min(1),
    macro_id: z.string(),
  }),
]);
export type OutageStatus = z.infer<typeof OutageStatusSchema>;

/**
 * A KB chunk (one markdown-heading section, SPEC §6) as retrieval hands it
 * to drafting/groundedness. Governance filtering (approved, region) happens
 * on doc frontmatter before chunks are surfaced.
 */
export const ChunkSchema = z.object({
  id: z.string(), // '<doc_id>#<heading-slug>'
  doc_id: z.string(),
  heading: z.string(),
  text: z.string(),
});
export type Chunk = z.infer<typeof ChunkSchema>;

/** One turn of chat history as passed to LLMProvider.classify. */
export const MsgSchema = z.object({
  role: z.enum(['customer', 'assistant']),
  content: z.string(),
});
export type Msg = z.infer<typeof MsgSchema>;

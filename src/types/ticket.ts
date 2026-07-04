import { z } from 'zod';
import { ClassificationSchema } from './classification.js';

export const RuleResultSchema = z.object({
  rule: z.string(),
  fired: z.boolean(),
  reason: z.string(),
});
export type RuleResult = z.infer<typeof RuleResultSchema>;

/**
 * SPEC §3.2 — the structured block at the top of every escalated ticket:
 * "agents start every escalated ticket knowing everything the AI knew."
 */
export const AgentContextBlockSchema = z.object({
  classification: ClassificationSchema,
  customer_summary: z.object({
    tier: z.string(),
    region: z.string(),
    account_status: z.string(),
  }),
  rules_fired: z.array(RuleResultSchema),
  kb_articles_consulted: z.array(z.string()),
  context_injected: z.array(z.string()),
  suggested_next_step: z.string(),
});
export type AgentContextBlock = z.infer<typeof AgentContextBlockSchema>;

export const TicketPayloadSchema = z.object({
  idempotency_key: z.string(), // hash(turn_id) — dedup on outbox retry
  subject: z.string(),
  priority: z.enum(['normal', 'high']),
  tags: z.array(z.string()),
  agent_context: AgentContextBlockSchema,
  transcript: z.string(),
});
export type TicketPayload = z.infer<typeof TicketPayloadSchema>;

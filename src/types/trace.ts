import { z } from 'zod';
import { ActionSchema } from './action.js';
import { ClassificationSchema, ConfidenceSignalsSchema } from './classification.js';
import { RuleResultSchema } from './ticket.js';

/**
 * SPEC §3.3 — the spine. Every turn emits exactly one Trace, on every path:
 * answer, all escalation variants, incident fast-path, degraded modes,
 * outbox queuing. One substrate for FDE debugging, evals, and Ops reporting.
 *
 * customer_context fields are strings (not the CustomerRecord enums) so that
 * no-context mode (Salesforce down, SPEC §4) can emit 'unknown'.
 */
export const TraceSchema = z.object({
  turn_id: z.string(),
  timestamp: z.string().datetime(),
  customer_id: z.string(),
  routing: z.enum(['incident_fast_path', 'classified']),
  customer_context: z.object({
    tier: z.string(),
    region: z.string(),
    account_status: z.string(),
    recent_disputes: z.number().int().nonnegative(),
  }),
  classification: ClassificationSchema.nullable(), // null on fast-path and LLM-down
  context_injected: z.array(z.string()), // scoped enrichment keys, e.g. 'last_disputed_txn'
  kb: z
    .object({
      topic_route: z.array(z.string()), // empty array = knowledge gap detected
      chunks: z.array(z.object({ id: z.string(), score: z.number() })),
      filters_applied: z.object({ approved: z.literal(true), region: z.string() }),
    })
    .nullable(), // null when retrieval never ran (escalated first, fast-path)
  confidence: ConfidenceSignalsSchema,
  rules_evaluated: z.array(RuleResultSchema),
  action: ActionSchema,
  action_detail: z.object({
    ticket_id: z.string().optional(),
    template_id: z.string().optional(), // e.g. 'dispute-rights-us'
    macro_id: z.string().optional(),
    outbox: z
      .object({
        queued: z.literal(true),
        reason: z.literal('zendesk_unreachable'),
        ref: z.string(), // customer-facing reference backed by the local store
      })
      .optional(),
  }),
  llm: z.object({
    provider: z.string(), // 'none' on zero-LLM paths
    model: z.string(),
    calls: z.number().int().nonnegative(),
    latency_ms: z.number().nonnegative(),
  }),
  answer_served: z.string().nullable(), // grounded answer or verbatim template; null otherwise
});
export type Trace = z.infer<typeof TraceSchema>;

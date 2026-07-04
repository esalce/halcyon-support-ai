import { z } from 'zod';
import { ActionSchema } from './action.js';
import { RuleResultSchema } from './ticket.js';

/**
 * SPEC §3.4 — ANSWER is deliberately excluded: only finalize() can produce
 * it, so no answer reaches the dispatcher without passing the retrieval +
 * groundedness gates.
 */
export const TerminalPreActionSchema = ActionSchema.exclude(['ANSWER']);
export type TerminalPreAction = z.infer<typeof TerminalPreActionSchema>;

/** SPEC §3.4 — output of PolicyEngine.evaluate(), the pre-retrieval phase. */
export const PreDecisionSchema = z.object({
  outcome: z.union([TerminalPreActionSchema, z.literal('ATTEMPT_ANSWER')]),
  rules: z.array(RuleResultSchema),
  template_id: z.string().optional(), // set when outcome = ESCALATE_WITH_APPROVED_RESPONSE
  contextRequests: z.array(z.string()), // scoped injections the LLM may receive (Q5)
  matched_txn_id: z.string().nullable().optional(), // refund flows: deterministically resolved target txn
});
export type PreDecision = z.infer<typeof PreDecisionSchema>;

/** SPEC §3.4 — output of PolicyEngine.finalize(), after retrieval + drafting. */
export const FinalDecisionSchema = z.object({
  action: ActionSchema,
  rules: z.array(RuleResultSchema),
  template_id: z.string().optional(),
});
export type FinalDecision = z.infer<typeof FinalDecisionSchema>;

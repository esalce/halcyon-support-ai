import { z } from 'zod';

/**
 * Topics the deterministic layers key on: policy rules (SPEC §5) and the
 * topic-routing table (SPEC §6). The classifier may emit topics outside this
 * list — unknown topics simply match no route and take the knowledge-gap path.
 */
export const KNOWN_TOPICS = [
  'reg_e_dispute',
  'account_closure',
  'credit_reporting',
  'billing_dispute',
  'refund',
  'paycheck_timing',
  'card_declined',
  'plus_benefits',
  'international_transfers',
  'service_outage',
  'crypto', // intentionally uncovered in the KB — the knowledge-gap demo topic
] as const;
export type KnownTopic = (typeof KNOWN_TOPICS)[number];

/** Topics that must be answered with verbatim approved language (SPEC §5). */
export const REGULATED_TOPICS = [
  'reg_e_dispute',
  'account_closure',
  'credit_reporting',
] as const satisfies readonly KnownTopic[];
export type RegulatedTopic = (typeof REGULATED_TOPICS)[number];

/** Known topics stay autocompletable; arbitrary strings remain assignable. */
export type Topic = KnownTopic | (string & {});
export const TopicSchema: z.ZodType<Topic> = z.string();

/**
 * Intents are open-ended (classifier vocabulary); rules compare them only by
 * equality (VIP billing, ticket dedup). 'unknown' is the reserved value for
 * the LLM-down deterministic fallback (SPEC §4).
 */
export const KNOWN_INTENTS = [
  'billing_dispute',
  'refund_request',
  'paycheck_timing',
  'card_declined',
  'account_closure_request',
  'credit_report_question',
  'plus_benefits_question',
  'transfer_question',
  'crypto_question',
  'unknown',
] as const;
export type KnownIntent = (typeof KNOWN_INTENTS)[number];
export type Intent = KnownIntent | (string & {});
export const IntentSchema: z.ZodType<Intent> = z.string();

/** SPEC §3.2 — the only structured meaning the LLM contributes to routing. */
export const ClassificationSchema = z.object({
  intent: IntentSchema,
  topic: TopicSchema,
  region_detected: z.enum(['US', 'UK', 'unknown']),
  confidence: z.number().min(0).max(1),
});
export type Classification = z.infer<typeof ClassificationSchema>;

/**
 * SPEC §3.2 — the three gate signals. null means "this stage did not run"
 * (fast-path and LLM-down turns never classify; escalate-before-retrieval
 * turns never retrieve or draft), which is distinct from a failing score.
 */
export const ConfidenceSignalsSchema = z.object({
  classification_confidence: z.number().min(0).max(1).nullable(),
  retrieval_strength: z.number().nullable(),
  groundedness_pass: z.boolean().nullable(),
});
export type ConfidenceSignals = z.infer<typeof ConfidenceSignalsSchema>;

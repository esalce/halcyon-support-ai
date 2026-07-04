import type { Classification, ConfidenceSignals } from './classification.js';
import type { Chunk, Msg, OutageStatus } from './context.js';
import type { CustomerRecord } from './customer.js';
import type { FinalDecision, PreDecision } from './policy.js';
import type { TicketPayload } from './ticket.js';

/**
 * SPEC §3.4 — WS-D implements; everyone else consumes. A thin seam, not a
 * framework: provider is a config value, and failover is allowed only to a
 * model that passed the same eval gates — otherwise degrade to the
 * deterministic path.
 *
 * allowedContext is the prompt allowlist {first_name, tier, region,
 * account_status} plus policy-approved scoped injections — nothing else may
 * reach a prompt (SPEC §7).
 */
export interface LLMProvider {
  classify(msg: string, history: Msg[]): Promise<Classification>;
  draft(msg: string, chunks: Chunk[], allowedContext: Record<string, string>): Promise<string>;
  checkGrounded(draft: string, chunks: Chunk[]): Promise<{ pass: boolean; unsupported: string[] }>;
}

/** SPEC §3.4 — WS-A implements. `available: false` drives the outbox path. */
export interface Zendesk {
  createTicket(p: TicketPayload): Promise<{ ticket_id: string }>;
  updateTicket(id: string, p: TicketPayload): Promise<void>;
  applyMacro(macroId: string, ctx: unknown): Promise<void>;
  available: boolean;
}

/**
 * SPEC §3.4 — WS-C implements. Pure functions only: no I/O, no LLM, no mock
 * imports. Two-phase, because retrieval_strength and groundedness_pass don't
 * exist until after retrieval + drafting: evaluate() rules on everything
 * knowable pre-retrieval and either terminates or returns ATTEMPT_ANSWER;
 * finalize() applies the remaining confidence gates to the completed draft.
 * The orchestrator owns the I/O between them, and actions execute only from
 * these decisions, never from LLM output.
 */
export interface PolicyEngine {
  evaluate(input: {
    customer: CustomerRecord;
    classification: Classification;
    kbMatch: boolean;
    outage: OutageStatus;
  }): PreDecision;
  finalize(pre: PreDecision, confidence: ConfidenceSignals): FinalDecision;
}

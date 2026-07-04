import type { Action } from './action.js';
import type { Classification, ConfidenceSignals } from './classification.js';
import type { Chunk, Msg, OutageStatus } from './context.js';
import type { CustomerRecord } from './customer.js';
import type { RuleResult, TicketPayload } from './ticket.js';

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

export interface PolicyInput {
  customer: CustomerRecord;
  classification: Classification;
  confidence: ConfidenceSignals;
  kbMatch: boolean;
  outage: OutageStatus;
}

export interface PolicyDecision {
  action: Action;
  rules: RuleResult[];
  template_id?: string;
  /** Scoped enrichment keys the LLM may see, fetched by deterministic code (SPEC §5). */
  contextRequests: string[];
}

/**
 * SPEC §3.4 — WS-C implements. Pure functions only: no I/O, no LLM, no mock
 * imports. Actions execute from this decision, never from LLM output.
 */
export interface PolicyEngine {
  evaluate(input: PolicyInput): PolicyDecision;
}

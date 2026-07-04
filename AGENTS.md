# AGENTS.md — Reviewer Guide (Codex)

You are reviewing a **weekend-scale interview prototype** that simulates a Maven AI-support
deployment for a fictitious neobank. [SPEC.md](SPEC.md) is the source of truth; review code
**against the SPEC's contracts (§3) and invariants**, not against production standards the
SPEC explicitly defers.

## Review priorities, in order

1. **Contract conformance.** Code must match `src/types/` and SPEC §3 exactly — the `Action`
   enum, `Trace` shape, and the `LLMProvider` / `Zendesk` / `PolicyEngine` interfaces.
   Any ad-hoc type drift or "convenience" fields added outside `src/types/` is a finding.
2. **Policy-engine purity and coverage.** `src/pipeline/policy-engine.ts` must be pure
   functions: no I/O, no LLM calls, no imports from mocks. Every rule in SPEC §5 needs
   fires / doesn't-fire / **boundary** tests (refund day 30 vs 31 US, day 14 vs 15 UK,
   standard vs plus billing dispute, dedup against open_ticket_id).
3. **Safety invariants (flag ANY violation as severe):**
   - LLM prompt interpolation limited to the allowlist {first_name, tier, region,
     account_status} + policy-approved scoped injections. No transactions, balances, PII.
   - Regulated/approved templates delivered verbatim via string interpolation — never
     passed through an LLM call.
   - Dispatcher executes only the policy engine's decision; no path where LLM output
     selects or triggers an action directly.
   - Retrieval enforces `approved === true` and region filtering; the knowledge-gap check
     is the deterministic topic-routing table, not a similarity threshold.
4. **Trace completeness.** Every path — answer, all escalation variants, incident fast-path,
   no-context mode, LLM-down fallback, outbox queue — emits one complete `Trace` with the
   confidence signals broken out individually.
5. **Operational edges.** Outbox: idempotency key respected on retry, backoff bounded,
   customer reference issued from local store. LLM calls: ~5s timeout, single retry, then
   the deterministic escalation path (which must work with zero LLM calls).
6. **Eval integrity.** Scorers match SPEC §8 semantics; `escalation_recall` counts every
   must-escalate case; dataset cases carry expected action + expected rules fired.

## Do NOT flag (explicitly deferred by SPEC)

- Mocks being in-memory/JSON, absence of real auth, secrets handling for the demo key,
  missing persistence, single-process outbox, no i18n, no accessibility polish.
- Prototype-grade UI styling; `console`-based stub logging in mocks.
- BM25 fallback in place of embeddings (that's a sanctioned cut line, SPEC §10).

## Conventions

TypeScript, zod at LLM boundaries, pure functions preferred in `src/pipeline/`. Comments
only for constraints code can't express. Commits are gated: `/clean-code` + `/refactor`
must run against the staged diff (`scripts/commit-gate.sh`) — a commit that bypassed the
gate (`CLAUDE_GATE_SKIP`) without justification is itself a finding.

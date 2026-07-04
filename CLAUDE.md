# CLAUDE.md — Halcyon AI Support System

Interview project (Senior FDE final round): a functional simulation of a Maven AI-support
deployment for a fictitious neobank. **[SPEC.md](SPEC.md) is the single source of truth.**
Read the relevant SPEC section before writing any code; if code and SPEC disagree, the SPEC
wins — or the conflict gets flagged to the human, never silently resolved.

## Architecture (orientation — details in SPEC.md)

**Thesis: AI proposes, rules dispose.** The LLM only extracts structured meaning and drafts
grounded answers. Every consequential decision (escalate, route, serve regulated language,
execute an action) is made by deterministic code in the policy engine, and every turn emits
exactly one structured `Trace` (SPEC §3.3).

Pipeline (SPEC §4): incident fast-path (only while an outage is active) → classify (LLM,
structured output) → load customer context → policy engine (pure) → optional retrieve/draft/
groundedness → action dispatcher → emit Trace.

Layout: `src/types/` (frozen contracts) · `src/mocks/` (Salesforce, Zendesk+outbox, KB) ·
`src/pipeline/` (retrieval, policy-engine, llm, orchestrator) · `src/ui/` (Chat, Trace, Ops) ·
`src/evals/` (dataset, scorers, Braintrust runner) · `fixtures/` (sample traces + customers).

## Hard invariants — never violate, flag if a task seems to require it

1. **Contracts are frozen.** Nothing under `src/types/` changes without explicit human
   approval. Workstreams code against SPEC §3 as written.
2. **The policy engine is pure.** `policy-engine.ts` imports no I/O, no LLM, no mocks. Every
   rule has fires / doesn't-fire / boundary unit tests.
3. **The LLM never generates or paraphrases regulated language.** Approved templates are
   delivered verbatim; slots are filled by string interpolation only.
4. **LLM prompts receive only the allowlist** {first_name, tier, region, account_status} plus
   policy-engine-approved scoped injections. Balances, transaction history, and PII never
   reach a prompt. The policy engine may read anything; the LLM may not.
5. **Actions execute only from the policy decision**, never directly from LLM output.
6. **Every code path emits a complete Trace** — including fast-path, degraded modes, and
   outbox queuing.
7. **Escalations are at-least-once.** Ticket writes go through the outbox with an
   idempotency key when Zendesk is unavailable.

## How to work this repo

- **One workstream at a time** (SPEC §10). State which workstream (A–G) you're executing;
  respect its dependency row and acceptance criteria. UI and evals develop against
  `fixtures/` before the orchestrator exists.
- **Scope discipline:** this is a weekend build with pre-agreed cut lines (SPEC §10). Do not
  add features, frameworks, or abstractions beyond the SPEC. The LLM layer is a thin
  `LLMProvider` seam — not an agent framework.
- Plain TypeScript, zod schemas for runtime validation at LLM boundaries. Match existing
  style; keep comments to constraints the code can't express.
- Verify with the CLI before calling pipeline work done:
  `npm run cli -- --customer plus-us "message"` must print a complete valid Trace.

## Commit gate (required for every commit)

Before any `git commit`:

1. Run **/clean-code** on the staged diff; apply fixes and re-stage.
2. Run **/refactor** on the staged diff; apply fixes and re-stage.
3. Stamp the gate: `sh scripts/commit-gate.sh stamp`
4. Commit. The pre-commit hook re-hashes the staged diff and blocks if it doesn't match the
   stamp — if you change anything after stamping, redo from step 1.

Docs/config-only diffs (no `src/` changes) may stamp directly without the skills.
Escape hatch (humans only, emergencies): `CLAUDE_GATE_SKIP=1 git commit ...`

**Fresh clone setup:** `git config core.hooksPath scripts/git-hooks`

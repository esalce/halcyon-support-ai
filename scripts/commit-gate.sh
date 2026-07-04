#!/usr/bin/env sh
# Commit gate: /clean-code and /refactor must be run against the exact staged diff.
# Usage: commit-gate.sh stamp   — record the current staged diff as reviewed
#        commit-gate.sh check   — verify (called by the pre-commit hook)
set -eu

GATE_FILE=".claude/.gate/commit-gate.ok"

staged_hash() { git diff --cached | git hash-object --stdin; }

case "${1:-check}" in
  stamp)
    mkdir -p "$(dirname "$GATE_FILE")"
    staged_hash > "$GATE_FILE"
    echo "commit gate stamped: $(cat "$GATE_FILE")"
    ;;
  check)
    if [ "${CLAUDE_GATE_SKIP:-0}" = "1" ]; then
      echo "commit gate: SKIPPED via CLAUDE_GATE_SKIP=1" >&2
      exit 0
    fi
    if [ ! -f "$GATE_FILE" ] || [ "$(cat "$GATE_FILE")" != "$(staged_hash)" ]; then
      echo "COMMIT BLOCKED: the staged diff has not passed the review gate." >&2
      echo "  1. Run /clean-code on the staged diff; apply fixes, re-stage." >&2
      echo "  2. Run /refactor on the staged diff; apply fixes, re-stage." >&2
      echo "  3. sh scripts/commit-gate.sh stamp" >&2
      echo "  (docs/config-only diffs may stamp directly; emergencies: CLAUDE_GATE_SKIP=1)" >&2
      exit 1
    fi
    ;;
  *)
    echo "usage: commit-gate.sh [stamp|check]" >&2
    exit 2
    ;;
esac

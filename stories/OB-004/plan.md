# Plan for OB-004

## Steps
- Specify story scope and constraints.
- Break into file/module changes with small commits.
- Implement minimal change set.
- Add adversarial/regression tests (fail-first).
- Verify and record evidence.

## Files
- stories/<id>/story.md
- stories/<id>/plan.md
- stories/<id>/context_pack.md

## Implementer Commands
- `pnpm install`
- `pnpm typecheck`

## Test Plan
- (none)

## Verifier Commands
- `pnpm build`

## Rollback
- Revert story diff and rerun verifier commands.

## Risks
- Verification can fail if dependency or build state drifts.
- Ralph loop may need retries if generated evidence commands fail.

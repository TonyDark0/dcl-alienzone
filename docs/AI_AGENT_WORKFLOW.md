# AI Agent Workflow

## Required context

Before editing, read `AGENTS.md`, `SCOPE.md`, `PROJECT_BRIEF.md`, `DECISIONS.md` and the relevant contract. Use the official Decentraland skill that matches the task.

## Work pattern

1. Inspect current files and runtime evidence.
2. State assumptions that affect product behavior.
3. Make the smallest coherent change.
4. Keep rules, networking and presentation separate.
5. Add or update deterministic tests.
6. Run format, typecheck, tests and SDK build.
7. Report changed behavior, verification and remaining asset dependencies.

## Code constraints

- Never let the client decide score, deadlines or card consumption.
- Do not add external backend dependencies.
- Do not modify the composite while Creator Hub is open.
- Preserve user-authored assets and unrelated changes.
- Use `apply_patch` for source/document edits.
- Keep all public UI, messages and documentation in English.
- Use DCL Alienzone and the `az_` asset convention.

## Art and media

AI can support concepting and audits. Production integration requires:

- Human review of silhouette and animation requirements.
- License and source record.
- Performance budget review.
- Export-path and naming validation.
- Native Explorer test.

## Parallel work

Use parallel agents only for independent research or QA. Never assign overlapping file edits. The primary agent remains responsible for reading project instructions and integrating results.

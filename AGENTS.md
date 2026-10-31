# Rules for agents and contributors

Before changing gameplay or assets, read in this order:

1. `docs/SCOPE.md`
2. `docs/PROJECT_BRIEF.md`
3. `docs/DECISIONS.md`
4. The contract related to the requested change.

## Skill usage

- Start with `.agents/skills/sdk-scenes/SKILL.md`.
- Then open only the official Decentraland skill relevant to the task: UI, multiplayer, optimization, animation, deployment, and so on.
- Static initial assets and entities belong in `assets/scene/main.composite`; do not duplicate them in TypeScript.
- Do not edit `main.composite` while Creator Hub is open.

## Binding constraints

- Keep the approved six-parcel 3×2 layout (48×32m), with the owner-revised 30×15m movement area centered at (16,16). Further parcel changes require confirmation.
- Do not download, replace or generate external assets without approval.
- The Decentraland `auth-server` multiplayer server is approved. Do not replace it with external infrastructure.
- VAT is outside the MVP. Use GLB skeletal clips and `Animator`.
- Do not deploy, publish a remote repository or submit transactions without an explicit request.
- Never invent the World DCL NAME. Request the exact name before the first deployment.
- Do not add cards, currencies, NFTs, progression or other out-of-scope features.
- Round coins are approved score pickups only: exactly 10 per round, +1 once per coin, no respawn, no wallet/shop currency.

## Minimum quality gate

Run before handing off code changes:

```bash
npm run format
npm run typecheck
npm run test
npm run build
```

Every new rule must be deterministic and should be tested as a pure function when possible. Keep presentation, rules and networking separate.

## AI-assisted operation

- Follow `docs/AI_AGENT_WORKFLOW.md` for research, art, SDK7, QA and agent use.
- Work in small, verifiable deliverables.
- Parallel agents are reserved for independent research, mapping and QA. They must not edit the same files concurrently.
- AI may propose or audit assets, but final integration requires license, performance and Explorer review.

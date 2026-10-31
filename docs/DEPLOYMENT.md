# Deployment

## Local validation

```bash
npm ci
npm run ci
```

Use the native Explorer preview for final camera, input, audio and multiplayer checks. Use `npm run start:multi` for multiple local clients.

## Public repository

Requested public remote: <https://github.com/TonyDark0/dcl-alienzone>.

GLBs, images and audio use **Git LFS**. Install it before cloning or staging art; GitHub Actions checks out LFS objects before running validation. Do not publish `node_modules`, `bin`, `tmp`, logs, `.env` files or local server state.

For a fresh clone:

```bash
git clone https://github.com/TonyDark0/dcl-alienzone.git
cd dcl-alienzone
git lfs install
git lfs pull
npm ci
npm run ci
```

Do not publish secrets, wallet keys, tokens, `.env` files or unlicensed assets.

## World deployment

The exact DCL NAME must be supplied by the owner. Never invent it.

1. Confirm the DCL NAME owner is signed into Creator Hub / CLI.
2. Verify `scene.json` metadata, thumbnail and the approved six-parcel 3×2 layout (48×32m). Verify the revised 30×15m gameplay area and camera are centered on the existing room at (16,16), with no mesh stretching or translation.
3. Run the approved World deployment flow.
4. Verify authoritative multiplayer, Scene Storage and leaderboard in the deployed World.
5. Test desktop and mobile deep links.
6. Record deployed version and rollback reference.

No external server or paid service is required.

After successful deployment, put the **actual verified visit link** in README and `design/gdd.md`. Repository publication does not deploy a World or submit the Creator Success application. Review [`design/STUDIO_READINESS.md`](../design/STUDIO_READINESS.md) before applying.

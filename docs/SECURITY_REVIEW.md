# Security review — 2026-10-31

This is a scoped configuration review, not a certification that either account is uncompromised. Account-level checks below remain with the owner, who chose to verify them in their own browser.

## Verified

- The local remote is `https://github.com/TonyDark0/dcl-alienzone.git`. Local `main` and GitHub matched `b03f90c` before the maintenance correction.
- The connected GitHub service reports administrator permission for `TonyDark0`. No additional commits or pending local changes were found at the beginning of this review.
- Active Git hooks contain the standard Git LFS commands. No custom hook path, local Git proxy or SSH-command override was found in the inspected local configuration.
- A targeted scan of project text did not find common GitHub token, AWS access-key or private-key-header patterns. This is not an exhaustive secret scan or an audit of ignored files, credentials or account sessions.
- Both the registered Decentraland launcher and installed Explorer executable have valid Authenticode signatures from Decentraland Foundation.
- `scene.json` contains the approved six parcels and authoritative multiplayer flag. Its owner field is empty and no World name is configured. These fields do not prove LAND ownership or deployment permissions; no remote DCL deployment was performed during this review.
- The blocked launch URL contained `debug=true`, which was added during local preview launch. The installed SDK's ordinary preview-link generator does not add it. Do not bypass the warning; use the normal preview link instead.
- Two local previews of the same project were identified on ports 8000 and 8001. Their logs recorded `DUPLICATE_IDENTITY`. Duplicate instances were stopped before preparing a single replacement.

## Findings and limits

- GitHub reports that `main` is not protected. The owner should consider requiring a successful CI check and pull-request review before changes reach `main`.
- The connector cannot inspect account sessions, security events, all collaborators, deploy keys, webhooks or account-wide app authorizations. The available browser was not signed in. Do not interpret the administrator-permission check as proof that no other access exists.
- The full installed development-tool audit reported 29 vulnerable dependency entries, including 3 critical entries. The production-only audit (`npm audit --omit=dev`) reported zero. Development tooling still matters: the vulnerable tree includes SDK/protobuf and test-runner dependencies. No forced dependency downgrade/major upgrade was applied; those changes require a separate compatibility-tested update. See the [protobufjs advisory](https://github.com/advisories/GHSA-h755-8qp9-cq85) and [Tinypool advisory](https://github.com/advisories/GHSA-85c8-ppgw-ccpr).
- The pinned SDK binds its preview HTTP service to `0.0.0.0` by default. This review's replacement preview explicitly sets `HTTP_SERVER_HOST=127.0.0.1`, restricting the listener to loopback. No firewall exemption, port forwarding or public tunnel was added. Future previews should use the same setting and be closed when finished.
- Without the actual deployed World name or LAND location and its authorized owner session, remote DCL deployment history and delegated permissions cannot be verified.

## Owner checklist

1. In the repository's Settings, review Collaborators, Deploy keys and Webhooks for unknown entries. Review branch protection/rulesets without granting anyone new access.
2. In personal GitHub settings, review Password and authentication, active Sessions, Security log, SSH keys and authorized OAuth/GitHub Apps. Do not send passwords, recovery codes or tokens into chat.
3. In the owner's Decentraland dashboard/Builder, inspect the actual World/LAND collaborators and latest deployment. Verify the wallet/account is the expected owner. A local `0,0` preview is not proof of a remote deployment.
4. Report any unfamiliar access before revoking or rotating it so its scope and recovery path can be established. Never sign a wallet transaction solely to dismiss a local launch warning.

# Security

Do not publish exploitable vulnerabilities in a public issue. Contact the maintainers privately after the public repository defines its security channel.

## Dependencies

The project pins dependency versions and commits `package-lock.json`. Run `npm audit` before releases.

Transitive advisories inherited from `@dcl/sdk-commands` must not be addressed with `npm audit fix --force` or an automatic SDK downgrade because either can break the official toolchain. Compare them against the latest supported Decentraland release and update only through a compatible path. Fix direct project vulnerabilities before release.

## Secrets

- Never commit private keys, seed phrases, tokens or `.env` files.
- Playing the game never requires a signature or payment.
- World deployment is performed interactively by the DCL NAME owner.

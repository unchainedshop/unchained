---
name: upgrade-unchained
description: Guides upgrading Unchained Engine to a new major version. Use when the user wants to upgrade their Unchained project, mentions updating @unchainedshop packages, or asks about migration.
---

# Upgrade Unchained Engine

## Instructions

1. Enter planning mode to create an upgrade plan
2. Get available versions with `npm view @unchainedshop/platform versions --json`
3. Show the user which versions they can upgrade to
4. Once a target version is selected (e.g., `4.5.0`), fetch these resources:
   - Migration guide: `https://raw.githubusercontent.com/unchainedshop/unchained/refs/tags/v{version}/MIGRATION.md`
   - Changelog: `https://raw.githubusercontent.com/unchainedshop/unchained/refs/tags/v{version}/CHANGELOG.md`
   - README: `https://raw.githubusercontent.com/unchainedshop/unchained/refs/heads/master/README.md`
5. Execute the upgrade by:
   - Updating npm dependencies
   - Removing deprecated dependencies
   - Running lint, tests, and build
   - Starting the project to verify

## Reference Examples

Fetch example boot files for the target version to understand current patterns:

| Framework | Example URL |
|-----------|-------------|
| Express | `https://raw.githubusercontent.com/unchainedshop/unchained/refs/tags/v{version}/examples/kitchensink-express/src/boot.ts` |
| Fastify | `https://raw.githubusercontent.com/unchainedshop/unchained/refs/tags/v{version}/examples/kitchensink/src/boot.ts` |
| Minimal | `https://raw.githubusercontent.com/unchainedshop/unchained/refs/tags/v{version}/examples/minimal/src/boot.ts` |
| Ticketing | `https://raw.githubusercontent.com/unchainedshop/unchained/refs/tags/v{version}/examples/ticketing/src/boot.ts` |
| OIDC | `https://raw.githubusercontent.com/unchainedshop/unchained/refs/tags/v{version}/examples/oidc/src/boot.ts` |

## Additional Resources

- Documentation: https://docs.unchained.shop

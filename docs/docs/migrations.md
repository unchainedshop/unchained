---
sidebar_position: 10
title: Migrations
sidebar_label: Migrations
description: Upgrading between major versions of Unchained Engine
---

# Migration Guide

All migration instructions are consolidated in a single file:

**[MIGRATION.md](https://github.com/unchainedshop/unchained/blob/master/MIGRATION.md)**

Covers: v2 → v3, v3 → v4, and v4 → v5.

## v4 → v5 highlights

The full details (with before/after snippets) are in [MIGRATION.md](https://github.com/unchainedshop/unchained/blob/master/MIGRATION.md#v4--v5-breaking-changes). The breaking changes most likely to affect your code:

- **Plugin registration.** `Director.registerAdapter()` is removed. Register built-ins via the [presets](./platform-configuration/plugin-presets.md) (`registerAllPlugins()`), author custom adapters with the [`registerX()` factories](./extend/plugin-factories.md), or use `pluginRegistry.register()` with a hand-built `IPlugin`.
- **Leveled pricing.** Catalog price tiers are keyed by `minQuantity` (lower bound; base `= 0`) instead of `maxQuantity`. An automatic, idempotent startup migration converts existing data — but update any code that *writes* prices to use `minQuantity`. See [Leveled Pricing](./concepts/pricing-system.md#leveled-quantity-tier-catalog-pricing).
- **Events.** Redis / EventBridge transports must be registered explicitly with `setEmitAdapter(RedisEventEmitter())` (no more auto-registration on import).
- **Auth, admin-ui, dependencies.** Stateless JWT auth (set `UNCHAINED_TOKEN_SECRET`), runtime admin-ui permissions, and several dependency bumps — see the full guide.

## General Upgrade Process

1. **Read the migration guide** for your target version
2. **Update dependencies** in `package.json`
3. **Start the platform** - database migrations run automatically on startup
4. **Update code** for any breaking API changes
5. **Test thoroughly** before deploying to production

## Getting Help

- [GitHub Discussions](https://github.com/unchainedshop/unchained/discussions)
- [GitHub Issues](https://github.com/unchainedshop/unchained/issues)
- [support@unchained.shop](mailto:support@unchained.shop) for enterprise support

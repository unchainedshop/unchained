---
sidebar_position: 10
title: Migrations
sidebar_label: Migrations
description: Upgrading between major versions of Unchained Engine
---

# Migration Guides

When upgrading between major versions of Unchained Engine, consult the appropriate migration guide for breaking changes and upgrade instructions.

## Available Guides

| Version | Guide |
|---------|-------|
| **v3 → v4** | [MIGRATION-V4.md](https://github.com/unchainedshop/unchained/blob/master/MIGRATION-V4.md) |
| **v2 → v3** | [MIGRATION-V3.md](https://github.com/unchainedshop/unchained/blob/master/MIGRATION-V3.md) |
| **v1 → v2** | [MIGRATION-V2.md](https://github.com/unchainedshop/unchained/blob/master/MIGRATION-V2.md) |

## General Upgrade Process

1. **Read the migration guide** for your target version
2. **Update dependencies** in `package.json`
3. **Start the platform** - database migrations run automatically on startup
4. **Update code** for any breaking API changes
5. **Test thoroughly** before deploying to production

## Getting Help

If you encounter issues during migration:

- Check [GitHub Discussions](https://github.com/unchainedshop/unchained/discussions)
- Review [GitHub Issues](https://github.com/unchainedshop/unchained/issues)
- Contact [support@unchained.shop](mailto:support@unchained.shop) for enterprise support

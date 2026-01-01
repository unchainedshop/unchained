---
sidebar_position: 10
title: Migrations
sidebar_label: Migrations
description: Upgrading between major versions of Unchained Engine
---

# Migration Guide

All migration instructions are consolidated in a single file:

**[MIGRATION.md](https://github.com/unchainedshop/unchained/blob/master/MIGRATION.md)**

Covers: v2 → v3, v3 → v4, and v4 → v5

## v5.0 - Drizzle Migration

Version 5.0 is a **major architectural change** that replaces MongoDB with Drizzle ORM and SQLite/Turso. This requires:

1. **Database migration** - Export data from MongoDB and import to SQLite/Turso
2. **Environment changes** - Replace `MONGO_URL` with `DRIZZLE_DB_URL`
3. **Code updates** - Update custom modules to use Drizzle patterns

See the [MIGRATION.md](https://github.com/unchainedshop/unchained/blob/master/MIGRATION.md) file for detailed upgrade instructions.

## General Upgrade Process

1. **Read the migration guide** for your target version
2. **Update dependencies** in `package.json`
3. **Start the platform** - schemas are initialized automatically on startup
4. **Update code** for any breaking API changes
5. **Test thoroughly** before deploying to production

## Getting Help

- [GitHub Discussions](https://github.com/unchainedshop/unchained/discussions)
- [GitHub Issues](https://github.com/unchainedshop/unchained/issues)
- [support@unchained.shop](mailto:support@unchained.shop) for enterprise support

---
sidebar_position: 16
title: Languages Module
sidebar_label: Languages
description: Language configuration and management
---

# Languages Module

The languages module manages supported languages for multi-language content.

## Configuration Options

The languages module has no configuration options.

## Module API

Access via `modules.languages` in the Unchained API context.

### Queries

| Method | Arguments | Description |
|--------|-----------|-------------|
| `findLanguage` | `{ languageId? \| isoCode? }` | Find language by ID or ISO code |
| `findLanguages` | `{ limit?, offset?, sort?, ...query }` | List languages with pagination |
| `count` | `query` | Count languages matching criteria |
| `languageExists` | `{ languageId }` | Check if language exists |
| `isBase` | `language` | Check if this is the default language |

### Mutations

| Method | Arguments | Description |
|--------|-----------|-------------|
| `create` | `doc` | Create a new language |
| `update` | `languageId, doc` | Update language |
| `delete` | `languageId` | Delete language |

### Usage

```typescript
// Find a language
const german = await modules.languages.findLanguage({ isoCode: 'de' });

// Check if it's the base language
const isDefault = modules.languages.isBase(german);

// List all active languages
const languages = await modules.languages.findLanguages({
  includeInactive: false,
});
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `LANGUAGE_CREATE` | `{ languageId }` | Emitted when a language is created |
| `LANGUAGE_UPDATE` | `{ languageId }` | Emitted when a language is updated |
| `LANGUAGE_REMOVE` | `{ languageId }` | Emitted when a language is removed |

## Related

- [Multi-Language Setup](../../guides/multi-language-setup.md) - Multi-language guide
- [Seed Data](../../guides/seed-data.md) - Bootstrap languages

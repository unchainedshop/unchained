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

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `LANGUAGE_CREATE` | `{ languageId }` | Emitted when a language is created |
| `LANGUAGE_UPDATE` | `{ languageId }` | Emitted when a language is updated |
| `LANGUAGE_REMOVE` | `{ languageId }` | Emitted when a language is removed |

## More Information

For API usage and detailed documentation, see the [core-languages package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-languages).

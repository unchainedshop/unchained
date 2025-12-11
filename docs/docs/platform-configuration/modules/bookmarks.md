---
sidebar_position: 11
title: Bookmarks Module
sidebar_label: Bookmarks
description: User favorites and wishlist functionality
---

# Bookmarks Module

The bookmarks module allows users to save products for later reference, implementing wishlist functionality.

## Configuration Options

The bookmarks module has no configuration options.

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `BOOKMARK_CREATE` | `{ bookmarkId }` | Emitted when a bookmark is created |
| `BOOKMARK_UPDATE` | `{ bookmarkId }` | Emitted when a bookmark is updated |
| `BOOKMARK_REMOVE` | `{ bookmarkId }` | Emitted when a bookmark is removed |

## More Information

For API usage and detailed documentation, see the [core-bookmarks package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-bookmarks).

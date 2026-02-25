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

## Module API

Access via `modules.bookmarks` in the Unchained API context.

### Queries

| Method | Arguments | Description |
|--------|-----------|-------------|
| `findBookmarkById` | `bookmarkId` | Find a specific bookmark |
| `findBookmarksByUserId` | `userId` | Get all bookmarks for a user |
| `findBookmarks` | `query` | Find bookmarks by custom filter |

### Mutations

| Method | Arguments | Description |
|--------|-----------|-------------|
| `create` | `doc` | Create a new bookmark |
| `update` | `bookmarkId, doc` | Update bookmark |
| `delete` | `bookmarkId` | Delete bookmark |
| `deleteByUserId` | `userId` | Delete all bookmarks for a user |
| `deleteByProductId` | `productId` | Delete all bookmarks for a product |
| `replaceUserId` | `fromUserId, toUserId, bookmarkIds?` | Migrate bookmarks between users (used during guest-to-registered conversion) |

### Usage

```typescript
// Create a bookmark
await modules.bookmarks.create({
  userId: 'user-123',
  productId: 'product-456',
});

// Get user's wishlist
const wishlist = await modules.bookmarks.findBookmarksByUserId('user-123');

// Migrate bookmarks when guest converts to registered user
await modules.bookmarks.replaceUserId('guest-id', 'registered-id');
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `BOOKMARK_CREATE` | `{ bookmarkId }` | Emitted when a bookmark is created |
| `BOOKMARK_UPDATE` | `{ bookmarkId }` | Emitted when a bookmark is updated |
| `BOOKMARK_REMOVE` | `{ bookmarkId }` | Emitted when a bookmark is removed |

## Related

- [Authentication](../../concepts/authentication.md) - Guest-to-registered conversion

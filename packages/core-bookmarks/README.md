[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-bookmarks.svg)](https://npmjs.com/package/@unchainedshop/core-bookmarks)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-bookmarks

Bookmark management module for the Unchained Engine. Allows users to bookmark products for later reference.

## Installation

```bash
npm install @unchainedshop/core-bookmarks
```

## Usage

```typescript
import { configureBookmarksModule } from '@unchainedshop/core-bookmarks';

const bookmarksModule = await configureBookmarksModule({ db });

// Create a bookmark
const bookmarkId = await bookmarksModule.create({
  userId: 'user-123',
  productId: 'product-456',
});

// Find bookmarks by user
const bookmarks = await bookmarksModule.findBookmarksByUserId('user-123');
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureBookmarksModule` | Configure and return the bookmarks module |

### Queries

| Method | Description |
|--------|-------------|
| `findBookmarkById` | Find a bookmark by its ID |
| `findBookmarksByUserId` | Find all bookmarks for a user |
| `findBookmarks` | Find bookmarks with custom query |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new bookmark |
| `update` | Update an existing bookmark |
| `delete` | Delete a bookmark |
| `deleteByUserId` | Delete all bookmarks for a user |
| `deleteByProductId` | Delete all bookmarks for a product |
| `replaceUserId` | Transfer bookmarks between users |

### Types

| Export | Description |
|--------|-------------|
| `Bookmark` | Bookmark document type |
| `BookmarksModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `BOOKMARK_CREATE` | Emitted when a bookmark is created |
| `BOOKMARK_UPDATE` | Emitted when a bookmark is updated |
| `BOOKMARK_REMOVE` | Emitted when a bookmark is removed |

## License

EUPL-1.2

[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-bookmarks.svg)](https://npmjs.com/package/@unchainedshop/core-bookmarks)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-bookmarks

Bookmark management module for the Unchained Engine. Allows users to bookmark products for later reference.

## Installation

```bash
npm install @unchainedshop/core-bookmarks
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.bookmarks`.

```typescript
const { bookmarks } = platform.unchainedAPI.modules;

const bookmarkId = await bookmarks.create({
  userId: 'user-123',
  productId: 'product-456',
});
const bookmark = await bookmarks.findBookmarkById(bookmarkId);
const wishlist = await bookmarks.findBookmarksByUserId('user-123');
```

`create` returns the bookmark ID. `replaceUserId` supports transferring bookmarks during guest-to-user conversion.

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/bookmarks), [public exports](src/bookmarks-index.ts), and [module implementation](src/module/configureBookmarksModule.ts) for the API and events.

## License

EUPL-1.2

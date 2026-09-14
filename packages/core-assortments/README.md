[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-assortments.svg)](https://npmjs.com/package/@unchainedshop/core-assortments)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-assortments

Assortment (category) management module for the Unchained Engine. Handles product categorization with hierarchical structures, media, filters, and localized texts.

## Installation

```bash
npm install @unchainedshop/core-assortments
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.assortments`. For startup and options, see [Platform Configuration](https://docs.unchained.shop/platform-configuration/).

```typescript
const { assortments } = platform.unchainedAPI.modules;

const assortment = await assortments.create({
  isRoot: true,
  isActive: true,
  sequence: 10,
  tags: [],
});
await assortments.products.create({
  assortmentId: assortment._id,
  productId: 'product-123',
});
const roots = await assortments.findAssortments({ includeLeaves: false, includeInactive: false });
```

Product links, child links, media, texts, and filters live in the `products`, `links`, `media`, `texts`, and `filters` submodules. Creation returns the assortment document; use its `_id` when linking products.

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/assortments) for caching, tree ordering, options, and events. The [public exports](src/assortments-index.ts) and [module implementation](src/module/configureAssortmentsModule.ts) define the available types and methods.

## License

EUPL-1.2

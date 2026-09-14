[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-products.svg)](https://npmjs.com/package/@unchainedshop/core-products)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-products

Product management module for the Unchained Engine. Handles products, pricing, media, reviews, texts, and variations.

## Installation

```bash
npm install @unchainedshop/core-products
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.products`.

```typescript
import { ProductType } from '@unchainedshop/core-products';

const { products } = platform.unchainedAPI.modules;
const product = await products.create({
  type: ProductType.SIMPLE_PRODUCT,
  tags: ['featured'],
});
await products.publish(product);
const publishedProducts = await products.findProducts({
  tags: ['featured'],
  includeDrafts: false,
});
```

`create` returns the product document, and `publish` accepts that document. The module exposes `media`, `prices`, `reviews`, `texts`, `variations`, `assignments`, and `bundleItems` submodules. Catalog prices are written as `commerce.pricing` entries with `minQuantity` tiers; computed pricing is coordinated by the core pricing services and plugins.

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/products), [pricing guide](https://docs.unchained.shop/concepts/pricing-system), [public exports](src/products-index.ts), and [module implementation](src/module/configureProductsModule.ts).

## License

EUPL-1.2

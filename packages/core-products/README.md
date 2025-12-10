[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-products.svg)](https://npmjs.com/package/@unchainedshop/core-products)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-products

Product management module for the Unchained Engine. Handles products, pricing, media, reviews, texts, and variations.

## Installation

```bash
npm install @unchainedshop/core-products
```

## Usage

```typescript
import { configureProductsModule, ProductType } from '@unchainedshop/core-products';

const productsModule = await configureProductsModule({ db });

// Create a product
const productId = await productsModule.create({
  type: ProductType.SimpleProduct,
  slugs: ['my-product'],
});

// Find products
const products = await productsModule.findProducts({
  tags: ['featured'],
  includeDrafts: false,
});

// Publish a product
await productsModule.publish(productId);
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureProductsModule` | Configure and return the products module |

### Queries

| Method | Description |
|--------|-------------|
| `findProduct` | Find product by ID or slug |
| `findProducts` | Find products with filtering and pagination |
| `count` | Count products matching query |
| `productExists` | Check if product exists |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new product |
| `update` | Update product data |
| `delete` | Soft delete a product |
| `publish` | Publish a draft product |
| `unpublish` | Unpublish a product |
| `addAssignment` | Add product proxy assignment |
| `removeAssignment` | Remove product assignment |

### Submodules

#### Media (`products.media`)
| Method | Description |
|--------|-------------|
| `findProductMedia` | Find media for a product |
| `createMedia` | Add media to product |
| `updateMedia` | Update media metadata |
| `deleteMedia` | Remove media from product |
| `reorderMedia` | Reorder product media |

#### Prices (`products.prices`)
| Method | Description |
|--------|-------------|
| `findProductPrices` | Get product prices |
| `createPrice` | Add a price |
| `updatePrice` | Update a price |
| `deletePrice` | Remove a price |

#### Reviews (`products.reviews`)
| Method | Description |
|--------|-------------|
| `findProductReviews` | Find reviews for product |
| `createReview` | Add a review |
| `updateReview` | Update a review |
| `deleteReview` | Remove a review |

#### Texts (`products.texts`)
| Method | Description |
|--------|-------------|
| `findProductTexts` | Find localized texts |
| `updateTexts` | Update product texts |

#### Variations (`products.variations`)
| Method | Description |
|--------|-------------|
| `findProductVariations` | Find product variations |
| `createVariation` | Add a variation |
| `updateVariation` | Update a variation |
| `deleteVariation` | Remove a variation |

### Constants

| Export | Description |
|--------|-------------|
| `ProductType` | Product types (SimpleProduct, ConfigurableProduct, BundleProduct, PlanProduct, TokenizedProduct) |
| `ProductStatus` | Product status values (ACTIVE, DRAFT) |

### Types

| Export | Description |
|--------|-------------|
| `Product` | Product document type |
| `ProductQuery` | Query parameters type |
| `ProductsModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `PRODUCT_CREATE` | Product created |
| `PRODUCT_UPDATE` | Product updated |
| `PRODUCT_REMOVE` | Product deleted |
| `PRODUCT_PUBLISH` | Product published |
| `PRODUCT_UNPUBLISH` | Product unpublished |

## License

EUPL-1.2

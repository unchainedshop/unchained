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

const productsModule = await configureProductsModule({ db, migrationRepository });

// Create a product
const product = await productsModule.create({
  type: ProductType.SIMPLE_PRODUCT,
  tags: [],
});

// Find products
const products = await productsModule.findProducts({
  tags: ['featured'],
  includeDrafts: false,
});

// Publish a product
await productsModule.publish(product);
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
| `assignments.addProxyAssignment` | Add product proxy assignment |
| `assignments.removeAssignment` | Remove product assignment |

### Submodules

#### Media (`products.media`)

| Method | Description |
|--------|-------------|
| `findProductMedias` | Find media for a product |
| `create` | Add media to product |
| `update` | Update media metadata |
| `delete` | Remove media from product |
| `updateManualOrder` | Reorder product media |

#### Prices (`products.prices`)

| Method | Description |
|--------|-------------|
| `catalogPrices` | Get catalog prices for a product |
| `price` | Resolve a catalog price for a pricing context |
| `catalogPriceRange` | Get the catalog price range |

Update stored catalog prices through `products.update(productId, { "commerce.pricing": prices })`.

#### Reviews (`products.reviews`)

| Method | Description |
|--------|-------------|
| `findProductReviews` | Find reviews for product |
| `create` | Add a review |
| `update` | Update a review |
| `delete` | Remove a review |

#### Texts (`products.texts`)

| Method | Description |
|--------|-------------|
| `findTexts` | Find localized texts |
| `updateTexts` | Update product texts |

#### Variations (`products.variations`)

| Method | Description |
|--------|-------------|
| `findProductVariations` | Find product variations |
| `create` | Add a variation |
| `update` | Update a variation |
| `delete` | Remove a variation |

### Constants

| Export | Description |
|--------|-------------|
| `ProductType` | Product types (SIMPLE_PRODUCT, CONFIGURABLE_PRODUCT, BUNDLE_PRODUCT, PLAN_PRODUCT, TOKENIZED_PRODUCT) |
| `ProductStatus` | Product status values (ACTIVE, DRAFT, DELETED) |

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

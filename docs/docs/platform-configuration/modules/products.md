---
sidebar_position: 2
title: Products Module
sidebar_label: Products
description: Product catalog management and configuration
---

# Products Module

The products module manages the product catalog including simple products, bundles, configurable products, and subscription plans.

## Configuration Options

```typescript
export interface ProductsSettingsOptions {
  slugify: (title: string) => string;
}
```

### Default Slugifier

- [slugify](https://github.com/unchainedshop/unchained/blob/master/packages/utils/src/slugify.ts)

### Custom Slugify

```typescript
import slugify from 'slugify';
const options = {
  modules: {
    products: {
      slugify,
    },
  },
};
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `PRODUCT_CREATE` | `{ product }` | Emitted when a product is created |
| `PRODUCT_UPDATE` | `{ product }` | Emitted when a product is updated |
| `PRODUCT_REMOVE` | `{ productId }` | Emitted when a product is removed |
| `PRODUCT_PUBLISH` | `{ product }` | Emitted when a product is published |
| `PRODUCT_UNPUBLISH` | `{ product }` | Emitted when a product is unpublished |
| `PRODUCT_UPDATE_TEXT` | `{ productId, locale }` | Emitted when product text is updated |
| `PRODUCT_ADD_MEDIA` | `{ productMedia }` | Emitted when media is added |
| `PRODUCT_REMOVE_MEDIA` | `{ productMediaId }` | Emitted when media is removed |
| `PRODUCT_REORDER_MEDIA` | `{ productMedias }` | Emitted when media is reordered |
| `PRODUCT_UPDATE_MEDIA_TEXT` | `{ productMediaId }` | Emitted when media text is updated |
| `PRODUCT_CREATE_VARIATION` | `{ productVariation }` | Emitted when a variation is created |
| `PRODUCT_REMOVE_VARIATION` | `{ productVariationId }` | Emitted when a variation is removed |
| `PRODUCT_UPDATE_VARIATION_TEXT` | `{ productVariationId }` | Emitted when variation text is updated |
| `PRODUCT_VARIATION_OPTION_CREATE` | `{ productVariation, value }` | Emitted when a variation option is added |
| `PRODUCT_REMOVE_VARIATION_OPTION` | `{ productVariationId, value }` | Emitted when a variation option is removed |
| `PRODUCT_REVIEW_CREATE` | `{ productReview }` | Emitted when a review is created |
| `PRODUCT_UPDATE_REVIEW` | `{ productReview }` | Emitted when a review is updated |
| `PRODUCT_REMOVE_REVIEW` | `{ productReviewId }` | Emitted when a review is removed |
| `PRODUCT_REVIEW_ADD_VOTE` | `{ productReviewId, type }` | Emitted when a vote is added to a review |
| `PRODUCT_REMOVE_REVIEW_VOTE` | `{ productReviewId, type }` | Emitted when a vote is removed from a review |

## More Information

For API usage and detailed documentation, see the [core-products package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-products).

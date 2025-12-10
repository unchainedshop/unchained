[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-assortments.svg)](https://npmjs.com/package/@unchainedshop/core-assortments)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-assortments

Assortment (category) management module for the Unchained Engine. Handles product categorization with hierarchical structures, media, filters, and localized texts.

## Installation

```bash
npm install @unchainedshop/core-assortments
```

## Usage

```typescript
import { configureAssortmentsModule } from '@unchainedshop/core-assortments';

const assortmentsModule = await configureAssortmentsModule({ db });

// Create an assortment
const assortmentId = await assortmentsModule.create({
  slugs: ['electronics'],
  isRoot: true,
});

// Find assortments
const assortments = await assortmentsModule.findAssortments({
  includeInactive: false,
});

// Add product to assortment
await assortmentsModule.products.create({
  assortmentId,
  productId: 'product-123',
});
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureAssortmentsModule` | Configure and return the assortments module |

### Queries

| Method | Description |
|--------|-------------|
| `findAssortment` | Find assortment by ID or slug |
| `findAssortments` | Find assortments with filtering and pagination |
| `count` | Count assortments matching query |
| `assortmentExists` | Check if assortment exists |
| `findProductIds` | Get all product IDs in an assortment tree |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new assortment |
| `update` | Update assortment data |
| `delete` | Soft delete an assortment |
| `setBase` | Set base assortment |
| `invalidateCache` | Clear assortment cache |

### Submodules

#### Products (`assortments.products`)
| Method | Description |
|--------|-------------|
| `findProducts` | Find products in assortment |
| `create` | Add product to assortment |
| `delete` | Remove product from assortment |
| `reorder` | Reorder products |

#### Links (`assortments.links`)
| Method | Description |
|--------|-------------|
| `findLinks` | Find assortment links (parent-child) |
| `create` | Create link between assortments |
| `delete` | Remove link |
| `reorder` | Reorder child assortments |

#### Media (`assortments.media`)
| Method | Description |
|--------|-------------|
| `findMedia` | Find assortment media |
| `create` | Add media to assortment |
| `delete` | Remove media |
| `reorder` | Reorder media |

#### Texts (`assortments.texts`)
| Method | Description |
|--------|-------------|
| `findTexts` | Find localized texts |
| `updateTexts` | Update assortment texts |

#### Filters (`assortments.filters`)
| Method | Description |
|--------|-------------|
| `findFilters` | Find filters for assortment |
| `create` | Add filter to assortment |
| `delete` | Remove filter |
| `reorder` | Reorder filters |

### Settings

| Export | Description |
|--------|-------------|
| `assortmentsSettings` | Access assortment module settings |

### Types

| Export | Description |
|--------|-------------|
| `Assortment` | Assortment document type |
| `AssortmentProduct` | Assortment-product link type |
| `AssortmentLink` | Parent-child link type |
| `AssortmentMedia` | Media attachment type |
| `AssortmentsModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `ASSORTMENT_CREATE` | Assortment created |
| `ASSORTMENT_UPDATE` | Assortment updated |
| `ASSORTMENT_REMOVE` | Assortment deleted |

## License

EUPL-1.2

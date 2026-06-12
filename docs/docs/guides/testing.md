---
sidebar_position: 12
title: Testing
sidebar_label: Testing
description: How to test custom plugins, modules, and integrations
---

# Testing

Unchained Engine uses Node.js built-in test runner for both unit and integration tests. This guide covers how to test custom plugins, modules, and integrations.

## Running Tests

### All Tests

```bash
npm run test
```

### Unit Tests Only

```bash
npm run test:run:unit
```

### Integration Tests

```bash
npm run test:run:integration
```

### Single Test File

```bash
# Unit test
node --test path/to/test.ts

# Integration test (from monorepo root)
node --no-warnings \
  --env-file .env.tests \
  --env-file-if-exists=.env \
  --test-isolation=none \
  --test-force-exit \
  --test-global-setup=tests/helpers.js \
  --test \
  --test-concurrency=1 \
  path/to/test.ts
```

## Unit Testing

Unit tests validate the behavior callbacks passed to the registration factories. Keep domain logic in named functions, register those functions in boot code, and test them without initializing the global plugin registry.

### Testing a Custom Plugin

```typescript
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

export const charge = async (configuration, context) => {
  const result = await gateway.charge(context.order);
  return { transactionId: result.id };
};

// Boot code:
// registerPaymentProvider({ adapterId: 'custom', type: 'GENERIC', charge });

describe('custom payment charge', () => {
  it('returns the gateway transaction id', async () => {
    gateway.charge = async () => ({ id: 'tx-1' });
    const result = await charge([], { order: { _id: 'order-1' } });
    assert.deepEqual(result, { transactionId: 'tx-1' });
  });
});
```

### Testing a Pricing Plugin

```typescript
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

export const calculateMemberPrice = async (sheet, context) => {
  if (context.product.tags?.includes('member-price')) {
    sheet.addItem({ amount: -100, isTaxable: true, isNetPrice: true });
  }
};

// Boot code:
// registerProductPricing({ adapterId: 'member-price', calculate: calculateMemberPrice });

describe('member pricing', () => {
  it('adds the member discount row', async () => {
    const rows = [];
    const sheet = { addItem: (row) => rows.push(row) };
    await calculateMemberPrice(sheet, { product: { tags: ['member-price'] } });
    assert.equal(rows[0].amount, -100);
  });
});
```

## Integration Testing

Integration tests run against a live Unchained instance with MongoDB.

### Test Setup

Integration tests use the kitchensink example as the test harness. The global setup in `tests/helpers.js` bootstraps the platform.

### Environment

Create a `.env.tests` file:

```bash
MONGO_URL=mongodb://localhost:27017/unchained-tests
UNCHAINED_TOKEN_SECRET=test-secret-minimum-32-characters-long
```

### Writing an Integration Test

```typescript
import { describe, it, assert } from 'node:test';

describe('Order Checkout Flow', () => {
  let graphqlFetch;

  // Use the admin client from test helpers
  it('should create and checkout an order', async () => {
    // Create a product
    const { data: { createProduct } } = await graphqlFetch({
      query: `
        mutation {
          createProduct(
            product: { type: SIMPLE_PRODUCT, title: "Test Product" }
          ) {
            _id
          }
        }
      `,
    });

    // Add to cart
    const { data: { addCartProduct } } = await graphqlFetch({
      query: `
        mutation AddToCart($productId: ID!) {
          addCartProduct(productId: $productId, quantity: 1) {
            _id
          }
        }
      `,
      variables: { productId: createProduct._id },
    });

    assert.ok(addCartProduct._id);
  });
});
```

### GraphQL Test Client

The test helpers provide authenticated GraphQL clients:

```typescript
import { setupDatabase, createLoggedInGraphqlFetch } from './helpers.js';

const adminGraphqlFetch = await createLoggedInGraphqlFetch({
  email: 'admin@unchained.local',
  password: 'password',
});

// Use for admin operations
const result = await adminGraphqlFetch({
  query: '{ users { _id } }',
});
```

## Testing Custom Modules

```typescript
import { describe, it, assert } from 'node:test';
import { startPlatform } from '@unchainedshop/platform';

describe('Custom Module', () => {
  let unchainedAPI;

  it('should initialize', async () => {
    const platform = await startPlatform({
      modules: {
        customModule: {
          configure: async ({ db }) => ({
            findItems: async () => [],
            createItem: async (data) => ({ _id: 'new', ...data }),
          }),
        },
      },
    });
    unchainedAPI = platform.unchainedAPI;
    assert.ok(unchainedAPI.modules.customModule);
  });

  it('should create items', async () => {
    const item = await unchainedAPI.modules.customModule.createItem({
      name: 'Test',
    });
    assert.equal(item.name, 'Test');
  });
});
```

## Best Practices

1. **Use `.env.tests`** for test-specific configuration to avoid affecting development data
2. **Run with `--test-concurrency=1`** for integration tests to avoid race conditions
3. **Clean up test data** after each test suite to keep tests independent
4. **Test adapters in isolation** before integration testing with the full platform
5. **Use `--test-isolation=none`** for integration tests that share platform state

## Related

- [Custom Modules](../extend/custom-modules.md) - Build custom modules
- [Director/Adapter Pattern](../concepts/director-adapter-pattern.md) - Plugin architecture
- [Worker](../extend/worker.md) - Custom workers

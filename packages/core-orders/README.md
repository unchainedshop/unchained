[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-orders.svg)](https://npmjs.com/package/@unchainedshop/core-orders)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-orders

Order management module for the Unchained Engine. Handles the complete order lifecycle including positions, payments, deliveries, and discounts.

## Installation

```bash
npm install @unchainedshop/core-orders
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.orders`.

```typescript
const { orders } = platform.unchainedAPI.modules;

const order = await orders.findOrder({ orderId: 'order-123' });
const userOrders = await orders.findOrders({ userId: 'user-123', limit: 20 });
```

Order positions, payments, deliveries, discounts, and statistics are exposed through the corresponding submodules. Use `unchainedAPI.services.orders` or the GraphQL API for cart operations and checkout so pricing, validation, payment, and delivery are coordinated.

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/orders), [checkout guide](https://docs.unchained.shop/guides/checkout-implementation), [public exports](src/orders-index.ts), and [module implementation](src/module/configureOrdersModule.ts).

## License

EUPL-1.2

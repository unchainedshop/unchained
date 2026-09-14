[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-orders.svg)](https://npmjs.com/package/@unchainedshop/core-orders)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-orders

Order management module for the Unchained Engine. Handles the complete order lifecycle including positions, payments, deliveries, and discounts.

## Installation

```bash
npm install @unchainedshop/core-orders
```

## Usage

```typescript
import { configureOrdersModule } from '@unchainedshop/core-orders';

const ordersModule = await configureOrdersModule({ db, migrationRepository });

// Create an order
const order = await ordersModule.create({
  userId: 'user-123',
  currencyCode: 'CHF',
  countryCode: 'CH',
});

// Add position to order
await ordersModule.positions.addProductItem({
  orderId: order._id,
  originalProductId: 'product-456',
  productId: 'product-456',
  quantity: 2,
});

// Read the resulting positions
const positions = await ordersModule.positions.findOrderPositions({ orderId: order._id });
```

Checkout, confirmation, payment charging, and delivery dispatch are orchestrated by the services and directors in [`@unchainedshop/core`](../core/README.md). This module provides persistence and status updates.

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configureOrdersModule` | Configure and return the orders module |

### Queries

| Method | Description |
|--------|-------------|
| `findOrder` | Find order by ID or number |
| `findOrders` | Find orders with filtering and pagination |
| `count` | Count orders matching query |
| `orderExists` | Check if order exists |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new order |
| `updateCartFields` | Update cart fields |
| `delete` | Delete an order |
| `updateStatus` | Update order status and emit lifecycle events |
| `setPaymentProvider` | Set payment provider |
| `setDeliveryProvider` | Set delivery provider |

### Submodules

#### Positions (`orders.positions`)

| Method | Description |
|--------|-------------|
| `findOrderPositions` | Find order positions |
| `addProductItem` | Add a product position to an order |
| `updateProductItem` | Update a product position |
| `delete` | Remove position |

#### Payments (`orders.payments`)

| Method | Description |
|--------|-------------|
| `findOrderPayment` | Find order payment |
| `create` | Create payment for order |
| `markAsPaid` | Mark payment as paid |

#### Deliveries (`orders.deliveries`)

| Method | Description |
|--------|-------------|
| `findDelivery` | Find order delivery |
| `create` | Create delivery for order |
| `markAsDelivered` | Mark as delivered |

#### Discounts (`orders.discounts`)

| Method | Description |
|--------|-------------|
| `findOrderDiscounts` | Find order discounts |
| `create` | Add discount to order |
| `delete` | Remove discount |

### Constants

| Export | Description |
|--------|-------------|
| `OrderStatus` | Order status values (PENDING, CONFIRMED, FULFILLED, REJECTED); carts use `null` |

### Settings

| Export | Description |
|--------|-------------|
| `ordersSettings` | Access order module settings |

### Types

| Export | Description |
|--------|-------------|
| `Order` | Order document type |
| `OrderPosition` | Position document type |
| `OrderPayment` | Payment document type |
| `OrderDelivery` | Delivery document type |
| `OrderDiscount` | Discount document type |
| `OrdersModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `ORDER_CREATE` | Order created |
| `ORDER_UPDATE` | Order updated |
| `ORDER_REMOVE` | Order deleted |
| `ORDER_CHECKOUT` | Order checked out |
| `ORDER_CONFIRMED` | Order confirmed |
| `ORDER_REJECTED` | Order rejected |
| `ORDER_FULFILLED` | Order fulfilled |

## License

EUPL-1.2

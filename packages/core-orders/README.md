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
import { configureOrdersModule, OrderStatus } from '@unchainedshop/core-orders';

const ordersModule = await configureOrdersModule({ db });

// Create an order
const orderId = await ordersModule.create({
  userId: 'user-123',
  currency: 'CHF',
  countryCode: 'CH',
});

// Add position to order
await ordersModule.positions.create({
  orderId,
  productId: 'product-456',
  quantity: 2,
});

// Checkout order
await ordersModule.checkout(orderId, { paymentContext: {} });
```

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
| `update` | Update order data |
| `delete` | Delete an order |
| `checkout` | Process order checkout |
| `confirm` | Confirm an order |
| `reject` | Reject an order |
| `setPaymentProvider` | Set payment provider |
| `setDeliveryProvider` | Set delivery provider |

### Submodules

#### Positions (`orders.positions`)
| Method | Description |
|--------|-------------|
| `findPositions` | Find order positions |
| `create` | Add position to order |
| `update` | Update position |
| `delete` | Remove position |

#### Payments (`orders.payments`)
| Method | Description |
|--------|-------------|
| `findPayment` | Find order payment |
| `create` | Create payment for order |
| `markPaid` | Mark payment as paid |
| `charge` | Charge the payment |

#### Deliveries (`orders.deliveries`)
| Method | Description |
|--------|-------------|
| `findDelivery` | Find order delivery |
| `create` | Create delivery for order |
| `markDelivered` | Mark as delivered |
| `send` | Trigger delivery |

#### Discounts (`orders.discounts`)
| Method | Description |
|--------|-------------|
| `findDiscounts` | Find order discounts |
| `create` | Add discount to order |
| `delete` | Remove discount |

### Constants

| Export | Description |
|--------|-------------|
| `OrderStatus` | Order status values (OPEN, PENDING, CONFIRMED, FULLFILLED, REJECTED) |

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
| `ORDER_FULLFILLED` | Order fulfilled |

## License

EUPL-1.2

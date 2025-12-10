[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-payment.svg)](https://npmjs.com/package/@unchainedshop/core-payment)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-payment

Payment provider module for the Unchained Engine. Manages payment providers, credentials, and payment processing.

## Installation

```bash
npm install @unchainedshop/core-payment
```

## Usage

```typescript
import { configurePaymentModule, PaymentProviderType } from '@unchainedshop/core-payment';

const paymentModule = await configurePaymentModule({ db });

// Create a payment provider
const providerId = await paymentModule.create({
  type: PaymentProviderType.CARD,
  adapterKey: 'shop.unchained.payment.stripe',
});

// Find providers for a context
const providers = await paymentModule.findSupported({
  order: orderObject,
});
```

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configurePaymentModule` | Configure and return the payment module |

### Queries

| Method | Description |
|--------|-------------|
| `findProvider` | Find provider by ID |
| `findProviders` | Find providers with filtering |
| `count` | Count providers |
| `providerExists` | Check if provider exists |
| `findSupported` | Find providers supported for context |
| `findInterface` | Get provider interface definition |

### Mutations

| Method | Description |
|--------|-------------|
| `create` | Create a new payment provider |
| `update` | Update provider configuration |
| `delete` | Soft delete a provider |

### Credentials

| Method | Description |
|--------|-------------|
| `findCredentials` | Find stored credentials for user |
| `createCredentials` | Store payment credentials |
| `deleteCredentials` | Remove stored credentials |
| `markPreferred` | Mark credentials as preferred |

### Constants

| Export | Description |
|--------|-------------|
| `PaymentProviderType` | Provider types (CARD, INVOICE, GENERIC) |

### Settings

| Export | Description |
|--------|-------------|
| `paymentSettings` | Access payment module settings |

### Types

| Export | Description |
|--------|-------------|
| `PaymentProvider` | Provider document type |
| `PaymentCredentials` | Credentials document type |
| `PaymentModule` | Module interface type |

## Events

| Event | Description |
|-------|-------------|
| `PAYMENT_PROVIDER_CREATE` | Provider created |
| `PAYMENT_PROVIDER_UPDATE` | Provider updated |
| `PAYMENT_PROVIDER_REMOVE` | Provider deleted |

## License

EUPL-1.2

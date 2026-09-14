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

const paymentModule = await configurePaymentModule({ db, migrationRepository });

// Create a payment provider
const provider = await paymentModule.paymentProviders.create({
  type: PaymentProviderType.GENERIC,
  configuration: [],
  adapterKey: 'shop.unchained.payment.stripe',
});

// Find configured providers
const providers = await paymentModule.paymentProviders.findProviders({});
```

Context-dependent provider selection is available through `services.orders.supportedPaymentProviders` in [`@unchainedshop/core`](../core/README.md).

## API Overview

### Module Configuration

| Export | Description |
|--------|-------------|
| `configurePaymentModule` | Configure and return the payment module |

### Provider queries (`payment.paymentProviders`)

| Method | Description |
|--------|-------------|
| `findProvider` | Find provider by ID |
| `findProviders` | Find providers with filtering |
| `count` | Count providers |
| `providerExists` | Check if provider exists |

### Provider mutations (`payment.paymentProviders`)

| Method | Description |
|--------|-------------|
| `create` | Create a new payment provider |
| `update` | Update provider configuration |
| `delete` | Soft delete a provider |

### Credentials (`payment.paymentCredentials`)

| Method | Description |
|--------|-------------|
| `findPaymentCredentials` | Find stored credentials for user |
| `upsertCredentials` | Store payment credentials |
| `removeCredentials` | Remove stored credentials |
| `markPreferred` | Mark credentials as preferred |

### Constants

| Export | Description |
|--------|-------------|
| `PaymentProviderType` | Provider types (INVOICE, GENERIC) |

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

## Security (PCI DSS)

This module stores payment provider tokens and metadata. PCI DSS scope depends on the payment integration and deployment; see [SECURITY.md](../../SECURITY.md).

### Tokenization

- Do not place card numbers or CVV in credential tokens or metadata
- Store provider-issued tokens in the `token` field
- Keep provider metadata free of sensitive card data

```typescript
// PaymentCredentials structure - tokens only, no card data
type StoredCredentialFields = {
  paymentProviderId: string;
  userId: string;
  token?: string;        // Provider-issued token (NOT card number)
  isPreferred?: boolean;
  meta: any;             // Provider-specific metadata
};
```

### Payment Flow

A tokenized card integration typically follows this flow:
1. Card data collected by payment provider (Stripe, Datatrans, etc.)
2. Provider returns secure token
3. Unchained stores only the token reference
4. Subsequent charges use the token

See [SECURITY.md](../../SECURITY.md) for complete PCI DSS compliance documentation.

## License

EUPL-1.2

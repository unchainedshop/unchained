[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-payment.svg)](https://npmjs.com/package/@unchainedshop/core-payment)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-payment

Payment provider module for the Unchained Engine. Manages payment providers, credentials, and payment processing.

## Installation

```bash
npm install @unchainedshop/core-payment
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.payment`. Register a payment plugin before platform startup; the base preset includes Invoice payment.

```typescript
import { PaymentProviderType } from '@unchainedshop/core-payment';

const { payment } = platform.unchainedAPI.modules;
const provider = await payment.paymentProviders.create({
  type: PaymentProviderType.INVOICE,
  adapterKey: 'shop.unchained.invoice',
  configuration: [],
});
const providers = await payment.paymentProviders.findProviders({});
```

Provider records are managed by `paymentProviders`; stored credentials by `paymentCredentials`. Order services and payment adapters coordinate provider selection and charging. Payment integrations should store provider tokens and references rather than card data.

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/payment), [payment integration guide](https://docs.unchained.shop/guides/payment-integration), [public exports](src/payment-index.ts), and [module implementation](src/module/configurePaymentModule.ts).

## License

EUPL-1.2

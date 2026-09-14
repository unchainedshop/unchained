[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-delivery.svg)](https://npmjs.com/package/@unchainedshop/core-delivery)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-delivery

Delivery provider module for the Unchained Engine. Manages delivery providers, shipping methods, and delivery processing.

## Installation

```bash
npm install @unchainedshop/core-delivery
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.delivery`. Register a delivery plugin before platform startup; the base preset includes Post delivery.

```typescript
import { DeliveryProviderType } from '@unchainedshop/core-delivery';

const { delivery } = platform.unchainedAPI.modules;
const provider = await delivery.create({
  type: DeliveryProviderType.SHIPPING,
  adapterKey: 'shop.unchained.delivery.post',
  configuration: [],
});
const providers = await delivery.findProviders({});
```

`create` returns the provider document. Provider selection and order fulfillment are coordinated through `unchainedAPI.services.orders` and delivery adapters; the core module manages provider records and settings.

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/delivery), [public exports](src/delivery-index.ts), and [module implementation](src/module/configureDeliveryModule.ts).

## License

EUPL-1.2

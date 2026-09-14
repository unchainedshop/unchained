[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-warehousing.svg)](https://npmjs.com/package/@unchainedshop/core-warehousing)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-warehousing

Warehousing provider module for the Unchained Engine. Manages inventory, stock levels, and tokenized product surrogates.

## Installation

```bash
npm install @unchainedshop/core-warehousing
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.warehousing`. Register a warehousing plugin before platform startup; the base preset includes the Store adapter.

```typescript
import { WarehousingProviderType } from '@unchainedshop/core-warehousing';

const { warehousing } = platform.unchainedAPI.modules;
const provider = await warehousing.create({
  type: WarehousingProviderType.PHYSICAL,
  adapterKey: 'shop.unchained.warehousing.store',
  configuration: [],
});
const tokens = await warehousing.findTokensForUser({ userId: 'user-123' });
```

Provider records and tokens live in this module. Registered warehousing adapters implement stock and availability; `unchainedAPI.services.products` exposes inventory and dispatch simulations, and `unchainedAPI.services.warehousing` provides token helpers.

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/warehousing), [public exports](src/warehousing-index.ts), and [module implementation](src/module/configureWarehousingModule.ts).

## License

EUPL-1.2

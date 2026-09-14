[![npm version](https://img.shields.io/npm/v/@unchainedshop/core-quotations.svg)](https://npmjs.com/package/@unchainedshop/core-quotations)
[![License: EUPL-1.2](https://img.shields.io/badge/License-EUPL--1.2-blue.svg)](https://opensource.org/licenses/EUPL-1.2)

# @unchainedshop/core-quotations

Quotation management module for the Unchained Engine. Handles quote requests, proposals, and quotation workflows for custom pricing.

## Installation

```bash
npm install @unchainedshop/core-quotations
```

## Usage

The platform initializes this module as `platform.unchainedAPI.modules.quotations`.

```typescript
import { QuotationStatus } from '@unchainedshop/core-quotations';

const { quotations } = platform.unchainedAPI.modules;
const userQuotations = await quotations.findQuotations({ userId: 'user-123' });
const proposals = userQuotations.filter(
  (quotation) => quotations.normalizedStatus(quotation) === QuotationStatus.PROPOSED,
);
```

Use the GraphQL quotation mutations or `unchainedAPI.services.quotations` to request, propose, and verify quotations through the configured adapter. A proposal's `price` is an integer amount in the quotation currency's minor units, and its expiration field is `expires`.

See the [module guide](https://docs.unchained.shop/platform-configuration/modules/quotations), [quotation extension guide](https://docs.unchained.shop/extend/quotation), [public exports](src/quotations-index.ts), and [module implementation](src/module/configureQuotationsModule.ts).

## License

EUPL-1.2

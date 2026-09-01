---
sidebar_position: 3
title: Plugin Presets
sidebar_label: Plugin Presets
description: Pre-configured plugin bundles for quick setup
---

# Plugin Presets

Presets register commonly used plugin bundles with the plugin registry. Call the registration function **before** `startPlatform` — registered plugins self-register their HTTP routes and database modules, so no framework-specific connector is needed.

```ts
import { startPlatform } from '@unchainedshop/platform';
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';

registerBasePlugins();

const platform = await startPlatform({});
```

:::note
Import presets without a file extension (`@unchainedshop/plugins/presets/base`, not `.../base.js`) — the package exports map resolves the extensionless path.
:::

## Available Presets

| Preset | Import | Function |
|--------|--------|----------|
| Base | `@unchainedshop/plugins/presets/base` | `registerBasePlugins()` |
| Crypto | `@unchainedshop/plugins/presets/crypto` | `registerCryptoPlugins()` |
| All | `@unchainedshop/plugins/presets/all` | `registerAllPlugins()` |
| Switzerland | `@unchainedshop/plugins/presets/countries/ch` | `registerSwissTaxPlugins()` |
| European Union | `@unchainedshop/plugins/presets/countries/eu` | `registerEuTaxPlugins()` |
| United Kingdom | `@unchainedshop/plugins/presets/countries/uk` | `registerUkTaxPlugins()` |
| United States | `@unchainedshop/plugins/presets/countries/us` | `registerUsSalesTaxPlugins()` |

### Base Preset

Essential plugins for a minimal e-commerce setup:

- **Files**: GridFS (default storage backend), Temp Upload
- **Payment**: Invoice
- **Delivery**: Post
- **Warehousing**: Store, ERC Metadata
- **Pricing**: Free Payment, Free Delivery, Order Items, Order Discount, Order Delivery, Order Payment, Product Catalog Price, Product Discount
- **Quotations**: Manual
- **Enrollments**: Licensed
- **Events**: Node.js Event Emitter
- **Workers**: Bulk Import, Bulk Export, Zombie Killer, GC Guests, Invalidate Carts, Message, External, HTTP Request, Heartbeat, Email, Error Notifications

### Crypto Preset

Cryptocurrency and token functionality. Does **not** include the base preset:

- **Payment**: Cryptopay (self-hosted crypto payments)
- **Warehousing**: ETH Minter (Ethereum token minting)
- **Pricing**: Product Price Rate Conversion
- **Workers**: Export Token, Update ECB Rates, Update Coinbase Rates, Update Token Ownership

```ts
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';
import { registerCryptoPlugins } from '@unchainedshop/plugins/presets/crypto';

registerBasePlugins();
registerCryptoPlugins();
```

### All Preset

Registers the base, crypto, and Swiss tax presets plus:

- **Payment**: Datatrans v2, Stripe, Apple In-App Purchase, Payrexx, PostFinance Checkout, Saferpay, Invoice Prepaid
- **Delivery**: Send Message, Pick-Mup (store pickup)
- **Filters**: Strict Equal, Local Search
- **Workers**: Twilio SMS, BulkGate SMS, BudgetSMS, Push Notification, Enrollment Order Generator

### Country Presets

Each country preset registers product and delivery tax pricing plugins for its jurisdiction (`ch`: Swiss VAT, `eu`: EU VAT, `uk`: UK VAT, `us`: US sales tax). They contain only pricing plugins, so combine them with `base`:

```ts
import { registerBasePlugins } from '@unchainedshop/plugins/presets/base';
import { registerEuTaxPlugins } from '@unchainedshop/plugins/presets/countries/eu';

registerBasePlugins();
registerEuTaxPlugins();
```

## Plugins Not Included in Any Preset

Register these individually with `pluginRegistry.register`:

- **Minio / S3 file storage** (`@unchainedshop/plugins/files/minio`) — register `MinioPlugin` *instead of* the base preset's GridFS plugin (the first registered file adapter wins)
- **Example discount plugins** (`@unchainedshop/plugins/pricing/discount-half-price-manual`, `@unchainedshop/plugins/pricing/discount-100-off`)

```ts
import { pluginRegistry } from '@unchainedshop/core';
import { HalfPriceManualPlugin } from '@unchainedshop/plugins/pricing/discount-half-price-manual';
import { HundredOffPlugin } from '@unchainedshop/plugins/pricing/discount-100-off';

pluginRegistry.register(HalfPriceManualPlugin);
pluginRegistry.register(HundredOffPlugin);
```

## Best Practices

1. **Start with Base**: Begin with the base preset and add plugins as needed
2. **Use All for Development**: The all preset is great for development and testing all features
3. **Production Optimization**: In production, register only the plugins you need

---
sidebar_position: 43
title: ECB Exchange Rate Worker
sidebar_label: ECB Rates
description: Automatically update currency exchange rates from European Central Bank
---

# ECB Exchange Rate Worker

Automatically fetches and updates EUR-based currency exchange rates from the European Central Bank. Requires the optional `xml-js` package (`npm install xml-js`).

:::info Included in Crypto Preset
Registered automatically by `registerCryptoPlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { UpdateECBRatesPlugin } from '@unchainedshop/plugins/worker/update-ecb-rates';

pluginRegistry.register(UpdateECBRatesPlugin);
```

## Purpose

The ECB publishes daily reference exchange rates for major currencies against EUR. This worker:

- Fetches the latest rates from the ECB XML feed
- Updates product price rates in the database (rates expire after 24 hours)

## Auto-Scheduling

On registration, this worker schedules itself to run daily at 15:00 (4 PM CET), after the ECB publishes new rates.

## Manual Trigger

You can also trigger an update manually:

```graphql
mutation UpdateRates {
  addWork(type: UPDATE_ECB_RATES) {
    _id
    status
  }
}
```

## Supported Currencies

The ECB provides rates for approximately 30 currencies including:
- USD, GBP, JPY, CHF, CAD, AUD
- SEK, NOK, DKK, PLN, CZK, HUF
- And many more

Only currencies that exist in your Unchained system (active or inactive) are updated, and EUR itself must be one of them — otherwise the run is a no-op.

## Result

```json
{
  "ratesUpdated": 25,
  "info": "EUR not enabled"  // Only if EUR is not configured
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker.update-ecb-rates` |
| Type | `UPDATE_ECB_RATES` |
| Auto-Schedule | Daily at 15:00 |
| Retries | 5 |
| Source | [worker/update-ecb-rates](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/update-ecb-rates) |

## Related

- [Coinbase Rates Worker](./worker-update-coinbase-rates.md)
- [Multi-Currency Setup](../../guides/multi-currency-setup.md)
- [Plugins Overview](./)

---
sidebar_position: 43
title: ECB Exchange Rate Worker
sidebar_label: ECB Rates
description: Automatically update currency exchange rates from European Central Bank
---

# ECB Exchange Rate Worker

Automatically fetches and updates EUR-based currency exchange rates from the European Central Bank.

## Installation

```typescript
import '@unchainedshop/plugins/worker/update-ecb-rates';
```

### Peer Dependency

This worker requires the `xml-js` package:

```bash
npm install xml-js
```

## Purpose

The ECB publishes daily reference exchange rates for major currencies against EUR. This worker:

- Fetches the latest rates from the ECB XML feed
- Updates product price rates in the database
- Automatically schedules itself daily at 15:00 UTC (4 PM CET)

## Auto-Scheduling

When imported, this worker automatically schedules itself to run daily at 15:00 UTC, which is after the ECB publishes new rates (around 16:00 CET).

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

Only currencies that are enabled in your Unchained configuration will be updated.

## Requirements

- EUR must be an enabled currency in your system
- Target currencies must also be enabled
- The `xml-js` npm package must be installed

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
| Auto-Schedule | Daily at 15:00 UTC |
| Retries | 5 |
| Source | [worker/update-ecb-rates.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/update-ecb-rates.ts) |

## Related

- [Coinbase Rates Worker](./worker-update-coinbase-rates.md)
- [Multi-Currency Setup](../../guides/multi-currency-setup.md)
- [Plugins Overview](./)

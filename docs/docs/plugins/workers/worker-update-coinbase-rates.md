---
sidebar_position: 44
title: Coinbase Exchange Rate Worker
sidebar_label: Coinbase Rates
description: Automatically update cryptocurrency and fiat exchange rates from Coinbase
---

# Coinbase Exchange Rate Worker

Automatically fetches and updates currency exchange rates from Coinbase, supporting both fiat and cryptocurrency pairs.

## Installation

```typescript
import '@unchainedshop/plugins/worker/update-coinbase-rates';
```

## Purpose

Coinbase provides real-time exchange rates for a wide variety of currencies including cryptocurrencies. This worker:

- Fetches the latest rates from the Coinbase API
- Uses your system's default currency as the base
- Updates product price rates with a 5-minute expiration
- Automatically schedules itself to run every minute

## Auto-Scheduling

When imported, this worker automatically schedules itself to run every minute to keep cryptocurrency rates up-to-date.

## Manual Trigger

You can also trigger an update manually:

```graphql
mutation UpdateRates {
  createWork(type: "UPDATE_COINBASE_RATES") {
    _id
    status
  }
}
```

## Supported Currencies

Coinbase provides rates for:
- **Fiat currencies**: USD, EUR, GBP, CHF, and many more
- **Cryptocurrencies**: BTC, ETH, USDC, and hundreds of others

Only currencies that are enabled in your Unchained configuration will be updated.

## Rate Expiration

Rates are set to expire after 5 minutes, ensuring that:
- Stale cryptocurrency rates are not used
- The system falls back gracefully if the worker stops

## Result

```json
{
  "ratesUpdated": 15
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker.update-coinbase-rates` |
| Type | `UPDATE_COINBASE_RATES` |
| Auto-Schedule | Every minute |
| Source | [worker/update-coinbase-rates.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/update-coinbase-rates.ts) |

## Related

- [ECB Rates Worker](./worker-update-ecb-rates.md)
- [Multi-Currency Setup](../../guides/multi-currency-setup.md)
- [Plugins Overview](./)

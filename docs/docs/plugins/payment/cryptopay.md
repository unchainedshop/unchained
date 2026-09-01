---
sidebar_position: 3
title: Cryptopay
sidebar_label: Cryptopay
description: Self-hosted cryptocurrency payments (BTC, ETH, ERC20)
---

# Cryptopay

The Cryptopay plugin accepts payments in Bitcoin, Ethereum, and arbitrary ERC20 tokens without a centralized payment provider and without your private key. It derives a fresh address per order from your extended public keys and marks orders as paid when the [Unchained Cryptopay gateway](https://github.com/unchainedshop/unchained-cryptopay) reports incoming transactions to the webhook. The same webhook also feeds [Chainlink](https://chain.link/) price data into Unchained's currency rate system, which can be combined with other rate plugins (e.g. Coinbase).

## Installation

Included in the [`crypto` and `all` presets](../../platform-configuration/plugin-presets.md) — `registerCryptoPlugins()` / `registerAllPlugins()` register the plugin together with its webhook route and database module.

To register it individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { CryptopayPlugin } from '@unchainedshop/plugins/payment/cryptopay';

pluginRegistry.register(CryptopayPlugin);
```

Register before `startPlatform()`. Registration mounts the webhook route `POST /payment/cryptopay` (path configurable via `CRYPTOPAY_WEBHOOK_PATH`) and adds the `cryptopay` database module. Registration throws if `CRYPTOPAY_SECRET` is missing or neither xpub is set.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CRYPTOPAY_SECRET` | - | Shared secret for gateway communication; must equal `unchained.secret` in the gateway's `cryptopay.yaml` (required) |
| `CRYPTOPAY_BTC_XPUB` | - | Extended Bitcoin public key (required for BTC payments) |
| `CRYPTOPAY_ETH_XPUB` | - | Extended Ethereum public key (required for ETH/ERC20 payments) |
| `CRYPTOPAY_WEBHOOK_PATH` | `/payment/cryptopay` | Webhook path; must correspond to `unchained.transaction-webhook-url` in the gateway's `cryptopay.yaml` |
| `CRYPTOPAY_MAX_RATE_AGE` | `360` | Maximum age (seconds) of an exchange rate to still be considered for conversion |

At least one of `CRYPTOPAY_BTC_XPUB` / `CRYPTOPAY_ETH_XPUB` is required.

### Ethereum Address Derivation

Many Ethereum wallets do not expose the extended public key. Generate it from a mnemonic, e.g. with `ethers.js`:

```javascript
let HDNode = require('ethers').utils.HDNode;
let masterNode = HDNode.fromMnemonic("<redacted>");
let hardenedMaster = masterNode.derivePath("m/44'/60'/0'");
let xpub = hardenedMaster.neuter().extendedKey;
```

:::warning
Never generate the extended public key on a publicly accessible system. Do it offline and only reference the xpub on the server — then an attacker cannot access your funds even if the system is fully compromised.
:::

## Create Provider

```graphql
mutation CreateCryptopayProvider {
  createPaymentProvider(
    paymentProvider: {
      type: GENERIC
      adapterKey: "shop.unchained.payment.cryptopay"
    }
  ) {
    _id
  }
}
```

## Payment Flow

Follows the standard [checkout flow](./index.md#checkout-flow). Cryptopay specifics:

`signPaymentProviderForCheckout(orderPaymentId: "...")` derives the payment addresses for the order and returns them as a JSON string:

```json
[
  { "currencyCode": "BTC", "address": "mkFQhpfDfW9tqybJA47b71Wxq3XKV2DSwT" },
  { "currencyCode": "ETH", "address": "0xaBC2bCA51709b8615147352C62420F547a63A00c" }
]
```

Each entry also carries `currencyConversionRate` and `currencyConversionExpiryDate` when a conversion rate from the order currency is available. Only addresses for configured xpubs are returned. Calling the mutation repeatedly returns the same addresses for a given `orderPaymentId`, so you can display them anywhere (checkout, order history for deferred payment) by re-calling the mutation.

When the payment arrives on-chain, the gateway calls the webhook and Unchained checks out the cart server-side — there is no client-side checkout step.

## Pricing

Products can have crypto prices directly — incoming on-chain amounts are normalized to at most 9 decimal places, so record `amount: 10 ** 9` for a price of 1 ETH (GWei) and `amount: 10 ** 8` for 1 BTC (satoshi) — or fiat-only prices. For fiat-priced products, the paid crypto amount is converted via Unchained's rate system; the gateway pushes fresh Chainlink rates through the webhook, and `CRYPTOPAY_MAX_RATE_AGE` bounds how stale a rate may be. If no direct price feed exists for a pair (e.g. `MATIC`/`CHF`), the gateway automatically routes through `USD`.

### ERC20 Tokens

To accept an ERC20 token, create a currency with its `contractAddress`:

```graphql
mutation createMATIC {
  createCurrency(
    currency: {
      isoCode: "MATIC"
      decimals: 18
      contractAddress: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0"
    }
  ) {
    _id
  }
}
```

For security reasons, payments are only accepted in ERC20 tokens that exist as a currency in your store.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.payment.cryptopay` |
| Type | `GENERIC` |
| Version | `1.0.0` |
| Source | [payment/cryptopay/](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/payment/cryptopay) |

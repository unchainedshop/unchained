---
sidebar_position: 3
title: Decentralized, Self-Hosted Cryptocurrency Payments
sidebar_label: Decentralized, Self-Hosted Cryptocurrency Payments
---

:::info
Usage and Configuration Options for the Cryptopay Plugin
:::info

The Cryptopay plugin in conjunction with the Unchained Cryptopay Payment Gateway allows you to accept payments in Bitcoin, Ethereum and arbitrary ERC20 tokens without relying on centralized payment providers and without your private key. It consists of two parts:

- A payment plugin that generates new addresses for every order and updates the payment status when the order is paid.
- A price feed plugin that continuously gets the [Chainlink](https://chain.link/) price feeds to convert between the different currencies.

Because the plugin is using the currency rate system of Unchained with support for arbitrary rate plugins, it can also be used in conjunction with other price feeds (e.g., Coinbase) if desired.

 ### Payment Plugin
## Environment variables

You have to set `CRYPTOPAY_SECRET`, `CRYPTOPAY_BTC_XPUB` (if you want to accept Bitcoin payments), and `CRYPTOPAY_ETH_XPUB` (if you want to accept Ethereum payments):

| NAME                      | Default Value                          | Description                         |
| ------------------------- | -------------------------------------- | --------------------------------------- |
| `CRYPTOPAY_SECRET`        |                                        | Shared secret for communication with the payment gateway. Has to be equal to `unchained.secret` in the payment gateway configuration (`cryptopay.yaml`). |
| `CRYPTOPAY_WEBHOOK_PATH`  | `/payment/cryptopay`                   | The path that is used for the payment webhook. Has to correspond to the path in `unchained.transaction-webhook-url` of the payment gateway configuration (`cryptopay.yaml`). |
| `CRYPTOPAY_BTC_XPUB`      |                                        | Extended Bitcoin public key. |
| `CRYPTOPAY_BTC_TESTNET`   | `false`                                | Denotes whether the extended public key is a testnet public key. |
| `CRYPTOPAY_ETH_XPUB`      |                                        | Extended Ethereum public key. |
| `CRYPTOPAY_MAX_RATE_AGE`  | `360`                                  | Maximum age of an exchange rate (in seconds) such that it is still considered for the conversion. |

### Ethereum Address Derivation

In contrast to Bitcoin, many Ethereum wallets do not expose the extended public key to you. However, it is very easy to generate a wallet and retrieve it with Python or JavaScript.
In JavaScript when using `ethers.js`, the code to do so looks like this:
```javascript
let HDNode = require('ethers').utils.HDNode;
let mnemonic = "<redacted>";
let masterNode = HDNode.fromMnemonic(mnemonic);
let hardenedMaster = masterNode.derivePath("m/44'/60'/0'");

// Extended public key (of hardened master node, i.e. path "m/44'/60'/0'")
let xpub = hardenedMaster.neuter().extendedKey;
```

Similarly, `bip-utils` can be used in Python:
```python
import binascii
from bip_utils import Bip39SeedGenerator, Bip44Coins, Bip44

# Generate from mnemonic
mnemonic = "<redacted>"
seed_bytes = Bip39SeedGenerator(mnemonic).Generate()
# Or specify seed manually
# seed_bytes = binascii.unhexlify(b"<seed>")
# Derivation path returned: m
bip44_mst_ctx = Bip44.FromSeed(seed_bytes, Bip44Coins.ETHEREUM)
xpub = bip44_mst_ctx.Purpose().Coin().Account(0).PublicKey().ToExtended() # m/44'/60'/0'
```

**Note that for security reasons, the extended public key should never be generated on a system that is publicly accessible.**
You should always do this offline and only reference the extended public key on publicly accessible systems.
Then, an attacker cannot access your funds, even if your system is completely compromised.

## Usage

The payment plugin supports products that have a crypto price (including ERC20 tokens, where the `contractAddress` is set on the currency), but also those that only have a fiat price. When the product has a crypto price, it is assumed that the price is recorded with 8 decimal places. For instance, the following `UpdateProductCommercePricingInput` would be used for a product that costs 1 ETH:

```javascript
{
    amount: 10 ** 8,
    maxQuantity: 0,
    isTaxable: false,
    isNetPrice: false,
    currencyCode: 'ETH',
    countryCode: 'CH',
}
```

When a product only has a fiat price (e.g., `USD`), the paid crypto amount is converted to the fiat currency using Unchained's rate system. Because rates for cryptocurrencies can be very volatile, the behavior of the engine for the conversion is configurable. With `CRYPTOPAY_MAX_RATE_AGE`, you can configure the maximum age (in seconds) for the exchange rate such that it is still considered for the conversion. When using the Cryptopay pricing plugin (see below), the rates are updated every 10 seconds during normal operation.
With the parameter `CRYPTOPAY_MAX_CONV_DIFF`, you can configure if an order should be considered as paid even if the converted amount is lower than the fiat price of the product. This can happen when the exchange rate changes between the generation of the address and the payment (including confirmation on the blockchain) of the user.
A value of `0.00` means that the converted amount always has to be equal or higher than the configured fiat price of the product. 

### Deriving Addresses for an Order

To get the addresses that belong to the order and are displayed to the end user, the `signPaymentProviderForCheckout` mutation is used:
```/*graphql*/
signPaymentProviderForCheckout(
    orderPaymentId: "order payment id of the cart you want to checkout"
)
```

*To get the order payment id of the current active cart of the logged in user you can*
```/*graphql*/
me {
    cart {
        payment {
            _id
        }
    }
} 
```

The mutation returns a stringified JSON-object with the different addresses: 

```json
{
  "data": {
    "signPaymentProviderForCheckout": "[{\"currency\":\"BTC\",\"address\":\"mkFQhpfDfW9tqybJA47b71Wxq3XKV2DSwT\"},{\"currency\":\"ETH\",\"address\":\"0xaBC2bCA51709b8615147352C62420F547a63A00c\"}]"
  }
}
```

Note that only addresses are returned if the corresponding extended public key is set. If you only set `CRYPTOPAY_ETH_XPUB`, the array will therefore only contain an Ethereum address.

The plugin ensures that when calling the mutation multiple times, the returned addresses are always identical for a given `orderPaymentId`. When integrating it into the frontend, the addresses can therefore be shown in multiple places (e.g., at the checkout stage and inside the orders overview in the account page to allow deferred payments with crypto) and always be retrieved by calling the mutation.

### Accepting Payments in ERC20 tokens

If you want to accept payments in a token that follows the ERC20 standard, you have to create a corresponding currency and provide a `contractAddress`, e.g.:
```/*graphql*/
mutation createMATIC {
  createCurrency(currency: {isoCode: "MATIC",
                            decimals: 18, 
                            contractAddress: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0"}) {
    _id
  }
}
```

You can then set prices for products in this currency and use it for payments that are converted to fiat (with arbitrary price feeds, e.g. the decentralized Cryptopay feeds based on Chainlink). Note that for security reasons, payments are only accepted for the ERC20 tokens that you have added to your store as a currency.

# Pricing Plugin

The Cryptopay pricing plugin provides rates for the Unchained rate system and can therefore be used by the payment plugin for the rate conversions.
The gateway sends the current rate for BTC, ETH, and the configured ERC20 tokens to the plugin every 10 seconds. If no Chainlink price feed exists for a given currency pair (e.g., if you have an online shop that only has `CHF` prices and want to accept payments in `MATIC`, but there is no direct `MATIC` / `CHF` feed), the gateway tries to use `USD` as an intermediate currency in the calculation (e.g., the `MATIC` / `USD` and `CHF` / `USD` feeds are used in the previous example to calculate the `MATIC` / `CHF` rate). This happens automatically in the background and you do not have to worry about it.

## Environment variables

| NAME                              | Default Value                          | Description                         |
| --------------------------------- | -------------------------------------- | --------------------------------------- |
| `CRYPTOPAY_SECRET`                |                                        | Shared secret for communication with the payment gateway. Has to be equal to `unchained.secret` in the payment gateway configuration (`cryptopay.yaml`). |

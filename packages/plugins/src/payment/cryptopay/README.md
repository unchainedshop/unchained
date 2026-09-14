# Cryptopay

Register `CryptopayPlugin` from `@unchainedshop/plugins/payment/cryptopay` through `pluginRegistry` before platform startup. The plugin exposes a payment webhook at `/payment/cryptopay`; its request `secret` must match `CRYPTOPAY_SECRET`.

For configuration and webhook payloads, see the [Cryptopay integration guide](../../../../../docs/docs/plugins/payment/cryptopay.md).

## HD key requirements

The adapter derives a separate receiving address for each payment from an extended public key. Both Bitcoin and Ethereum derivation append `/0/<index>` to the supplied key's node.

For Bitcoin, `CRYPTOPAY_BTC_XPUB` must use native SegWit extended public key encoding: `zpub` for mainnet or `vpub` for testnet. Other prefixes are rejected.

For Ethereum, `CRYPTOPAY_ETH_XPUB` is an account-level extended public key. Supplying the key for `m/44'/60'/0'` produces addresses at `m/44'/60'/0'/0/0`, `m/44'/60'/0'/0/1`, and so on.

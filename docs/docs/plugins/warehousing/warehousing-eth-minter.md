---
sidebar_position: 3
title: ETH Minter
sidebar_label: ETH Minter
description: NFT tokenization adapter for Web3 products
---

# ETH Minter Warehousing Adapter

Virtual warehousing for tokenized (NFT) products. Creates token records for ERC-721 and ERC-1155 contracts and serves ERC-compatible token metadata.

:::info Included in Crypto Preset
Registered automatically by `registerCryptoPlugins()` and `registerAllPlugins()`.
:::

If you register plugins individually:

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { ETHMinterPlugin } from '@unchainedshop/plugins/warehousing/eth-minter';

pluginRegistry.register(ETHMinterPlugin);
```

## Setup

```graphql
mutation CreateETHMinter {
  createWarehousingProvider(warehousingProvider: {
    type: VIRTUAL
    adapterKey: "shop.unchained.warehousing.infinite-minter"
  }) {
    _id
  }
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.warehousing.infinite-minter` |
| Type | `VIRTUAL` |
| Order Index | `0` |
| Source | [warehousing/eth-minter](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/warehousing/eth-minter) |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MINTER_TOKEN_OFFSET` | Starting token serial number offset (ERC-721) | `0` |
| `ROOT_URL` | Base URL for the metadata localization URI | `http://localhost:4010` |

## Configuration Options

| Key | Description | Default |
|-----|-------------|---------|
| `chainId` | Chain ID stored on created tokens | `0` |

## Product Setup

Create a `TOKENIZED_PRODUCT` and configure its tokenization:

```graphql
mutation CreateTokenizedProduct {
  createProduct(product: { type: TOKENIZED_PRODUCT }) {
    _id
  }
}

mutation ConfigureTokenization {
  updateProductTokenization(
    productId: "product-id"
    tokenization: {
      contractAddress: "0x..."
      contractStandard: ERC721
      tokenId: "1"
      supply: 1000
      ercMetadataProperties: { attributes: [{ trait_type: "Rarity", value: "Legendary" }] }
    }
  ) {
    _id
  }
}
```

**ERC-721 (non-fungible):** every mint creates one token record per quantity with a unique, incrementing `tokenSerialNumber` (starting at `MINTER_TOKEN_OFFSET + 1`).

**ERC-1155 (semi-fungible):** every mint creates a single token record with the configured `tokenId` as serial number and the ordered quantity. `tokenId` is required — `configurationError()` reports `INCOMPLETE_CONFIGURATION` without it.

## Behavior

- `isActive()` returns `true` only for `TOKENIZED_PRODUCT` products.
- `stock()` returns `supply - tokensCreated` (or `0` when no supply is set).
- `tokenize()` creates the token records described above when an order position is fulfilled — actual on-chain minting is up to you.
- `tokenMetadata(tokenSerialNumber)` returns EIP-721/EIP-1155-compatible JSON built from the localized product texts, the first product media file, and `ercMetadataProperties`:

```json
{
  "name": "Product Title #1",
  "description": "Product description",
  "image": "https://cdn.example.com/image.png",
  "properties": { "attributes": [{ "trait_type": "Rarity", "value": "Legendary" }] },
  "localization": {
    "uri": "https://example.com/erc-metadata/{productId}/{locale}/{tokenId}.json",
    "default": "en",
    "locales": ["en", "de", "fr"]
  }
}
```

## Metadata Endpoint

The metadata HTTP route is served by the separate `shop.unchained.warehousing.erc-metadata` plugin ([warehousing/erc-metadata](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/warehousing/erc-metadata), part of the `base` preset). The path prefix defaults to `/erc-metadata` and is configurable via the `ERC_METADATA_API_PATH` env var.

## Querying Tokens

```graphql
query MyTokens {
  me {
    tokens {
      _id
      quantity
      status
      contractAddress
      chainId
      walletAddress
    }
  }
}
```

## Custom Minting Adapter

For custom blockchain integrations, use the `registerVirtualWarehousing` factory:

```typescript
import { registerVirtualWarehousing } from '@unchainedshop/core';

registerVirtualWarehousing({
  adapterId: 'custom-minter',
  stock: async () => {
    const totalSupply = await contract.totalSupply();
    const maxSupply = await contract.maxSupply();
    return maxSupply - totalSupply;
  },
  tokenize: async (configuration, { product, orderPosition }) => {
    const tx = await contract.mint(orderPosition.quantity);
    const receipt = await tx.wait();

    return receipt.events
      .filter((event) => event.event === 'Transfer')
      .map((event) => ({
        _id: crypto.randomUUID(),
        tokenSerialNumber: event.args.tokenId.toString(),
        contractAddress: product.tokenization.contractAddress,
        quantity: 1,
        meta: { txHash: tx.hash },
      }));
  },
});
```

## Related

- [Store Adapter](./warehousing-store.md) - Physical inventory
- [Custom Warehousing Plugins](../../extend/order-fulfilment/fulfilment-plugins/warehousing.md) - Write your own

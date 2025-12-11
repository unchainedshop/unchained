---
sidebar_position: 3
title: ETH Minter
sidebar_label: ETH Minter
description: NFT tokenization adapter for Web3 products
---

# ETH Minter Warehousing Adapter

The ETH Minter adapter enables tokenization for NFT and Web3 products, supporting ERC-721 and ERC-1155 standards.

## Installation

```typescript
import '@unchainedshop/plugins/warehousing/eth-minter';
```

## Configuration

Create a warehousing provider for tokenized products:

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

Configure the `chainId` via the Admin UI after creation.

## Features

- ERC-721 (non-fungible) token minting
- ERC-1155 (semi-fungible) token minting
- Supply tracking and enforcement
- ERC metadata endpoint support
- Multi-language token metadata

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.warehousing.infinite-minter` |
| Type | `VIRTUAL` |
| Order Index | `0` |
| Source | [warehousing/eth-minter.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/warehousing/eth-minter.ts) |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MINTER_TOKEN_OFFSET` | Starting token ID offset | `0` |
| `ROOT_URL` | Base URL for metadata endpoints | `http://localhost:4010` |

## Configuration Options

| Key | Description |
|-----|-------------|
| `chainId` | Ethereum chain ID (1 = mainnet, 5 = goerli, etc.) |

## Product Setup

Configure tokenized products:

```graphql
mutation CreateTokenizedProduct {
  createProduct(product: {
    type: TOKENIZED_PRODUCT
  }) {
    _id
  }
}
```

After creating the product, configure tokenization via the Admin UI or update the product with tokenization settings.

Tokenization configuration includes:
- `contractAddress` - The smart contract address
- `contractStandard` - `ERC721` or `ERC1155`
- `supply` - Maximum token supply
- `ercMetadataProperties` - Metadata for the token

### Contract Standards

**ERC-721 (Non-Fungible)**
- Each token has a unique serial number
- Serial number increments per mint
- Quantity is always 1 per token

**ERC-1155 (Semi-Fungible)**
- Tokens share the same tokenId
- Quantity can be > 1
- Requires `tokenId` in product configuration

```
# ERC-1155 product tokenization config
tokenization: {
  contractAddress: "0x..."
  contractStandard: ERC1155
  tokenId: "42"  # Required for ERC-1155
  supply: 1000
}
```

## Behavior

### `isActive()`
Returns `true` only for `TOKENIZED_PRODUCT` type products.

### `stock()`
Returns remaining supply:
```typescript
const tokensCreated = await getTokensCreated();
return supply ? supply - tokensCreated : 0;
```

### `tokenize()`
Creates token records when an order is fulfilled:

**ERC-721:**
```typescript
// Creates N unique tokens for N quantity
[
  { tokenSerialNumber: "1", quantity: 1 },
  { tokenSerialNumber: "2", quantity: 1 },
  // ...
]
```

**ERC-1155:**
```typescript
// Creates one token record with total quantity
[
  { tokenSerialNumber: "42", quantity: 5 }
]
```

### `tokenMetadata()`
Returns ERC-compatible metadata JSON:

```json
{
  "name": "Product Title #1",
  "description": "Product description",
  "image": "https://cdn.example.com/image.png",
  "properties": {
    "external_url": "https://example.com",
    "attributes": [
      { "trait_type": "Rarity", "value": "Legendary" }
    ]
  },
  "localization": {
    "uri": "https://example.com/erc-metadata/{id}/{locale}/{tokenId}.json",
    "default": "en",
    "locales": ["en", "de", "fr"]
  }
}
```

## Metadata Endpoint

The adapter expects a metadata endpoint at:
```
{ROOT_URL}/erc-metadata/{productId}/{locale}/{tokenId}.json
```

Implement this endpoint in your server:

```typescript
app.get('/erc-metadata/:productId/:locale/:tokenId.json', async (req, res) => {
  const { productId, locale, tokenId } = req.params;

  const metadata = await modules.warehousing.tokenMetadata({
    productId,
    locale,
    tokenSerialNumber: tokenId,
  });

  res.json(metadata);
});
```

## On-Chain Integration

The adapter creates database records. Actual blockchain minting requires additional integration:

```typescript
import { ethers } from 'ethers';

// After order confirmation
const tokens = await modules.warehousing.tokenize(orderPosition);

for (const token of tokens) {
  // Mint on blockchain
  const tx = await nftContract.mint(
    customerWallet,
    token.tokenSerialNumber
  );

  // Update token with transaction hash
  await modules.warehousing.updateToken(token._id, {
    'meta.txHash': tx.hash,
    'meta.mintedAt': new Date(),
  });
}
```

## Custom Minting Adapter

For custom blockchain integrations:

```typescript
import {
  WarehousingDirector,
  WarehousingAdapter,
  type IWarehousingAdapter
} from '@unchainedshop/core';

const CustomMinterAdapter: IWarehousingAdapter = {
  ...WarehousingAdapter,

  key: 'my-shop.custom-minter',
  label: 'Custom NFT Minter',
  version: '1.0.0',

  typeSupported: (type) => type === 'VIRTUAL',

  actions(configuration, context) {
    const { product, orderPosition } = context;

    return {
      ...WarehousingAdapter.actions(configuration, context),

      isActive() {
        return product?.type === 'TOKENIZED_PRODUCT';
      },

      configurationError() {
        if (!process.env.MINTER_PRIVATE_KEY) {
          return { code: 'MISSING_MINTER_KEY' };
        }
        return null;
      },

      async stock() {
        // Check on-chain supply
        const totalSupply = await contract.totalSupply();
        const maxSupply = await contract.maxSupply();
        return maxSupply - totalSupply;
      },

      async tokenize() {
        const { contractAddress, tokenId } = product.tokenization;

        // Mint on-chain
        const tx = await contract.mint(
          orderPosition.quantity,
          { gasLimit: 500000 }
        );
        const receipt = await tx.wait();

        // Extract token IDs from events
        const mintEvents = receipt.events.filter(e => e.event === 'Transfer');

        return mintEvents.map(event => ({
          _id: generateDbObjectId(),
          tokenSerialNumber: event.args.tokenId.toString(),
          contractAddress,
          quantity: 1,
          meta: {
            txHash: tx.hash,
            blockNumber: receipt.blockNumber,
          },
        }));
      },
    };
  },
};

WarehousingDirector.registerAdapter(CustomMinterAdapter);
```

## Querying Tokens

```graphql
query UserTokens {
  me {
    orders {
      items {
        product { _id texts { title } }
        tokens {
          _id
          quantity
        }
      }
    }
  }
}
```

## Related

- [Plugins Overview](./) - All available plugins
- [Store Adapter](./warehousing-store.md) - Physical inventory
- [Custom Warehousing Plugins](../../extend/order-fulfilment/fulfilment-plugins/warehousing.md) - Write your own

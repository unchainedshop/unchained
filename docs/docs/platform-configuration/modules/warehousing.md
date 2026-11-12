---
sidebar_position: 8
title: Warehousing Module
sidebar_label: Warehousing
description: Inventory, stock management, and token handling
---

# Warehousing Module

The warehousing module manages inventory, stock levels, warehousing providers, and tokenized product handling.

## Configuration Options

The warehousing module has no configuration options.

## Module API

Access via `modules.warehousing` in the Unchained API context.

### Provider Queries

| Method | Arguments | Description |
|--------|-----------|-------------|
| `findProvider` | `{ warehousingProviderId }` | Get a specific provider |
| `findProviders` | `query?, options?` | List warehousing providers |
| `allProviders` | — | Get all active providers (cached) |
| `count` | `query?` | Count providers |
| `providerExists` | `{ warehousingProviderId }` | Check if provider exists |

### Provider Mutations

| Method | Arguments | Description |
|--------|-----------|-------------|
| `create` | `doc` | Create a warehousing provider |
| `update` | `warehousingProviderId, doc` | Update provider |
| `delete` | `providerId` | Delete provider |

### Token Operations

For tokenized products (NFTs, digital assets):

| Method | Arguments | Description |
|--------|-----------|-------------|
| `findToken` | `{ tokenId }, options?` | Get a specific token |
| `findTokens` | `selector, options?` | List tokens |
| `tokensCount` | `selector?` | Count tokens |
| `findTokensForUser` | `{ userId } \| { walletAddresses }, options?` | Get user's tokens |
| `createTokens` | `tokens` | Batch create tokens, then emit `TOKEN_CREATED` for each |
| `updateTokenOwnership` | `{ tokenId, userId } \| { tokenId, walletAddress }` | Transfer token ownership |
| `invalidateToken` | `tokenId` | Revoke a token |
| `buildAccessKeyFromToken` | `token` | Generate an access key for a token |

### Usage

```typescript
// Create a warehousing provider
await modules.warehousing.create({
  adapterKey: 'shop.unchained.warehousing.store',
  type: 'PHYSICAL',
  configuration: [],
});

// Find tokens for a user
const tokens = await modules.warehousing.findTokensForUser({
  userId: 'user-123',
});

// Transfer token ownership
await modules.warehousing.updateTokenOwnership({
  tokenId: 'token-id',
  userId: 'new-owner-id',
});
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `WAREHOUSING_PROVIDER_CREATE` | `{ warehousingProvider }` | Emitted when a warehousing provider is created |
| `WAREHOUSING_PROVIDER_UPDATE` | `{ warehousingProvider }` | Emitted when a warehousing provider is updated |
| `WAREHOUSING_PROVIDER_REMOVE` | `{ warehousingProvider }` | Emitted when a warehousing provider is removed |
| `TOKEN_CREATED` | `{ token }` | Emitted for each token once `createTokens` stored it |
| `TOKEN_OWNERSHIP_CHANGED` | `{ token }` | Emitted when a token is transferred to another user or wallet |
| `TOKEN_INVALIDATED` | `{ token }` | Emitted when a token is invalidated |

During checkout `TOKEN_CREATED` fires after `ORDER_CONFIRMED`, because the order is confirmed before its tokenized positions are tokenized; listen to `TOKEN_CREATED` when you need the tokens of an order.

```typescript
import { subscribe } from '@unchainedshop/events';
import type { TokenSurrogate } from '@unchainedshop/core-warehousing';

subscribe<{ token: TokenSurrogate }>('TOKEN_CREATED', async ({ payload: { token } }) => {
  // token.orderPositionId, token.productId, token.userId
});
```

## Related

- [Warehousing Plugins](../../plugins/warehousing/index.md) - Available warehousing adapters
- [ETH Minter](../../plugins/warehousing/warehousing-eth-minter.md) - NFT minting plugin

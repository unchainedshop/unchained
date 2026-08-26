---
sidebar_position: 51
title: Token Ownership Workers
sidebar_label: Token Ownership
description: Workers for updating and refreshing NFT/token ownership
---

# Token Ownership Workers

Two workers for managing NFT/token ownership: one for refreshing tokens and one for external ownership updates.

:::info Included in Crypto Preset
Registered automatically by `registerCryptoPlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { UpdateTokenOwnershipPlugin } from '@unchainedshop/plugins/worker/update-token-ownership';

pluginRegistry.register(UpdateTokenOwnershipPlugin);
```

## Workers Included

This plugin registers two worker adapters:

### 1. Refresh Tokens Worker

Automatically finds all tokens and accounts, then triggers ownership updates.

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.refresh-tokens` |
| Type | `REFRESH_TOKENS` |
| Auto-Schedule | Every minute |

### 2. Update Token Ownership Worker (External)

External worker placeholder for the actual ownership verification process.

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.update-token-ownership` |
| Type | `UPDATE_TOKEN_OWNERSHIP` |
| External | `true` |

## How It Works

### Refresh Tokens Flow

1. **Auto-scheduled** every minute (configured on registration)
2. **Collects tokens**: Finds all tokens with wallet addresses (no tokens = no-op)
3. **Collects accounts**: Finds all verified Web3 addresses of users, plus the token wallet addresses
4. **Creates work**: Triggers `UPDATE_TOKEN_OWNERSHIP` with the token and account data
5. **External processing**: An external system processes the ownership verification

### External Update Flow

1. External system receives `UPDATE_TOKEN_OWNERSHIP` work
2. Verifies token ownership on the blockchain
3. Marks work as complete via GraphQL

## Manual Trigger

### Refresh All Tokens

```typescript
// Trigger via API
await unchainedAPI.modules.worker.addWork({
  type: 'REFRESH_TOKENS',
});
```

### Update Specific Tokens (External)

```typescript
// Trigger via API
await unchainedAPI.modules.worker.addWork({
  type: 'UPDATE_TOKEN_OWNERSHIP',
  input: {
    filter: {
      tokens: [{ _id: 'token-1' }, { _id: 'token-2' }],
      accounts: ['0xAddress1', '0xAddress2'],
    },
  },
});
```

## Result

### Refresh Tokens

The result contains the created `UPDATE_TOKEN_OWNERSHIP` work item under `forked` (empty result if there are no tokens).

## Input for UPDATE_TOKEN_OWNERSHIP

| Parameter | Type | Description |
|-----------|------|-------------|
| `filter.tokens` | Array | Token objects to check ownership for |
| `filter.accounts` | Array | Wallet addresses to verify |

## Adapter Details

### REFRESH_TOKENS

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.refresh-tokens` |
| Type | `REFRESH_TOKENS` |
| Auto-Schedule | Every minute |
| Retries | 0 |

### UPDATE_TOKEN_OWNERSHIP

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.update-token-ownership` |
| Type | `UPDATE_TOKEN_OWNERSHIP` |
| External | `true` |

### Source

[worker/update-token-ownership](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/update-token-ownership)

## Related

- [Export Token Worker](./worker-export-token.md)
- [ETH Minter Warehousing Plugin](../warehousing/warehousing-eth-minter.md)
- [Plugins Overview](./)

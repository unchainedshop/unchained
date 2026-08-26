---
sidebar_position: 50
title: Export Token Worker
sidebar_label: Export Token
description: External worker for NFT/token minting and export processes
---

# Export Token Worker

An external worker placeholder for managing NFT/token minting and export processes.

:::info Included in Crypto Preset
Registered automatically by `registerCryptoPlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { ExportTokenPlugin } from '@unchainedshop/plugins/worker/export-token';

pluginRegistry.register(ExportTokenPlugin);
```

## Purpose

The Export Token Worker:

- Acts as a placeholder for external token minting systems
- Tracks the state of token export/minting processes
- Automatically updates token ownership when work completes successfully — the event listener is wired on registration

## How It Works

1. **Create Export Work**: External system creates work with token details
2. **External Processing**: The minting/export happens outside Unchained
3. **Complete Work**: External system marks work as finished via GraphQL
4. **Ownership Update**: Worker automatically updates token ownership in the database

## Usage

### Create Export Work (from external system)

```graphql
mutation CreateExportWork {
  addWork(
    type: EXPORT_TOKEN
    input: {
      token: {
        _id: "token-id"
        contractAddress: "0x..."
        tokenId: "123"
      }
      recipientWalletAddress: "0xRecipientAddress..."
    }
  ) {
    _id
    status
  }
}
```

### Complete Export Work (from external system)

```graphql
mutation CompleteExport {
  finishWork(
    workId: "work-id"
    success: true
    result: {
      transactionHash: "0x...",
      blockNumber: 12345
    }
  ) {
    _id
    status
  }
}
```

## Event Handling

When a work item of type `EXPORT_TOKEN` completes successfully, the worker:

1. Extracts the token ID from `work.input.token._id`
2. Extracts the wallet address from `work.input.recipientWalletAddress`
3. Updates the token ownership in the warehousing module

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.export-token` |
| Type | `EXPORT_TOKEN` |
| External | `true` |
| Source | [worker/export-token](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/worker/export-token) |

## Related

- [Token Ownership Workers](./worker-token-ownership.md)
- [ETH Minter Warehousing Plugin](../warehousing/warehousing-eth-minter.md)
- [External Worker](./worker-external.md)
- [Plugins Overview](./)

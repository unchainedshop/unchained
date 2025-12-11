---
sidebar_position: 40
title: External Worker
sidebar_label: External
description: Placeholder for external workers that interact via GraphQL
---

# External Worker

A placeholder adapter for workers that are processed by external systems and interact with Unchained only via GraphQL.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/worker/external';
```

## Purpose

The External Worker serves as a placeholder for work items that are:
- Processed by systems outside of Unchained
- Updated via GraphQL mutations from external services
- Used to track the state of externally-managed background tasks

This adapter cannot process work internally - it throws an error if `doWork` is called directly. Instead, external systems should:

1. Query for pending work items of type `EXTERNAL`
2. Process the work externally
3. Update the work status via GraphQL

## Usage

Create external work:

```graphql
mutation CreateExternalWork {
  createWork(
    type: "EXTERNAL"
    input: { customData: "any-payload-for-external-system" }
  ) {
    _id
    status
  }
}
```

Mark work as completed from external system:

```graphql
mutation FinishExternalWork {
  finishWork(
    workId: "work-id"
    result: { processed: true }
    success: true
  ) {
    _id
    status
  }
}
```

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.worker-plugin.external` |
| Type | `EXTERNAL` |
| External | `true` |
| Source | [worker/external.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/worker/external.ts) |

## Related

- [Export Token Worker](./worker-export-token.md)
- [Update Token Ownership Worker](./worker-token-ownership.md)
- [Plugins Overview](./)

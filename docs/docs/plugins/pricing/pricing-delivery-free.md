---
sidebar_position: 36
title: Free Delivery Pricing
sidebar_label: Free Delivery
description: Zero-cost delivery pricing adapter
---

# Free Delivery Pricing

A simple delivery pricing adapter that sets delivery fees to zero. Use as a starting point or for delivery methods that don't charge shipping.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { DeliveryFreePricePlugin } from '@unchainedshop/plugins/pricing/free-delivery';

pluginRegistry.register(DeliveryFreePricePlugin);
```

## How It Works

Adds a delivery fee of 0 to the calculation, with no tax implications.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.delivery-free` |
| Version | `1.0.0` |
| Order Index | `0` |
| Source | [pricing/free-delivery](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/pricing/free-delivery) |

## Related

- [Delivery Swiss Tax](./pricing-delivery-swiss-tax.md) - Add Swiss VAT to delivery
- [Delivery Pricing](../../extend/pricing/delivery-pricing.md) - Custom delivery pricing

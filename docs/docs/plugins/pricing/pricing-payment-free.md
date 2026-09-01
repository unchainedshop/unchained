---
sidebar_position: 38
title: Free Payment Pricing
sidebar_label: Free Payment
description: Zero-cost payment pricing adapter
---

# Free Payment Pricing

A simple payment pricing adapter that sets payment fees to zero. Use as a starting point or for payment methods without processing fees.

:::info Included in Base Preset
Registered automatically by `registerBasePlugins()` / `registerAllPlugins()`.
:::

## Registration

```typescript
import { pluginRegistry } from '@unchainedshop/core';
import { PaymentFreePricePlugin } from '@unchainedshop/plugins/pricing/free-payment';

pluginRegistry.register(PaymentFreePricePlugin);
```

## How It Works

Adds a payment fee of 0 to the calculation, with no tax implications.

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.payment-free` |
| Version | `1.0.0` |
| Order Index | `0` |
| Source | [pricing/free-payment](https://github.com/unchainedshop/unchained/tree/master/packages/plugins/src/pricing/free-payment) |

## Related

- [Payment Pricing](../../extend/pricing/payment-pricing.md) - Custom payment pricing
- [Invoice Plugin](../payment/invoice.md) - Invoice payment provider

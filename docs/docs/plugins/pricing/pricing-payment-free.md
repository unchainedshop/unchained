---
sidebar_position: 38
title: Free Payment Pricing
sidebar_label: Free Payment
description: Zero-cost payment pricing adapter
---

# Free Payment Pricing

A simple payment pricing adapter that sets payment fees to zero. Use as a starting point or for payment methods without processing fees.

:::info Included in Base Preset
This plugin is part of the `base` preset and loaded automatically. Using the base preset is strongly recommended, so explicit installation is usually not required.
:::

## Installation

```typescript
import '@unchainedshop/plugins/pricing/free-payment';
```

## How It Works

Adds a payment fee of 0 to the calculation, with no tax implications.

## Use Cases

- Invoice payments (no processing fee)
- Bank transfers
- Cash on delivery
- Development and testing

## Adapter Details

| Property | Value |
|----------|-------|
| Key | `shop.unchained.pricing.payment-free` |
| Version | `1.0.0` |
| Order Index | `0` |
| Source | [pricing/free-payment.ts](https://github.com/unchainedshop/unchained/blob/master/packages/plugins/src/pricing/free-payment.ts) |

## Related

- [Payment Pricing](../../extend/pricing/payment-pricing.md) - Custom payment pricing
- [Invoice Plugin](../payment/invoice.md) - Invoice payment provider

---
sidebar_position: 3
title: Pricing Plugins
sidebar_label: Pricing
description: Pricing calculation plugins for Unchained Engine
---

# Pricing Plugins

Pricing plugins calculate prices at different levels of the order. They run in a chain based on their `orderIndex`, with lower values running first.

## Product Pricing

Calculate prices when products are queried or added to cart.

| Adapter Key | Order | Description |
|-------------|-------|-------------|
| [`shop.unchained.pricing.product-price`](./pricing-product-catalog-price.md) | 0 | Base catalog price |
| [`shop.unchained.pricing.product-price-options`](./pricing-product-catalog-price-options.md) | 1 | Add-on option prices |
| [`shop.unchained.pricing.rate-conversion`](./pricing-product-rate-conversion.md) | 10 | Currency conversion |
| [`shop.unchained.pricing.product-discount`](./pricing-product-discount.md) | 30 | Apply discounts |
| [`shop.unchained.pricing.product-swiss-tax`](./pricing-product-swiss-tax.md) | 80 | Swiss VAT |
| [`shop.unchained.pricing.product-round`](./pricing-product-round.md) | 90 | Round prices |

## Delivery Pricing

Calculate shipping and handling fees.

| Adapter Key | Order | Description |
|-------------|-------|-------------|
| [`shop.unchained.pricing.delivery-free`](./pricing-delivery-free.md) | 0 | Zero-cost delivery |
| [`shop.unchained.pricing.delivery-swiss-tax`](./pricing-delivery-swiss-tax.md) | 80 | Swiss VAT on delivery |

## Payment Pricing

Calculate payment processing fees.

| Adapter Key | Order | Description |
|-------------|-------|-------------|
| [`shop.unchained.pricing.payment-free`](./pricing-payment-free.md) | 0 | Zero-cost payment |

## Order Pricing

Aggregate prices into order totals.

| Adapter Key | Order | Description |
|-------------|-------|-------------|
| [`shop.unchained.pricing.order-items`](./pricing-order-items.md) | 0 | Sum product totals |
| [`shop.unchained.pricing.order-delivery`](./pricing-order-delivery.md) | 10 | Add delivery fees |
| [`shop.unchained.pricing.order-payment`](./pricing-order-payment.md) | 10 | Add payment fees |
| [`shop.unchained.pricing.order-items-discount`](./pricing-order-items-discount.md) | 30 | Items-only discounts |
| [`shop.unchained.pricing.order-discount`](./pricing-order-discount.md) | 40 | Full order discounts |
| [`shop.unchained.pricing.order-round`](./pricing-order-round.md) | 90 | Round order totals |

## Discount Adapters

Define discount rules and coupon codes.

| Adapter Key | Description |
|-------------|-------------|
| [`shop.unchained.discount.100-off`](./pricing-discount-100-off.md) | 100 CHF off coupon |
| [`shop.unchained.discount.half-price`](./pricing-discount-half-price.md) | Auto 50% for tagged users |
| [`shop.unchained.discount.half-price-manual`](./pricing-discount-half-price-manual.md) | 50% off coupon |

## Creating Custom Pricing Plugins

See [Product Pricing](../../extend/pricing/product-pricing.md), [Delivery Pricing](../../extend/pricing/delivery-pricing.md), [Payment Pricing](../../extend/pricing/payment-pricing.md), and [Order Discounts](../../extend/pricing/order-discounts.md) for creating custom pricing adapters.

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

| Adapter Key | Order | Description | When to Use |
|-------------|-------|-------------|-------------|
| [`shop.unchained.pricing.product-price`](./pricing-product-catalog-price.md) | 0 | Base catalog price | Always — provides the base price from the product catalog |
| [`shop.unchained.pricing.product-price-options`](./pricing-product-catalog-price-options.md) | 1 | Add-on option prices | When products have configurable options with price modifiers |
| [`shop.unchained.pricing.rate-conversion`](./pricing-product-rate-conversion.md) | 10 | Currency conversion | When selling in multiple currencies |
| [`shop.unchained.pricing.product-discount`](./pricing-product-discount.md) | 30 | Apply discounts | When using product-level discount rules or coupons |
| [`shop.unchained.pricing.product-swiss-tax`](./pricing-product-swiss-tax.md) | 80 | Swiss VAT | Swiss shops requiring 8.1% / 2.6% VAT calculation |
| [`shop.unchained.pricing.product-round`](./pricing-product-round.md) | 90 | Round prices | When prices must be rounded to 0.05 (Swiss rounding) |

## Delivery Pricing

Calculate shipping and handling fees.

| Adapter Key | Order | Description | When to Use |
|-------------|-------|-------------|-------------|
| [`shop.unchained.pricing.delivery-free`](./pricing-delivery-free.md) | 0 | Zero-cost delivery | Default — sets delivery cost to zero, replace with custom adapter for fees |
| [`shop.unchained.pricing.delivery-swiss-tax`](./pricing-delivery-swiss-tax.md) | 80 | Swiss VAT on delivery | Swiss shops requiring VAT on shipping fees |

## Payment Pricing

Calculate payment processing fees.

| Adapter Key | Order | Description | When to Use |
|-------------|-------|-------------|-------------|
| [`shop.unchained.pricing.payment-free`](./pricing-payment-free.md) | 0 | Zero-cost payment | Default — sets payment fee to zero, replace with custom adapter for surcharges |

## Order Pricing

Aggregate prices into order totals.

| Adapter Key | Order | Description | When to Use |
|-------------|-------|-------------|-------------|
| [`shop.unchained.pricing.order-items`](./pricing-order-items.md) | 0 | Sum product totals | Always — aggregates product line items into order total |
| [`shop.unchained.pricing.order-delivery`](./pricing-order-delivery.md) | 10 | Add delivery fees | Always — adds delivery costs to order total |
| [`shop.unchained.pricing.order-payment`](./pricing-order-payment.md) | 10 | Add payment fees | Always — adds payment surcharges to order total |
| [`shop.unchained.pricing.order-items-discount`](./pricing-order-items-discount.md) | 30 | Items-only discounts | When applying discounts that only affect product line items |
| [`shop.unchained.pricing.order-discount`](./pricing-order-discount.md) | 40 | Full order discounts | When applying discounts across the entire order total |
| [`shop.unchained.pricing.order-round`](./pricing-order-round.md) | 90 | Round order totals | When final order totals need rounding (Swiss 0.05 rounding) |

## Discount Adapters

Define discount rules and coupon codes.

| Adapter Key | Description |
|-------------|-------------|
| [`shop.unchained.discount.100-off`](./pricing-discount-100-off.md) | 100 CHF off coupon |
| [`shop.unchained.discount.half-price`](./pricing-discount-half-price.md) | Auto 50% for tagged users |
| [`shop.unchained.discount.half-price-manual`](./pricing-discount-half-price-manual.md) | 50% off coupon |

## Creating Custom Pricing Plugins

See [Product Pricing](../../extend/pricing/product-pricing.md), [Delivery Pricing](../../extend/pricing/delivery-pricing.md), [Payment Pricing](../../extend/pricing/payment-pricing.md), and [Order Discounts](../../extend/pricing/order-discounts.md) for creating custom pricing adapters.

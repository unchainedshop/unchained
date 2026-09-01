---
sidebar_position: 9
title: Enrollment Plugins
sidebar_label: Enrollments
description: Subscription and enrollment plugins for Unchained Engine
---

# Enrollment Plugins

Enrollment plugins handle subscription-based products and recurring orders.

| Adapter Key | Description | Preset |
|-------------|-------------|--------|
| [`shop.unchained.enrollments.licensed`](./enrollment-licensed.md) | Licensed subscription with period-based access | `base` |

## How Enrollments Work

1. Customer purchases a subscription product (`PLAN_PRODUCT`)
2. An enrollment is created linking the customer to the product
3. The enrollment adapter determines billing periods
4. Orders are automatically generated for each period
5. Access is granted based on active periods

## Key Concepts

### Enrollment Status

| Status | Description |
|--------|-------------|
| `INITIAL` | Enrollment created but not yet active |
| `ACTIVE` | Subscription is active |
| `PAUSED` | Paused because of overdue payments |
| `TERMINATED` | Permanently ended |

### Periods

Each enrollment tracks periods which represent billing cycles: `start`, `end`, `isTrial`, and the `orderId` of the order generated for the period.

## Creating Custom Enrollment Plugins

See [Custom Enrollment Plugins](../../extend/enrollment.md) for creating your own enrollment adapters.

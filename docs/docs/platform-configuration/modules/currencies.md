---
sidebar_position: 15
title: Currencies Module
sidebar_label: Currencies
description: Currency configuration and management
---

# Currencies Module

The currencies module manages supported currencies for pricing and transactions.

## Configuration Options

The currencies module has no configuration options.

## Module API

Access via `modules.currencies` in the Unchained API context.

### Queries

| Method | Arguments | Description |
|--------|-----------|-------------|
| `findCurrency` | `{ isoCode? \| currencyId? }` | Find currency by ISO code or ID |
| `findCurrencies` | `{ limit?, offset?, sort?, ...query }` | List currencies with pagination |
| `count` | `query` | Count currencies matching criteria |
| `currencyExists` | `{ currencyId }` | Check if currency exists |

### Mutations

| Method | Arguments | Description |
|--------|-----------|-------------|
| `create` | `doc` | Create a new currency |
| `update` | `currencyId, doc` | Update currency |
| `delete` | `currencyId` | Delete currency |

### Usage

```typescript
// Find a currency
const chf = await modules.currencies.findCurrency({ isoCode: 'CHF' });

// List active currencies
const currencies = await modules.currencies.findCurrencies({
  includeInactive: false,
});

// Create a new currency
await modules.currencies.create({
  isoCode: 'EUR',
  isActive: true,
});
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `CURRENCY_CREATE` | `{ currencyId }` | Emitted when a currency is created |
| `CURRENCY_UPDATE` | `{ currencyId }` | Emitted when a currency is updated |
| `CURRENCY_REMOVE` | `{ currencyId }` | Emitted when a currency is removed |

## Related

- [Multi-Currency Setup](../../guides/multi-currency-setup.md) - Multi-currency guide
- [Pricing System](../../concepts/pricing-system.md) - How pricing works

---
sidebar_position: 13
title: Seed Data
sidebar_label: Seed Data
description: Bootstrap a fresh Unchained Engine instance with initial data
---

# Seed Data

When starting a fresh Unchained Engine instance, you need to seed it with initial data such as an admin user, languages, currencies, and countries.

## Seed Function Pattern

Create a seed function that receives the `UnchainedCore` API and provisions essential data:

```typescript
import { UnchainedCore } from '@unchainedshop/core';

export default async function seed(unchainedAPI: UnchainedCore) {
  const { modules } = unchainedAPI;

  // Skip if already seeded
  const adminCount = await modules.users.count({ username: 'admin' });
  if (adminCount > 0) return;

  // Seed data here...
}
```

Call the seed function after platform startup:

```typescript
import { startPlatform } from '@unchainedshop/platform';
import seed from './seed.ts';

const platform = await startPlatform({ modules: defaultModules });
await seed(platform.unchainedAPI);
```

## Essential Seed Data

### 1. Admin User

```typescript
const adminPassword = process.env.UNCHAINED_SEED_PASSWORD || crypto.randomUUID();

await modules.users.createUser(
  {
    email: 'admin@unchained.local',
    guest: false,
    initialPassword: true,
    password: modules.users.hashPassword(adminPassword),
    profile: { address: {} },
    roles: ['admin'],
    username: 'admin',
  },
  { skipMessaging: true },
);

console.log(`Admin password: ${adminPassword}`);
```

### 2. Languages

```typescript
const language = process.env.UNCHAINED_LANG || 'de';

await modules.languages.create({
  isoCode: language,
  isActive: true,
});
```

### 3. Currencies

```typescript
const currency = process.env.UNCHAINED_CURRENCY || 'CHF';

await modules.currencies.create({
  isoCode: currency,
  isActive: true,
});
```

### 4. Countries

```typescript
const country = process.env.UNCHAINED_COUNTRY || 'CH';

await modules.countries.create({
  isoCode: country,
  isActive: true,
  defaultCurrencyCode: currency,
});
```

### 5. Payment Provider

```typescript
await modules.payment.paymentProviders.create({
  adapterKey: 'shop.unchained.invoice',
  type: 'INVOICE',
  configuration: [],
});
```

### 6. Delivery Provider

```typescript
await modules.delivery.create({
  adapterKey: 'shop.unchained.delivery.send-message',
  type: 'SHIPPING',
  configuration: [
    { key: 'from', value: process.env.EMAIL_FROM || 'noreply@localhost' },
    { key: 'to', value: process.env.UNCHAINED_MAIL_RECIPIENT || 'orders@localhost' },
  ],
});
```

## Complete Seed Example

```typescript
import { UnchainedCore } from '@unchainedshop/core';
import crypto from 'node:crypto';

export default async function seed(unchainedAPI: UnchainedCore) {
  const { modules } = unchainedAPI;

  const adminCount = await modules.users.count({ username: 'admin' });
  if (adminCount > 0) return;

  const password = process.env.UNCHAINED_SEED_PASSWORD || crypto.randomUUID();
  const lang = process.env.UNCHAINED_LANG || 'en';
  const currency = process.env.UNCHAINED_CURRENCY || 'CHF';
  const country = process.env.UNCHAINED_COUNTRY || 'CH';

  // Admin user
  await modules.users.createUser(
    {
      email: 'admin@unchained.local',
      guest: false,
      initialPassword: true,
      password: modules.users.hashPassword(password),
      profile: { address: {} },
      roles: ['admin'],
      username: 'admin',
    },
    { skipMessaging: true },
  );

  // Localization
  await modules.languages.create({ isoCode: lang, isActive: true });
  await modules.currencies.create({ isoCode: currency, isActive: true });
  await modules.countries.create({
    isoCode: country,
    isActive: true,
    defaultCurrencyCode: currency,
  });

  // Payment & Delivery
  await modules.payment.paymentProviders.create({
    adapterKey: 'shop.unchained.invoice',
    type: 'INVOICE',
    configuration: [],
  });

  await modules.delivery.create({
    adapterKey: 'shop.unchained.delivery.send-message',
    type: 'SHIPPING',
    configuration: [
      { key: 'from', value: process.env.EMAIL_FROM || 'noreply@localhost' },
      { key: 'to', value: process.env.UNCHAINED_MAIL_RECIPIENT || 'orders@localhost' },
    ],
  });

  console.log(`Seeded admin user with password: ${password}`);
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `UNCHAINED_SEED_PASSWORD` | Random UUID | Admin user password |
| `UNCHAINED_LANG` | `de` | Default language ISO code |
| `UNCHAINED_CURRENCY` | `CHF` | Default currency ISO code |
| `UNCHAINED_COUNTRY` | `CH` | Default country ISO code |
| `EMAIL_FROM` | `noreply@localhost` | Delivery notification sender |
| `UNCHAINED_MAIL_RECIPIENT` | `orders@localhost` | Delivery notification recipient |

## Idempotency

Always check if data exists before seeding. The seed function should be safe to run multiple times:

```typescript
const adminCount = await modules.users.count({ username: 'admin' });
if (adminCount > 0) return;
```

## Related

- [Quick Start](../quick-start/index.md) - Getting started
- [Environment Variables](../platform-configuration/environment-variables.md) - All configuration
- [Multi-Language Setup](./multi-language-setup.md) - Multi-language support
- [Multi-Currency Setup](./multi-currency-setup.md) - Multi-currency support

---
sidebar_position: 14
title: Countries Module
sidebar_label: Countries
description: Country configuration and management
---

# Countries Module

The countries module manages supported countries for shipping, billing, and localization.

## Configuration Options

The countries module has no configuration options.

## Module API

Access via `modules.countries` in the Unchained API context.

### Queries

| Method | Arguments | Description |
|--------|-----------|-------------|
| `findCountry` | `{ countryId? \| isoCode? }` | Find country by ID or ISO code |
| `findCountries` | `{ limit?, offset?, sort?, ...query }` | List countries with pagination |
| `count` | `query` | Count countries matching criteria |
| `countryExists` | `{ countryId }` | Check if country exists |
| `name` | `country, locale` | Get localized country name |
| `flagEmoji` | `country` | Get country flag emoji |
| `isBase` | `country` | Check if this is the default country |

### Mutations

| Method | Arguments | Description |
|--------|-----------|-------------|
| `create` | `doc` | Create a new country |
| `update` | `countryId, doc` | Update country |
| `delete` | `countryId` | Delete country |

### Usage

```typescript
// Find a country by ISO code
const country = await modules.countries.findCountry({ isoCode: 'CH' });

// Get localized name
const name = modules.countries.name(country, 'en'); // "Switzerland"

// Get flag emoji
const flag = modules.countries.flagEmoji(country); // "🇨🇭"

// List all active countries
const countries = await modules.countries.findCountries({
  includeInactive: false,
});
```

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `COUNTRY_CREATE` | `{ countryId }` | Emitted when a country is created |
| `COUNTRY_UPDATE` | `{ countryId }` | Emitted when a country is updated |
| `COUNTRY_REMOVE` | `{ countryId }` | Emitted when a country is removed |

## Related

- [Multi-Language Setup](../../guides/multi-language-setup.md) - Localization guide
- [Seed Data](../../guides/seed-data.md) - Bootstrap countries

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

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `COUNTRY_CREATE` | `{ countryId }` | Emitted when a country is created |
| `COUNTRY_UPDATE` | `{ countryId }` | Emitted when a country is updated |
| `COUNTRY_REMOVE` | `{ countryId }` | Emitted when a country is removed |

## More Information

For API usage and detailed documentation, see the [core-countries package on GitHub](https://github.com/unchainedshop/unchained/tree/master/packages/core-countries).

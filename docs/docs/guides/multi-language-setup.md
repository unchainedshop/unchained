---
sidebar_position: 6
title: Multi-Language Setup
sidebar_label: Multi-Language Setup
description: Configure multiple languages in Unchained Engine
---

# Multi-Language Setup

This guide covers configuring multiple languages and implementing i18n in your Unchained Engine storefront.

## Overview

Unchained Engine stores translations for entities like products, assortments, and filters using a locale-based system:

```
Product
  └── texts: [
        { locale: 'en', title: 'T-Shirt', description: '...' },
        { locale: 'de', title: 'T-Shirt', description: '...' },
        { locale: 'fr', title: 'T-Shirt', description: '...' }
      ]
```

## Configuration

### 1. Set Up Languages

Create languages via GraphQL:

```graphql
mutation CreateLanguage {
  createLanguage(language: {
    isoCode: "de"
  }) {
    _id
    isoCode
    isActive
  }
}
```

Or seed them at startup:

```typescript
// In your boot script, after startPlatform()
for (const isoCode of ['en', 'de', 'fr']) {
  await platform.unchainedAPI.modules.languages.create({ isoCode, isActive: true });
}
```

### 2. Set Up Countries

Locale resolution combines languages with countries (e.g. `de` + `CH` → `de-CH`), so create at least one country:

```graphql
mutation CreateCountry {
  createCountry(country: {
    isoCode: "CH"
  }) {
    _id
    isoCode
  }
}
```

### 3. Fallback Locale

The environment variables `UNCHAINED_LANG` and `UNCHAINED_COUNTRY` (defaults: `de`, `CH`) define the system locale. It is used as the fallback when a request's `Accept-Language` header doesn't match any active language, and the seed scripts of the example projects use it to decide which language, country, and currency to create. It does **not** override the request's `Accept-Language` header.

## Adding Translations

### Product Translations

```graphql
mutation UpdateProductTexts {
  updateProductTexts(productId: "product-123", texts: [
    {
      locale: "en"
      title: "Organic Cotton T-Shirt"
      subtitle: "Comfortable everyday wear"
      description: "Made from 100% organic cotton..."
      slug: "organic-cotton-t-shirt"
    }
    {
      locale: "de"
      title: "Bio-Baumwoll T-Shirt"
      subtitle: "Bequeme Alltagskleidung"
      description: "Hergestellt aus 100% Bio-Baumwolle..."
      slug: "bio-baumwoll-t-shirt"
    }
    {
      locale: "fr"
      title: "T-Shirt en Coton Bio"
      subtitle: "Vêtement de tous les jours confortable"
      description: "Fabriqué à partir de 100% coton bio..."
      slug: "t-shirt-coton-bio"
    }
  ]) {
    locale
    title
    slug
  }
}
```

### Assortment Translations

```graphql
mutation UpdateAssortmentTexts {
  updateAssortmentTexts(assortmentId: "assortment-123", texts: [
    { locale: "en", title: "Men's Clothing", slug: "mens-clothing" }
    { locale: "de", title: "Herrenbekleidung", slug: "herrenbekleidung" }
    { locale: "fr", title: "Vêtements Homme", slug: "vetements-homme" }
  ]) {
    locale
    title
    slug
  }
}
```

### Filter Translations

```graphql
mutation UpdateFilterTexts {
  updateFilterTexts(filterId: "filter-123", filterOptionValue: null, texts: [
    { locale: "en", title: "Size" }
    { locale: "de", title: "Größe" }
    { locale: "fr", title: "Taille" }
  ]) {
    locale
    title
  }
}
```

## Querying Translations

### Automatic Locale Resolution

Unchained resolves the `texts` field based on the request locale:

```graphql
# Request headers: Accept-Language: de
query {
  product(productId: "...") {
    texts {
      title  # Returns German title if available
      description
    }
  }
}
```

### Explicit Locale

Every `texts` field accepts a `forceLocale` argument (a locale string like `"en"` or `"de-CH"`), which you can combine with aliases to fetch several translations at once:

```graphql
query {
  product(productId: "...") {
    texts {
      locale
      title
    }
    germanTexts: texts(forceLocale: "de") {
      title
    }
  }
}
```

## Server-Side Language Resolution

Resolution happens per request in `getLocaleContext` ([`packages/api/src/locale-context.ts`](https://github.com/unchainedshop/unchained/blob/master/packages/api/src/locale-context.ts)):

1. The set of supported locales is built as the cross product of **active languages × active countries** (e.g. `de-CH`, `en-CH`). An `x-shop-country` request header restricts the country.
2. The `Accept-Language` header is parsed (quality-ordered) and matched against the supported locales — exact match first, then language-only (`de` matches `de-CH`).
3. If nothing matches, the fallback locale applies: the system locale from `UNCHAINED_LANG`/`UNCHAINED_COUNTRY` if those are active, otherwise the first active language/country.

The resolved locale (and the derived country/currency) is memoized for 60 seconds per `Accept-Language`/`x-shop-country` combination in production.

For the frontend this means: **send the `Accept-Language` header with every GraphQL request** to switch languages — no other client plumbing required. Fetch selectable languages via:

```graphql
query Languages {
  languages(includeInactive: false) {
    _id
    isoCode
    name
  }
}
```

## Bulk Import with Translations

Bulk import events carry translations as a `content` map keyed by locale:

```json
{
  "entity": "PRODUCT",
  "operation": "CREATE",
  "payload": {
    "_id": "product-123",
    "specification": {
      "type": "SIMPLE_PRODUCT",
      "content": {
        "en": { "title": "T-Shirt", "slug": "t-shirt" },
        "de": { "title": "T-Shirt", "slug": "t-shirt-de" }
      }
    }
  }
}
```

See [Bulk Import](./bulk-import) for the full event format and how to submit events.

## Best Practices

- **Always provide a fallback language** — ensure one language (typically English) has complete translations, and handle missing `texts` gracefully in the frontend.
- **Use locale-specific slugs** — `/en/products/organic-t-shirt` vs `/de/products/bio-t-shirt` for SEO-friendly URLs; `product(slug: ...)` resolves slugs across locales.

## Related

- [Languages Module](../platform-configuration/modules/languages) - Language configuration
- [Multi-Currency Setup](./multi-currency-setup) - Currency configuration
- [Bulk Import](./bulk-import) - Importing translations

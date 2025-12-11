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

Create languages in the system:

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

Or seed languages at startup:

```typescript
// seed/languages.ts
export const languages = [
  { isoCode: 'en', isActive: true },
  { isoCode: 'de', isActive: true },
  { isoCode: 'fr', isActive: true },
  { isoCode: 'it', isActive: false }, // Inactive
];

// In your boot script
for (const lang of languages) {
  await modules.languages.create(lang);
}
```

### 2. Configure Default Language

Set the default language via environment variable:

```bash
# .env
LANG=de  # Default language
```

### 3. Set Up Countries

Link countries to languages:

```graphql
mutation CreateCountry {
  createCountry(country: {
    isoCode: "CH"
  }) {
    _id
    isoCode
    defaultCurrency {
      isoCode
    }
  }
}
```

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

Unchained automatically resolves the `texts` field based on the request locale:

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

Query all translations:

```graphql
query {
  product(productId: "...") {
    texts(forceLocale: "en") {
      title
    }
  }
}
```

### All Translations

Get all available translations:

```graphql
query {
  product(productId: "...") {
    # Default (resolved)
    texts {
      locale
      title
    }
    # Specific locale
    germanTexts: texts(forceLocale: "de") {
      title
    }
  }
}
```

## Frontend Implementation

### Language Switcher

```tsx
import { useQuery, useMutation } from '@apollo/client';

const LANGUAGES = gql`
  query Languages {
    languages(includeInactive: false) {
      _id
      isoCode
      name
    }
  }
`;

function LanguageSwitcher() {
  const { data } = useQuery(LANGUAGES);
  const [currentLocale, setCurrentLocale] = useState('en');

  const handleChange = (locale: string) => {
    // Update cookie/localStorage
    document.cookie = `locale=${locale}; path=/`;

    // Update Apollo client headers
    apolloClient.setLink(
      authLink.concat(
        createHttpLink({
          uri: GRAPHQL_URL,
          headers: {
            'Accept-Language': locale,
          },
        })
      )
    );

    // Refetch queries
    apolloClient.resetStore();

    setCurrentLocale(locale);
  };

  return (
    <select value={currentLocale} onChange={(e) => handleChange(e.target.value)}>
      {data?.languages.map((lang) => (
        <option key={lang.isoCode} value={lang.isoCode}>
          {lang.name || lang.isoCode.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
```

### Next.js i18n Integration

```typescript
// next.config.js
module.exports = {
  i18n: {
    locales: ['en', 'de', 'fr'],
    defaultLocale: 'en',
  },
};
```

```tsx
// pages/products/[slug].tsx
import { useRouter } from 'next/router';
import { useQuery } from '@apollo/client';

export default function ProductPage() {
  const { locale } = useRouter();

  const { data } = useQuery(PRODUCT_QUERY, {
    context: {
      headers: {
        'Accept-Language': locale,
      },
    },
  });

  return (
    <div>
      <h1>{data?.product?.texts?.title}</h1>
      <p>{data?.product?.texts?.description}</p>
    </div>
  );
}
```

### Apollo Client Setup for i18n

```typescript
// lib/apollo-client.ts
import { ApolloClient, createHttpLink, InMemoryCache } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

export function createApolloClient(locale: string) {
  const httpLink = createHttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  });

  const localeLink = setContext((_, { headers }) => ({
    headers: {
      ...headers,
      'Accept-Language': locale,
    },
  }));

  return new ApolloClient({
    link: localeLink.concat(httpLink),
    cache: new InMemoryCache(),
  });
}
```

## Server-Side Language Resolution

Unchained resolves the locale automatically from the `Accept-Language` HTTP header. The locale is available in the GraphQL context and affects how `texts` fields are resolved.

The resolution order is:
1. `Accept-Language` header from the request
2. Default language from the `LANG` environment variable
3. Fallback to `en`

## Bulk Import with Translations

```typescript
await modules.bulkImporter.prepare({
  entity: 'PRODUCT',
  data: {
    _id: 'product-123',
    type: 'SIMPLE',
    texts: [
      { locale: 'en', title: 'T-Shirt', slug: 't-shirt' },
      { locale: 'de', title: 'T-Shirt', slug: 't-shirt-de' },
    ],
    // ... other fields
  },
});
```

## Admin UI Translations

The Admin UI supports language management:

1. Go to **Settings > Languages**
2. Add/edit languages
3. Go to any entity (Products, Assortments)
4. Use the locale switcher to edit translations

## Best Practices

### 1. Always Provide Fallback

Ensure at least one language (typically English) has complete translations:

```graphql
mutation {
  updateProductTexts(productId: "...", texts: [
    { locale: "en", title: "Fallback Title" }  # Always provide
    { locale: "de", title: "German Title" }     # Optional
  ]) {
    locale
    title
  }
}
```

### 2. Use Slugs Per Locale

Different slugs allow for SEO-friendly URLs:

```
/en/products/organic-t-shirt
/de/products/bio-t-shirt
/fr/products/t-shirt-bio
```

### 3. Handle Missing Translations

```tsx
function ProductTitle({ product }) {
  const title = product.texts?.title;

  if (!title) {
    // Fallback to product ID or show placeholder
    return <span className="untranslated">{product._id}</span>;
  }

  return <h1>{title}</h1>;
}
```

### 4. Validate Translations

Check for missing translations:

```graphql
query ProductsWithMissingTranslations {
  products {
    _id
    texts {
      locale
      title
    }
  }
}
```

```typescript
// Find products missing German translations
const missingDE = products.filter(
  (p) => !p.texts.some((t) => t.locale === 'de')
);
```

## Related

- [Languages Module](../platform-configuration/modules/languages) - Language configuration
- [Multi-Currency Setup](./multi-currency-setup) - Currency configuration
- [Bulk Import](./bulk-import) - Importing translations

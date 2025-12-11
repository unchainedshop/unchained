---
sidebar_position: 4
title: Create Your First Product
sidebar_label: Your First Product
---

# Create Your First Product

This guide walks you through creating and configuring your first product in Unchained Engine.

## Prerequisites

- Unchained Engine running locally (see [Initialize and Run](./run-local))
- Admin UI accessible at http://localhost:4010

## Using the Admin UI

The easiest way to create products is through the Admin UI.

### 1. Navigate to Products

1. Open http://localhost:4010
2. Log in with your admin credentials
3. Click **Products** in the sidebar

### 2. Create a Simple Product

1. Click **Create Product**
2. Select **Simple Product** as the type
3. Fill in the basic information:
   - **Title**: "Organic Cotton T-Shirt"
   - **Subtitle**: "Comfortable everyday wear"
   - **Description**: "Made from 100% organic cotton..."

### 3. Set the Price

1. Go to the **Commerce** tab
2. Click **Add Price**
3. Set:
   - **Currency**: CHF (or your default currency)
   - **Amount**: 49.00
   - **Taxable**: Yes
   - **Net Price**: Yes

### 4. Add Media (Optional)

1. Go to the **Media** tab
2. Click **Upload**
3. Select your product image

### 5. Publish the Product

1. Change **Status** from "Draft" to "Active"
2. Click **Save**

Your product is now visible in the storefront!

## Using GraphQL

For programmatic product creation, use the GraphQL API.

### Create Product

```graphql
mutation CreateProduct {
  createProduct(product: {
    type: SIMPLE_PRODUCT
    tags: ["clothing", "cotton", "organic"]
  }) {
    _id
    status
  }
}
```

### Add Translations

```graphql
mutation AddProductTexts {
  updateProductTexts(productId: "your-product-id", texts: [
    {
      locale: "en"
      title: "Organic Cotton T-Shirt"
      subtitle: "Comfortable everyday wear"
      description: "Made from 100% organic cotton, this t-shirt is perfect for everyday wear. Soft, breathable, and sustainably sourced."
      slug: "organic-cotton-t-shirt"
    }
    {
      locale: "de"
      title: "Bio-Baumwoll T-Shirt"
      subtitle: "Bequeme Alltagskleidung"
      description: "Aus 100% Bio-Baumwolle, dieses T-Shirt ist perfekt für den Alltag. Weich, atmungsaktiv und nachhaltig beschafft."
      slug: "bio-baumwoll-t-shirt"
    }
  ]) {
    _id
  }
}
```

### Set Pricing

Use `updateProductCommerce` to add prices to your product:

```graphql
mutation SetProductPricing {
  updateProductCommerce(productId: "your-product-id", commerce: {
    pricing: [
      {
        currencyCode: "CHF"
        countryCode: "CH"
        amount: 4900
        isTaxable: true
        isNetPrice: true
      },
      {
        currencyCode: "EUR"
        countryCode: "DE"
        amount: 4500
        isTaxable: true
        isNetPrice: true
      }
    ]
  }) {
    _id
  }
}
```

### Publish Product

```graphql
mutation PublishProduct {
  publishProduct(productId: "your-product-id") {
    _id
    status
    published
  }
}
```

## Product Types

Unchained supports several product types:

| Type | Description | Use Case |
|------|-------------|----------|
| `SIMPLE_PRODUCT` | Basic product with price | Physical goods, digital downloads |
| `CONFIGURABLE_PRODUCT` | Product with variations | Clothing sizes, colors |
| `BUNDLE_PRODUCT` | Collection of products | Gift sets, starter kits |
| `PLAN_PRODUCT` | Subscription product | Memberships, recurring services |
| `TOKENIZED_PRODUCT` | NFT/token-backed product | Digital collectibles |

### Configurable Product Example

```graphql
mutation CreateConfigurableProduct {
  createProduct(product: {
    type: CONFIGURABLE_PRODUCT
    tags: ["clothing"]
  }) {
    _id
  }
}

# Note: Variations are managed through product assignments and vectors.
# The variations field is not directly settable on updateProduct.
# Instead, you define variation options on child products and link them
# to the parent configurable product using addProductAssignment with vectors.

# Link variant products
mutation LinkVariant {
  addProductAssignment(proxyId: "configurable-id", productId: "simple-variant-id", vectors: [
    { key: "size", value: "M" }
    { key: "color", value: "black" }
  ]) {
    _id
  }
}
```

## Adding to an Assortment

Products can be organized into assortments (categories):

```graphql
# Create assortment first
mutation CreateAssortment {
  createAssortment(assortment: {
    isRoot: true
    tags: ["main-nav"]
    # Note: isActive is not available on CreateAssortmentInput.
    # Set the status after creation using separate mutations if needed.
  }) {
    _id
  }
}

# Add texts
mutation AddAssortmentTexts {
  updateAssortmentTexts(assortmentId: "assortment-id", texts: [
    { locale: "en", title: "Clothing", slug: "clothing" }
  ]) {
    _id
  }
}

# Link product to assortment
mutation AddProductToAssortment {
  addAssortmentProduct(assortmentId: "assortment-id", productId: "product-id") {
    _id
  }
}
```

## Verify in Storefront

After creating your product:

1. Open http://localhost:3000
2. Your product should appear in the product list
3. Click on it to view the product detail page
4. Verify the price and description are correct

## Common Issues

### Product Not Visible

- Check that status is "Active" (not "Draft")
- Ensure at least one price is set
- Verify product is assigned to an assortment (if your storefront filters by category)

### Price Not Showing

- Confirm the currency matches your storefront's default
- Check that `amount` is in cents (4900 for 49.00)

### Images Not Loading

- Ensure the file upload completed successfully
- Check browser console for CORS errors
- Verify the file storage is properly configured

## Next Steps

- [Create Your First Order](./first-order) - Complete the checkout flow
- [Platform Configuration](../platform-configuration/) - Customize your shop
- [Product Module](../platform-configuration/modules/products) - Advanced product settings

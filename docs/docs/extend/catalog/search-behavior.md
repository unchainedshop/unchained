---
sidebar_position: 3
title: Search Behavior
sidebar_label: Search
description: Learn about the search feature
---

# Search Behavior

Unchained allows you to search and filter products and assortments.

### Products Search

There are two ways to search for products in Unchained:

1. **General Search**: Search all products in your system.

   ```graphql
   query searchProducts($queryString: String, $limit: Int) {
     searchProducts(queryString: $queryString, includeInactive: true) {
       products {
         _id
         status
         texts {
           _id
           title
           description
         }
         media(limit: $limit) {
           texts {
             _id
             title
           }
           file {
             _id
             url
             name
           }
         }
       }
     }
   }
   ```

   Options include `orderBy`, `includeInactive`, and `assortmentId`.

2. **Assortment Search**: Search products attached to a specific assortment.
   ```graphql
   query Assortment($assortmentId: ID) {
     assortment(assortmentId: $assortmentId) {
       searchProducts {
         filteredProductsCount
         filters {
           filteredProductsCount
           isSelected
           options {
             filteredProductsCount
             isSelected
           }
         }
         products {
           _id
         }
       }
     }
   }
   ```

### Assortments Search

Similar to the general product search, you can search for assortments:

```graphql
query searchAssortments($queryString: String) {
  searchAssortments(queryString: $queryString, includeInactive: true) {
    assortments {
      _id
      isActive
      texts {
        _id
        title
        description
      }
    }
  }
}
```

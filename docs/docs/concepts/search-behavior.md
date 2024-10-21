---
sidebar_position: 3
title: Search Behavior
sidebar_label: Search
---
# Search Behavior
---
:::
 Learn about the search feature
:::

Unchained provides you with the ability to search and filter products and assortments.

### Products Search

There are two ways to search for products in Unchained, first is a general search which is a common scenario where you'd want to search all products in your system.

```
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
There are multiple options available to further tailor your search result like orderBy, includeInactive, assortmentId.


The second one is Assortment.searchProducts which provides you with the ability to only search the products attach to an assortment.

```
query Assortment($assortmentId: ID) {
            assortment(assortmentId: $assortmentId) {
              ...
              searchProducts {
                filteredProducts
                filters {
                  filteredProducts
                  definition {
                    _id
                  }
                  isSelected
                  options {
                    filteredProducts
                    definition {
                      _id
                    }
                    isSelected
                  }
                }
                products {
                  _id
                }
              }
             ... 
```

### Assortments Search

Just like the products general search there's also a one available for products

```
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
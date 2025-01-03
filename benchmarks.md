Vendure v3.1.1:

* node_modules size: 262M
* initial memory footprint: ~350M x 2 (worker and api)
* startup time: ~3 seconds (including Postgres dev server)

Unchained v3.0.0:

* node_modules size: 258M
* initial memory footprint: ~150M
* startup time: ~1.5 seconds (including MongoDB dev server)


## Fetch 50 Products with Breadcrumbs and Asset (Product List):

Vendure:

```
{
  products(options: { take: 50 }) {
    totalItems
    items {
      id
      name
      description
      collections {
        breadcrumbs {
          name
        }
        name
      }
      assets {
        id
        source
        name
      }
    }
  }
}
```

Result: ~ 115-180ms (uncached)

Unchained:

```
{
  productsCount
  products(limit: 50) {
    _id
    texts {
      _id
      title
      description
    }
    assortmentPaths {
      links {
        assortmentTexts {
          title
        }
      }
    }
    media {
      _id
      file {
        _id
        url
        name
      }
    }
  }
}
```

Result: ~ 30-45ms (uncached)


## Fetch 10 Categories and 2 levels deep sub-categories with title and cover (Mega Menu)


TODO

## Checkout Flow
- Add a product to the cart
- Set billing address
- Checkout via invoice

TODO
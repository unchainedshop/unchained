---
title: "PIM Connector Framework"
description: Import Data from any PIM
---

To upload huge amount of data to Unchained, for example if you pump the data from a PIM or ERP system, we have created a special API.

## Bulk Import API

Using the Bulk API stores the data in the Unchained Work Queue before processing and enables some neat features:

1. Cloud Native: Allows dedicated background or worker instances to do the actual processing
2. Transparent Process: Also stores the result on the work item, making successful and failed imports queryable.
3. Captures Sync issues and reports those with a Status E-Mail to a central E-Mail Address (Sync error reporting)
4. Performance: Only downloads assets that are not downloaded yet and tries to optimize the actual write calls to the database by using MongoDB bulk operations, making sync processing fast
5. Push-based: Immediate representation of changes

In some situations, it's propably wise to develop a sync microservice: You have a source system that
- generates "Pull-based" data feeds, or
- can not adopt to the JSON described below

### Endpoint

The main entry point to send import events is:
Mutation.sendBulkImportEvents. The mutation takes an array of events that consist out of a type, an operation and a payload.

Supported entity types:
- PRODUCT
- ASSORTMENT
- FILTER
- SUBSCRIPTION (coming soon)
- ORDER (coming soon)
- USER (coming soon)
- REVIEWS (coming soon)

Supported operations:
- CREATE
- UPDATE
- REMOVE

All Events follow this JSON Structure:

```json
{
  "entity": "ENTITY TYPE",
  "operation": "OPERATION TYPE",
  "payload": { ... }
}
```

Always try to send as many events at a time, so Unchained can optimize write operations.

The amount of entities you can submit in one file depends on the size of the entity data and your webserver configuration limits, only split it up when you reach that limit at some point or use the streaming API.

```
curl -X POST -H "Authorization: Bearer XXX" -H "content-type: application/json" --data-binary '{ "events": [] }' -f -v http://localhost:4010/bulk-import
```

## JSON Reference

### Entity Type: Product

Set by unchained:
- authorId,
- slug history
- _id, created & updated if not provided

Languages:
- The language code in "content" fields should match an existing Language entity's isoCode in Unchained.

Status:
- You can only use ACTIVE or DRAFT. You have to use the remove operation to set it to DELETED.

```json
{
  "entity": "PRODUCT",
  "operation": "CREATE",
  "payload": {
    "_id": "A",
    "specification": {
      "created": null,
      "updated": null,
      "sequence": "",
      "tags": ["nice"],
      "type": "SimpleProduct",
      "published": "2020-01-01T00:00Z",
      "commerce": {
        "salesUnit": "ST",
        "salesQuantityPerUnit": "1",
        "defaultOrderQuantity": "6",
        "pricing": [
          {
            "isTaxable": true,
            "isNetPrice": true,
            "countryCode": "CH",
            "currencyCode": "CHF",
            "amount": 10000,
            "maxQuantity": null
          }
        ]
      },
      "warehousing": {
        "baseUnit": "ST",
        "sku": "",
        "dimensions": {
          "weightInGram": 0,
          "heightInMillimeters": 0,
          "lengthInMillimeters": 0,
          "widthInMillimeters": 0
        },
      },
      "variationResolvers": [
        {
          "vector": {
            "color": "red"
          },
          "productId": "B"
        }
      ],
      "plan": {
        "billingInterval": "daily",
        "billingIntervalCount": 1,
        "usageCalculationType": "metered",
        "trialInterval": "daily",
        "trialIntervalCount": 1
      },
      "bundleItems": [
        {
          "productId": "c",
          "quantity": 1,
          "configuration": [
            {
              "key": "greeting",
              "value": "For my Darling"
            }
          ]
        }
      ],
      "meta": {},
      "content": {
        "de": {
          "created": null,
          "updated": null,
          "vendor": "Herstellername",
          "brand": "Marke",
          "title": "Produktname",
          "slug": "produktname",
          "subtitle": "Short description",
          "description": "Long description",
          "labels": [
            "Neu"
          ]
        }
      }
    },
    "media": [
      {
        "_id": null,
        "created": null,
        "updated": null,
        "asset": {
          "_id": null,
          "url": "https://www.story.one/media/images/poop-4108423_1920.width-1600.format-jpeg.jpg"
        },
        "tags": ["big"],
        "meta": {},
        "content": {
          "de": {
            "created": null,
            "updated": null,
            "title": "Produktname",
            "subtitle": "Short description",
          }
        }
      }
    ],
    "variations": [
      {
        "_id": null,
        "created": null,
        "updated": null,
        "key": "color",
        "type": "COLOR",
        "options": [
          {
            "value": "ff0000",
            "content": {
              "de": {
                "created": null,
                "updated": null,
                "title": "Rot",
                "subtitle": ""
              }
            }
          }
        ],
        "content": {
          "de": {
            "created": null,
            "updated": null,
            "title": "Farbe",
            "subtitle": "Farbvariante"
          }
        }
      }
    ]
  }
}
```

### Entity Type: Assortment

Set by unchained:
- authorId,
- slug history
- _id, created & updated if not provided

```json
{
  "entity": "ASSORTMENT",
  "operation": "CREATE",
  "payload": {
    "_id": "A",
    "specification": {
      "created": null,
      "updated": null,
      "sequence": "",
      "isActive": true,
      "isBase": false,
      "isRoot": true,
      "tags": ["food"],
      "meta": {},
      "content": {
        "de": {
          "created": null,
          "updated": null,
          "title": "Groceries",
          "slug": "groceries",
          "subtitle": "Short description",
          "description": "Long description"
        }
      }
    },
    "products": [
      {
        "_id": null,
        "created": null,
        "updated": null,
        "productId": "A",
        "tags": ["big"],
        "meta": {}
      }
    ],
    "children": [
      {
        "_id": null,
        "created": null,
        "updated": null,
        "assortmentId": "assortment2",
        "tags": [],
        "meta": {}
      }
    ],
    "filters": [
      {
        "_id": null,
        "created": null,
        "updated": null,
        "filterId": "filter",
        "tags": [],
        "meta": {}
      }
    ]
  }
}
```

### Entity Type: Filter

Set by unchained:
- authorId,
- _id, created & updated if not provided

```json
{
  "entity": "FILTER",
  "operation": "CREATE",
  "payload": {
    "_id": null,
    "specification": {
      "created": null,
      "updated": null,
      "key": "size_cm",
      "isActive": true,
      "type": "SINGLE_CHOICE",
      "options": [
        {
          "value": "10",
          "content": {
            "de": {
              "created": null,
              "updated": null,
              "title": "10 cm",
              "subtitle": ""
            }
          }
        }
      ],
      "content": {
        "de": {
          "created": null,
          "updated": null,
          "title": "Size",
          "subtitle": "Size of product in centimeters"
        }
      },
      "meta": {}
    }
  }
}
```

### Entity Type: Review (coming soon)

```
{
  "entity": "REVIEW",
  "operation": "CREATE",
  "payload": {
    "_id": null,
    "specification": {
        "created": null,
        "updated": null,
        "productId": "product"
        "authorId": "root",
        "rating": 1,
        "title": "What the?",
        "review": "That product just sucks big times",
        "votes": [
          {
            "timestamp": null,
            "userId": "root",
            "type": "UPVOTE",
            "meta": {}
          }
        ],
        "meta": {}
      }
    }
  }
}

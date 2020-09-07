---
title: "PIM Connector Framework"
description: Import Data from any PIM
---

To upload huge amount of data to Unchained, for example if you pump the data from a PIM or ERP system, we have created a special API.

Using the Bulk API stores the data in the Unchained Work Queue before processing and enables some neat features:

1. Cloud Native: Allows dedicated background or worker instances to do the actual processing
2. Transparent Process: Also stores the result on the work item, making successful and failed imports queryable.
3. Captures Sync issues and reports those with a Status E-Mail to a central E-Mail Address (Sync error reporting)
4. Performance: Only downloads assets that are not downloaded yet and tries to optimize the actual write calls to the database by using MongoDB bulk operations, making sync processing fast
5. Push-based: Immediate representation of changes

In some situations, it's propably wise to develop a sync microservice: You have a source system that
- generates "Pull-based" data feeds, or
- can not adopt to the JSON described below or
- needs to merge data from different systems



## Product JSON Schema

Set by unchained:
- authorId,
- slug history
- _id, contentHash, created & updated if not provided

```json
{
  "entity": "PRODUCT",
  "operation": "CREATE",
  "payload": {
    "specification": {
      "_id": "A",
      "created": null,
      "updated": null,
      "sequence": "",
      "tags": ["nice"],
      "type": "SimpleProduct",
      "status": "ACTIVE",
      "published": "2020-01-01T00:00Z",
      "commerce": {
        "salesUnit": "ST",
        "salesQuantityPerUnit": "1",
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
        "sku": ""
      },
      "supply": {
        "weightInGram": 0,
        "heightInMillimeters": 0,
        "lengthInMillimeters": 0,
        "widthInMillimeters": 0
      },
      "proxy": {
        "assignments": [
          {
            "vector": {
              "color": "red"
            },
            "productId": "B"
          }
        ]
      },
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
          "contentHash": null,
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
    ],
    "reviews": [
      {
        "_id": null,
        "created": null,
        "updated": null,
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
    ]
  }
}
```

## Assortment JSON Schema

Set by unchained:
- authorId,
- slug history
- _id, created & updated if not provided

```json
{
  "entity": "ASSORTMENT",
  "operation": "CREATE",
  "payload": {
    "specification": {
      "_id": "A",
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

## Filter JSON Schema

Set by unchained:
- authorId,
- _id, created & updated if not provided

```json
{
  "entity": "FILTER",
  "operation": "CREATE",
  "payload": {
    "specification": {
      "_id": null,
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

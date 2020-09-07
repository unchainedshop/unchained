---
title: "PIM Connector Framework"
description: Import Data from any PIM
---

Entity: "Product"

Set by unchained: authorId, slug history

```json
{
  "entity": "PRODUCT",
  "operation": "CREATE",
  "payload": {
    "specification": {
      "_id": "A",
      "sequence": "",
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
          "vendor": "Herstellername",
          "brand": "Marke",
          "title": "Produktname",
          "slug": "produktname",
          "subtitle": "Kurzbeschreibung",
          "description": "Lange Beschreibung",
          "labels": [
            "Neu"
          ]
        }
      }
    },
    "media": [
      {
        "asset": {
          "_id": null,
          "url": "https://www.story.one/media/images/poop-4108423_1920.width-1600.format-jpeg.jpg"
        },
        "sortKey": 0,
        "tags": ["big"],
        "meta": {},
        "content": {
          "de": {
            "title": "Produktname",
            "subtitle": "Kurzbeschreibung",
          }
        }
      }
    ],
    "variations": {
      "color": {
        "type": "COLOR",
        "options": {
          "ff0000": {
            "content": {
              "de": {
                "title": "Rot",
                "subtitle": ""
              }
            }
          }
        },
        "content": {
          "de": {
            "title": "Farbe",
            "subtitle": "Farbvariante"
          }
        }
      }
    },
    "reviews": [
      {
        "_id": null,
        "authorId": "root",
        "rating": 1,
        "title": "What the?",
        "review": "That product just sucks big times",
        "votes": [
          {
            "timestamp": "",
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

---
sidebar_position: 2
sidebar_label: Bulk Import 
title: 'Bulk Import API'
---

:::
 Import Data from PIM / ERP
:::

We have created a special API to upload large amounts of data, for example from a PIM or ERP system, to the Unchained Engine.

## Bulk Import API

The Bulk API stores the data in the Unchained Work Queue before processing and enables some neat features:

1. Cloud native: Allows dedicated background or worker instances to do the actual processing
2. Transparent process: Also stores the result on the work item, making successful and failed imports queryable.
3. Captures sync issues and reports those with a status e-mail to a central e-mail address (sync error reporting)
4. Performance: Only downloads assets that are not downloaded yet and tries to optimize the actual write calls to the database by using MongoDB bulk operations, making sync processing fast
5. Push-based: Immediate representation of changes

In some situations, it's probably wise to develop a sync microservice: You have a source system that

- generates "Pull-based" data feeds, or
- can not adopt to the JSON described below

### Endpoint

There are two ways to send bulk import events, one is through GraphQL by adding a BULK_IMPORT work type with an input like this:

```
{
  events: [...],
  ...options
}
```

The other way is to use the REST endpoint /bulk-import:

```
curl -X POST -H "Authorization: Bearer XXX" -H "content-type: application/json" --data-binary '{ "events": [] }' -f -v http://localhost:4010/bulk-import?optionA=valueA
```

Every event consists of a type, an operation and a payload.

Supported entity types:

- PRODUCT
- ASSORTMENT
- FILTER
- ENROLLMENT (coming soon)
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

Try to always send as many events at a time, so Unchained can optimize write operations. And be aware that because of the MongoDB Document Size limitation, you have to use the REST endpoint when you send JSON which is more than 16m of size. If you have a lot of categories and/or products (5K entities+) please use the REST endpoint.

Options:

- `createShouldUpsertIfIDExists`: In some situations, this can be helpful programming forgiving sync code. If you set `createShouldUpsertIfIDExists` to true, CREATE operations will not fail if the entity with the payloadId already exists and the bulk importer instead tries to merge the new product with the existing one by using update methods.
- `updateShouldUpsertIfIDNotExists`: In some situations, this can be helpful programming forgiving sync code. Falls back to CREATE when UPDATE is invoked on missing default products/assortments/filters
- `skipCacheInvalidation`: In some situations, this can be helpful skipping because it can add a lot of weight to the BULK_IMPORT operation and sometimes it's not needed for example availability syncs to have updated filter and assortment caches.

## JSON Reference

### Entity Type: Product

Set by Unchained:

- slug history
- \_id, created & updated if not provided

Languages:

- The language code in "content" fields should match an existing language entity's isoCode in Unchained.

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
        }
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
        "billingInterval": "DAYS",
        "billingIntervalCount": 1,
        "usageCalculationType": "METERED",
        "trialInterval": "DAYS",
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
          "labels": ["Neu"]
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
            "subtitle": "Short description"
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

Set by Unchained:

- slug history
- \_id, created & updated if not provided

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
    ],
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
            "title": "assortmentName",
            "subtitle": "Short description"
          }
        }
      }
    ]
  }
}
```

### Entity Type: Filter

Set by Unchained:

- \_id, created & updated if not provided

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
      "meta": {},
      "content": {
        "de": {
          "created": null,
          "updated": null,
          "title": "Size",
          "subtitle": "Size of product in centimeters"
        }
      }
    }
  }
}
```

## Creating custom handlers

While unchained provides a lot of bulk import handles already and other are being built, you can write your own handler for an entity if the need arises.
in order to write custom handler you need to create an object that implements [BulkImportHandler](https://docs.unchained.shop/types/types/platform.BulkImportHandler.html) structure. where the parent key represents the entity example `PRODUCT` and each of its fields represent operation name and its corresponding handler function that implements [BulkImportOperation](https://docs.unchained.shop/types/types/platform.BulkImportOperation.html).

```
{
  [entity] : {
    [operation] : function [handler] {}
  }
}

```
Every bulk import handler function should return [BulkImportOperationResult](https://docs.unchained.shop/types/types/platform.BulkImportOperationResult.html).
After creating a bulk import handler object the final step is registering this handler on the platform so that it's registered on system boot.

```
import handlers from 'location/of/bulk-import-handler'

  const unchainedAPI = await startPlatform({
    ...
    bulkImporter: {
      handlers,
    },
    ...

```

Now when the engine detects a `BULK_IMPORT` event with the entities defined above along with the operation, it will execute that particular handler and perform whatever is defined in it.


example.

Below is an example bulk import handler that will be executed to log import duration from an external API. The handler receives all the locations of downloaded data along with the duration it took to complete.


```

import { UnchainedCore } from '@unchainedshop/core';

type Duration = {
    _id: string;
    type: string;
    started: Date;
    finished?: Date;
    success?: boolean;
}

const handlers: Record<string, BulkImportHandler> = {
  SYNC_PROGRESS: {
      'log-duration': async function reportSyncTime(duration: Duration, options: { logger?: any; }, unchainedAPI: UnchainedCore,) {
                    options.logger.debug('replace all discount groups', duration);

                    await unchainedAPI.modules.durationLogger.insertSyncDurationReport(duration);

                    return {
                      entity: 'SYNC_PROGRESS',
                      operation: 'log-duration',
                      success: true,
                    };
                  }
      }
}



```

On the above sample core `durationLogger` is a custom module that is implemented for this purpose. if you want to learn more about write custom modules refer to [Configure custom module](./custom-modules)
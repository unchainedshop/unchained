# Bulk Import Schema Validation

This module provides comprehensive schema validation for bulk import operations, addressing the issue where invalid events were only caught during work processing, leading to false-positive API responses.

## Problem Solved

Previously, the bulk import API would:
1. Accept any JSON payload and immediately return success
2. Queue the payload as a `BULK_IMPORT` work job
3. Only validate the data during job processing
4. Fail silently, leaving the client unaware of validation errors

Now, the API validates the entire payload upfront and rejects invalid requests immediately.

## Features

### ✅ Comprehensive Schema Validation
- **Entity Support**: PRODUCT, FILTER, ASSORTMENT
- **Operation Support**: create, update, remove (case-insensitive)
- **Required Fields**: Validates all mandatory fields per entity type
- **Data Types**: Ensures correct types (strings, numbers, booleans, arrays)
- **Complex Structures**: Validates nested objects like commerce settings, media, variations

### ✅ Streaming Validation
- **Memory Efficient**: Processes large payloads without loading everything into memory
- **Size Limits**: Configurable protection against oversized requests (default: 100MB)
- **JSON Structure**: Validates events array structure during streaming

### ✅ Detailed Error Reporting
- **Precise Locations**: Error paths like `events.0.payload.specification.type`
- **Event Indices**: Identifies which specific event failed validation
- **Multiple Errors**: Collects all validation errors, not just the first one
- **Error Codes**: Structured error codes for programmatic handling

## Usage

### Using Validation Middleware

```typescript
import { createBulkImportMiddlewareWithValidation } from '@unchainedshop/api/express';
import { bulkImportHandlerWithValidation } from '@unchainedshop/api/fastify';

// Express
app.use('/bulk-import', createBulkImportMiddlewareWithValidation);

// Fastify
fastify.post('/bulk-import', bulkImportHandlerWithValidation);
```

### Direct Schema Validation

```typescript
import { validateBulkImportPayload, BulkImportEventSchema } from '@unchainedshop/api/bulk-import';

// Validate complete payload
const result = validateBulkImportPayload(jsonData);
if (!result.isValid) {
  console.log(`Found ${result.errors.length} validation errors`);
  result.errors.forEach(error => {
    console.log(`${error.path}: ${error.message}`);
  });
}

// Validate individual event
const eventResult = BulkImportEventSchema.safeParse(event);
```

### Stream Validation

```typescript
import { validateBulkImportStream } from '@unchainedshop/api/bulk-import';
import { Readable } from 'stream';

const stream = Readable.from([jsonBuffer]);
const result = await validateBulkImportStream(stream);
```

## Validation Rules

### Product Events
```typescript
{
  entity: 'PRODUCT',
  operation: 'create' | 'update' | 'remove',
  payload: {
    _id: string,
    specification: {
      type: 'SimpleProduct' | 'ConfigurableProduct' | 'BundleProduct' | 'PlanProduct',
      content: {
        [locale]: {
          title: string,
          slug?: string,
          // ... other content fields
        }
      },
      commerce?: {
        salesUnit: string,
        salesQuantityPerUnit: string,
        defaultOrderQuantity: string,
        pricing: Array<{
          isTaxable: boolean,
          isNetPrice: boolean,
          countryCode: string, // 2-char ISO
          currencyCode: string, // 3-char ISO
          amount: number // positive integer
        }>
      }
      // ... other specification fields
    },
    media?: Array<MediaObject>,
    variations?: Array<VariationObject>
  }
}
```

### Filter Events
```typescript
{
  entity: 'FILTER',
  operation: 'create' | 'update' | 'remove',
  payload: {
    _id: string,
    specification: {
      key: string,
      isActive: boolean,
      type: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'RANGE',
      options: Array<{
        value: string,
        content: {
          [locale]: {
            title: string,
            subtitle?: string
          }
        }
      }>,
      content: {
        [locale]: {
          title: string,
          subtitle?: string
        }
      }
    }
  }
}
```

### Assortment Events
```typescript
{
  entity: 'ASSORTMENT',
  operation: 'create' | 'update' | 'remove',
  payload: {
    _id: string,
    specification: {
      isActive: boolean,
      isBase?: boolean,
      isRoot?: boolean,
      content: {
        [locale]: {
          title: string,
          slug?: string,
          subtitle?: string,
          description?: string
        }
      }
    },
    products?: Array<{
      productId: string,
      tags?: string[],
      meta?: object
    }>,
    children?: Array<{
      assortmentId: string,
      tags?: string[],
      meta?: object
    }>,
    filters?: Array<{
      filterId: string,
      tags?: string[],
      meta?: object
    }>,
    media?: Array<MediaObject>
  }
}
```

## Error Response Format

When validation fails, the API returns a 400 status with detailed error information:

```json
{
  "name": "ValidationError",
  "code": "SCHEMA_VALIDATION_FAILED",
  "message": "Schema validation failed with 2 error(s)",
  "details": {
    "eventsProcessed": 5,
    "errors": [
      {
        "path": "events.0.payload.specification.type",
        "message": "Invalid enum value. Expected 'SimpleProduct' | 'ConfigurableProduct' | 'BundleProduct' | 'PlanProduct', received 'InvalidType'",
        "code": "invalid_enum_value",
        "eventIndex": 0
      },
      {
        "path": "events.1.payload.specification.options.0.content",
        "message": "Required",
        "code": "required",
        "eventIndex": 1
      }
    ]
  }
}
```

## Configuration

### Payload Size Limits
```typescript
// Default: 100MB
const maxSize = 100 * 1024 * 1024;
```

### Custom Validation
Extend the base schemas for custom entity types:

```typescript
import { BulkImportEventSchema } from '@unchainedshop/api/bulk-import';
import { z } from 'zod';

const CustomEventSchema = z.discriminatedUnion('entity', [
  BulkImportEventSchema.options[0], // PRODUCT
  BulkImportEventSchema.options[1], // FILTER  
  BulkImportEventSchema.options[2], // ASSORTMENT
  z.object({
    entity: z.literal('CUSTOM_ENTITY'),
    operation: z.literal('create'),
    payload: CustomPayloadSchema
  })
]);
```

## Migration Guide

### For New Implementations
Use the validation-enabled endpoints by default:
- `createBulkImportMiddlewareWithValidation` (Express)
- `bulkImportHandlerWithValidation` (Fastify)

### For Existing Implementations
The original endpoints remain unchanged for backward compatibility:
- `createBulkImportMiddleware` (Express)
- `bulkImportHandler` (Fastify)

Gradually migrate to validation-enabled endpoints and update client error handling to process the new detailed error format.

## Testing

Run the validation tests:
```bash
npm test packages/api/src/bulk-import/schemas.test.ts
```

The test suite covers:
- Valid event validation for all entity types
- Invalid entity/operation rejection
- Required field validation
- Complex nested structure validation
- Empty payload rejection
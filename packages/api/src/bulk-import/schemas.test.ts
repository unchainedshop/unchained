import { test } from 'node:test';
import assert from 'node:assert';
import { BulkImportEventSchema, BulkImportPayloadSchema } from './schemas.js';

test('BulkImportEventSchema', () => {
  test('should validate a valid PRODUCT CREATE event', () => {
    const validEvent = {
      entity: 'PRODUCT',
      operation: 'create',
      payload: {
        _id: 'test-product',
        specification: {
          type: 'SimpleProduct',
          content: {
            en: {
              title: 'Test Product',
              slug: 'test-product',
            },
          },
        },
      },
    };

    const result = BulkImportEventSchema.safeParse(validEvent);
    assert.strictEqual(result.success, true);
  });

  test('should reject invalid entity', () => {
    const invalidEvent = {
      entity: 'INVALID_ENTITY',
      operation: 'create',
      payload: {
        _id: 'test-id',
      },
    };

    const result = BulkImportEventSchema.safeParse(invalidEvent);
    assert.strictEqual(result.success, false);
  });

  test('should reject invalid operation', () => {
    const invalidEvent = {
      entity: 'PRODUCT',
      operation: 'invalid_operation',
      payload: {
        _id: 'test-id',
      },
    };

    const result = BulkImportEventSchema.safeParse(invalidEvent);
    assert.strictEqual(result.success, false);
  });

  test('should validate FILTER event with options', () => {
    const validEvent = {
      entity: 'FILTER',
      operation: 'create',
      payload: {
        _id: 'size-filter',
        specification: {
          key: 'size',
          isActive: true,
          type: 'SINGLE_CHOICE',
          options: [
            {
              value: 'large',
              content: {
                en: {
                  title: 'Large',
                },
              },
            },
          ],
          content: {
            en: {
              title: 'Size Filter',
            },
          },
        },
      },
    };

    const result = BulkImportEventSchema.safeParse(validEvent);
    assert.strictEqual(result.success, true);
  });

  test('should reject FILTER without required translation content', () => {
    const invalidEvent = {
      entity: 'FILTER',
      operation: 'create',
      payload: {
        _id: 'size-filter',
        specification: {
          key: 'size',
          isActive: true,
          type: 'SINGLE_CHOICE',
          options: [
            {
              value: 'large',
              // Missing content
            },
          ],
          content: {
            en: {
              title: 'Size Filter',
            },
          },
        },
      },
    };

    const result = BulkImportEventSchema.safeParse(invalidEvent);
    assert.strictEqual(result.success, false);
  });
});

test('BulkImportPayloadSchema', () => {
  test('should validate payload with events array', () => {
    const validPayload = {
      events: [
        {
          entity: 'PRODUCT',
          operation: 'create',
          payload: {
            _id: 'test-product',
            specification: {
              type: 'SimpleProduct',
              content: {
                en: {
                  title: 'Test Product',
                },
              },
            },
          },
        },
      ],
    };

    const result = BulkImportPayloadSchema.safeParse(validPayload);
    assert.strictEqual(result.success, true);
  });

  test('should reject empty events array', () => {
    const invalidPayload = {
      events: [],
    };

    const result = BulkImportPayloadSchema.safeParse(invalidPayload);
    assert.strictEqual(result.success, false);
  });

  test('should reject missing events property', () => {
    const invalidPayload = {};

    const result = BulkImportPayloadSchema.safeParse(invalidPayload);
    assert.strictEqual(result.success, false);
  });
});
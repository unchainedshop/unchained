import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ProductCreatePayloadSchema } from './create.ts';
import { ProductUpdatePayloadSchema } from './update.ts';

const tokenization = {
  contractAddress: '0x0',
  contractStandard: 'ERC721',
  tokenId: '0',
  supply: 120,
  ercMetadataProperties: { slot: new Date('2026-10-01T19:30:00Z'), category: 'concert' },
};

const createPayload = (specification: Record<string, unknown>) => ({
  _id: 'event-1',
  specification: { type: 'TOKENIZED_PRODUCT', content: {}, ...specification },
});

const updatePayload = (specification: Record<string, unknown>) => ({
  _id: 'event-1',
  specification,
});

describe('Bulk import product schemas', () => {
  for (const [label, schema, payload] of [
    ['create', ProductCreatePayloadSchema, createPayload],
    ['update', ProductUpdatePayloadSchema, updatePayload],
  ] as const) {
    describe(label, () => {
      it('declares tokenization and keeps it on parse', () => {
        const parsed = schema.parse(payload({ tokenization }));
        assert.deepEqual(parsed.specification?.tokenization, tokenization);
      });

      it('accepts off-chain tokenization without contract address and token id', () => {
        const parsed = schema.parse(payload({ tokenization: { supply: 0 } }));
        assert.deepEqual(parsed.specification?.tokenization, { supply: 0 });
      });

      it('rejects a malformed tokenization', () => {
        assert.throws(() => schema.parse(payload({ tokenization: { supply: -1 } })));
        assert.throws(() => schema.parse(payload({ tokenization: { supply: '100' } })));
        assert.throws(() => schema.parse(payload({ tokenization: { contractStandard: 'ERC20' } })));
      });

      it('accepts published as a Date or a date string', () => {
        for (const published of [
          new Date('2020-01-01T00:00:00Z'),
          '2020-01-01T00:00:00Z',
          '2020-01-01T00:00Z',
          null,
        ]) {
          const parsed = schema.parse(payload({ published }));
          assert.deepEqual(parsed.specification?.published, published);
        }
      });

      it('rejects an invalid published date', () => {
        assert.throws(() => schema.parse(payload({ published: 'not a date' })));
        assert.throws(() => schema.parse(payload({ published: new Date('invalid') })));
      });
    });
  }
});

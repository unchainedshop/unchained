import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import updateProductTokenization, { mergeTokenizationInput } from './updateProductTokenization.ts';

const stored = {
  contractAddress: '0x0',
  contractStandard: 'ERC721',
  tokenId: '0',
  supply: 100,
  ercMetadataProperties: { slot: '2030-01-01T19:30:00.000Z', category: 'jazz' },
} as const;

describe('mergeTokenizationInput', () => {
  it('keeps the stored ercMetadataProperties, contract address and token id when omitted', () => {
    assert.deepEqual(mergeTokenizationInput(stored, { contractStandard: 'ERC721', supply: 80 }), {
      ...stored,
      supply: 80,
    });
  });

  it('replaces ercMetadataProperties as a whole when given (no deep merge)', () => {
    assert.deepEqual(
      mergeTokenizationInput(stored, {
        contractStandard: 'ERC721',
        supply: 100,
        ercMetadataProperties: { slot: '2030-01-02T19:30:00.000Z' },
      }),
      { ...stored, ercMetadataProperties: { slot: '2030-01-02T19:30:00.000Z' } },
    );
  });

  it('clears optional fields passed as null without storing null', () => {
    const merged = mergeTokenizationInput(stored, {
      contractStandard: 'ERC721',
      supply: 100,
      contractAddress: null,
      tokenId: null,
      ercMetadataProperties: null,
    });
    assert.deepEqual(merged, { contractStandard: 'ERC721', supply: 100 });
    assert.equal('ercMetadataProperties' in merged, false);
  });

  it('works without a stored tokenization', () => {
    assert.deepEqual(mergeTokenizationInput(undefined, { contractStandard: 'ERC1155', supply: 1 }), {
      contractStandard: 'ERC1155',
      supply: 1,
    });
  });
});

describe('updateProductTokenization resolver', () => {
  it('does not wipe the event slot when the input omits ercMetadataProperties', async () => {
    const update = mock.fn(async () => 'product');
    const context = {
      modules: {
        products: {
          findProduct: async () => ({ _id: 'product', type: 'TOKENIZED_PRODUCT', tokenization: stored }),
          update,
        },
      },
    } as any;

    await updateProductTokenization(
      null as never,
      { productId: 'product', tokenization: { contractStandard: 'ERC721', supply: 80 } as any },
      context,
    );

    assert.deepEqual(update.mock.calls[0].arguments, [
      'product',
      { tokenization: { ...stored, supply: 80 } },
    ]);
  });
});

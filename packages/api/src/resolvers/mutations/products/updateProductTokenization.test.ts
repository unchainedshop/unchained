import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import updateProductTokenization from './updateProductTokenization.ts';

describe('updateProductTokenization resolver', () => {
  it('replaces the tokenization as a whole, like the other product configurations', async () => {
    const update = mock.fn(async () => 'product');
    const context = {
      modules: {
        products: {
          findProduct: async () => ({
            _id: 'product',
            type: 'TOKENIZED_PRODUCT',
            tokenization: {
              contractAddress: '0x0',
              contractStandard: 'ERC721',
              tokenId: '0',
              supply: 100,
              ercMetadataProperties: { color: 'blue' },
            },
          }),
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
      { tokenization: { contractStandard: 'ERC721', supply: 80 } },
    ]);
  });
});

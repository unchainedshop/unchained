import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import updateProduct from './updateProduct.ts';

const stored = {
  contractAddress: '0x0',
  contractStandard: 'ERC721',
  tokenId: '0',
  supply: 100,
  ercMetadataProperties: { color: 'blue' },
};

const buildContext = () => {
  const update = mock.fn(async () => 'product');
  let calls = 0;
  const context = {
    modules: {
      products: {
        // The first lookup loads the product to update, the second one (details) finds nothing
        findProduct: async () =>
          calls++ === 0 ? { _id: 'product', type: 'TOKENIZED_PRODUCT', tokenization: stored } : null,
        update,
      },
    },
    loaders: {},
  } as any;
  return { context, update };
};

describe('MCP updateProduct tokenization', () => {
  it('replaces the tokenization as a whole', async () => {
    const { context, update } = buildContext();
    await updateProduct(context, {
      productId: 'product',
      product: { tokenization: { contractStandard: 'ERC721', supply: 80 } },
    } as any);
    assert.deepEqual(update.mock.calls[0].arguments, [
      'product',
      { tokenization: { contractStandard: 'ERC721', supply: 80 } },
    ]);
  });
});

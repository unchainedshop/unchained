import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { systemLocale } from '@unchainedshop/utils';
import { ETHMinter } from './adapter.ts';

const product = {
  _id: 'product-1',
  type: 'TOKENIZED_PRODUCT',
  tokenization: {
    contractAddress: '0xabc',
    contractStandard: 'ERC721',
    tokenId: '0',
    supply: 10,
    // A ticket event slot far in the future: the web3 minter knows no entry window
    ercMetadataProperties: { slot: '2099-01-01T19:30:00.000Z' },
  },
};

const buildContext = (overrides: Record<string, unknown> = {}) => {
  const tokenSelectors: any[] = [];
  const context = {
    product,
    orderPosition: { _id: 'position-1', orderId: 'order-1', quantity: 2 },
    locale: systemLocale,
    modules: {
      warehousing: {
        findTokens: async (selector: any) => {
          tokenSelectors.push(selector);
          return [
            { quantity: 1, meta: {} },
            { quantity: 2, meta: { cancelled: true } },
          ];
        },
      },
      languages: { findLanguages: async () => [{ isoCode: 'en' }, { isoCode: 'de' }] },
      products: {
        media: { findProductMedias: async () => [] },
        texts: { findLocalizedText: async () => ({ title: 'Concert', description: 'Live' }) },
      },
      files: { findFile: async () => null },
    },
    ...overrides,
  } as any;
  return { context, tokenSelectors };
};

describe('ETHMinter (web3 only)', () => {
  it('stock counts every issued token, cancelled or not', async () => {
    const { context, tokenSelectors } = buildContext();
    const actions = ETHMinter.actions([], context);
    assert.equal(await actions.stock(new Date()), 10 - 3);
    assert.deepEqual(tokenSelectors, [{ productId: 'product-1' }]);
  });

  it('has no entry window around a slot', async () => {
    const { context } = buildContext({ token: { tokenSerialNumber: '1', meta: {} } });
    const actions = ETHMinter.actions([], context);
    assert.equal(await actions.isInvalidateable('1', new Date('2020-01-01T00:00:00Z')), true);
  });

  it('does not store the order id on minted tokens', async () => {
    const { context } = buildContext();
    const tokens = await ETHMinter.actions([{ key: 'chainId', value: '1' }], context).tokenize();
    assert.equal(tokens.length, 2);
    for (const token of tokens) {
      assert.deepEqual(token.meta, { contractStandard: 'ERC721' });
    }
  });

  it('never spreads token.meta into the ERC metadata and links the serial per locale', async () => {
    const { context } = buildContext({
      token: {
        tokenSerialNumber: '7',
        meta: { orderId: 'order-1', cancelled: true, attendeeName: 'Jane', name: 'overridden' },
      },
    });
    const metadata = await ETHMinter.actions([], context).tokenMetadata('7', new Date());
    assert.equal(metadata.name, 'Concert #7');
    assert.equal(metadata.orderId, undefined);
    assert.equal(metadata.cancelled, undefined);
    assert.equal(metadata.attendeeName, undefined);
    assert.match(metadata.localization.uri, /\/erc-metadata\/product-1\/\{locale\}\/7\.json$/);
  });

  it('names the token after the product id when the product has no texts', async () => {
    const { context } = buildContext({ token: { tokenSerialNumber: '7', meta: {} } });
    context.modules.products.texts.findLocalizedText = async () => null;
    const metadata = await ETHMinter.actions([], context).tokenMetadata('7', new Date());
    assert.equal(metadata.name, 'product-1 #7');
    assert.equal(metadata.description, undefined);
  });
});

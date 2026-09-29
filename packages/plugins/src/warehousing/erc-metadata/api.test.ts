import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ercMetadataHandler } from './api.ts';

const erc721Product = {
  _id: 'event-1',
  type: 'TOKENIZED_PRODUCT',
  tokenization: { contractAddress: '0x0', contractStandard: 'ERC721', tokenId: '0', supply: 10 },
};

const buildContext = ({
  product = erc721Product as any,
  tokens = [{ _id: 'token-7', productId: 'event-1', tokenSerialNumber: 'T7', meta: {} }] as any[],
  ercMetadata = {
    name: 'Concert #T7',
    description: 'Live',
    image: 'https://shop.example/image.png',
    properties: { slot: '2030-01-01T19:30:00.000Z' },
    localization: { uri: 'https://shop.example/erc-metadata/event-1/{locale}/T7.json' },
    // token.meta spread by an adapter: must never reach the public route
    orderId: 'order-1',
    cancelled: true,
    attendeeName: 'Jane Doe',
  } as Record<string, unknown> | null,
} = {}) => {
  const selectors: any[] = [];
  const context = {
    params: {} as Record<string, string>,
    modules: {
      products: { findProduct: async () => product },
      warehousing: {
        findTokens: async (selector: any) => {
          selectors.push(selector);
          return tokens.filter(
            (token) =>
              token.productId === selector.productId &&
              token.tokenSerialNumber === selector.tokenSerialNumber,
          );
        },
      },
    },
    services: { warehousing: { ercMetadata: async () => ercMetadata } },
  } as any;
  return { context, selectors };
};

const request = (path: string) => new Request(`https://shop.example${path}`);

describe('ERC metadata route', () => {
  it('looks up an ERC721 token by product and serial, not by contract address', async () => {
    const { context, selectors } = buildContext();
    context.params = { productId: 'event-1', localeOrTokenFilename: 'T7.json' };
    const response = await ercMetadataHandler(request('/erc-metadata/event-1/T7.json'), context);
    assert.equal(response.status, 200);
    assert.deepEqual(selectors, [{ productId: 'event-1', tokenSerialNumber: 'T7' }]);
  });

  it('answers 404 for a serial of another product on the same contract', async () => {
    const { context } = buildContext({
      tokens: [{ _id: 'token-1', productId: 'event-2', tokenSerialNumber: '1', meta: {} }],
    });
    context.params = { productId: 'event-1', localeOrTokenFilename: 'en', tokenFileName: '1.json' };
    const response = await ercMetadataHandler(request('/erc-metadata/event-1/en/1.json'), context);
    assert.equal(response.status, 404);
  });

  it('answers 404 for an unknown product', async () => {
    const { context } = buildContext({ product: null });
    context.params = { productId: 'nope', localeOrTokenFilename: 'T7.json' };
    const response = await ercMetadataHandler(request('/erc-metadata/nope/T7.json'), context);
    assert.equal(response.status, 404);
  });

  it('publishes only the public ERC metadata keys', async () => {
    const { context } = buildContext();
    context.params = { productId: 'event-1', localeOrTokenFilename: 'de', tokenFileName: 'T7.json' };
    const response = await ercMetadataHandler(request('/erc-metadata/event-1/de/T7.json'), context);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      name: 'Concert #T7',
      description: 'Live',
      image: 'https://shop.example/image.png',
      properties: { slot: '2030-01-01T19:30:00.000Z' },
      localization: { uri: 'https://shop.example/erc-metadata/event-1/{locale}/T7.json' },
    });
  });
});

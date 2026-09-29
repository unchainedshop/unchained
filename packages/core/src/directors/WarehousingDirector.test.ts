import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { WarehousingDirector } from './WarehousingDirector.ts';
import { WarehousingAdapter, type IWarehousingAdapter } from './WarehousingAdapter.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';

const createAdapter = (
  key: string,
  answers: { isActive: boolean; isInvalidateable?: boolean; tokenMetadata?: any },
): IWarehousingAdapter => ({
  ...WarehousingAdapter,
  key: `shop.unchained.tests.warehousing.${key}`,
  label: key,
  version: '1.0.0',
  typeSupported: () => true,
  actions: (configuration, context) => ({
    ...WarehousingAdapter.actions(configuration, context),
    isActive: () => answers.isActive,
    isInvalidateable: async () => answers.isInvalidateable ?? true,
    tokenMetadata: async () => answers.tokenMetadata ?? null,
  }),
});

const testPlugin = {
  key: 'shop.unchained.tests.warehousing-director',
  label: 'Warehousing director tests',
  version: '1.0.0',
  adapters: [
    createAdapter('inactive', { isActive: false, isInvalidateable: true, tokenMetadata: { name: 'x' } }),
    createAdapter('closed', { isActive: true, isInvalidateable: false, tokenMetadata: null }),
    createAdapter('open', { isActive: true, isInvalidateable: true, tokenMetadata: { name: 'open' } }),
  ],
};

const provider = (key: string) =>
  ({
    _id: key,
    type: 'VIRTUAL',
    adapterKey: `shop.unchained.tests.warehousing.${key}`,
    configuration: [],
  }) as any;

const context = {
  token: { _id: 'token', tokenSerialNumber: '1' },
  product: { _id: 'product' },
  quantity: 1,
  referenceDate: new Date(),
} as any;

describe('WarehousingDirector across several virtual providers', () => {
  before(() => {
    pluginRegistry.register(testPlugin);
  });
  after(() => {
    pluginRegistry.clear();
  });

  it('isInvalidateable: the first active provider decides, a later provider cannot override false', async () => {
    const result = await WarehousingDirector.isInvalidateable(
      [provider('inactive'), provider('closed'), provider('open')],
      context,
      { modules: {} as any },
    );
    assert.equal(result, false);
  });

  it('isInvalidateable: skips inactive providers', async () => {
    const result = await WarehousingDirector.isInvalidateable(
      [provider('inactive'), provider('open'), provider('closed')],
      context,
      { modules: {} as any },
    );
    assert.equal(result, true);
  });

  it('isInvalidateable: null without an active provider', async () => {
    const result = await WarehousingDirector.isInvalidateable([provider('inactive')], context, {
      modules: {} as any,
    });
    assert.equal(result, null);
  });

  it('tokenMetadata: the first active provider decides, even when it has no metadata', async () => {
    assert.equal(
      await WarehousingDirector.tokenMetadata(
        [provider('inactive'), provider('closed'), provider('open')],
        context,
        { modules: {} as any },
      ),
      null,
    );
    assert.deepEqual(
      await WarehousingDirector.tokenMetadata(
        [provider('inactive'), provider('open'), provider('closed')],
        context,
        { modules: {} as any },
      ),
      { name: 'open' },
    );
  });
});

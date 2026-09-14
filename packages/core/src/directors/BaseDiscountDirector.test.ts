import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { describe, it, mock } from 'node:test';
import {
  BaseDiscountAdapter,
  type DiscountContext,
  type IDiscountAdapter,
} from './BaseDiscountAdapter.ts';
import { BaseDiscountDirector } from './BaseDiscountDirector.ts';
import type { Modules } from '../modules.ts';

const createAdapter = (
  key: string,
  isManualAdditionAllowed: IDiscountAdapter<unknown>['isManualAdditionAllowed'],
  valid = true,
) => ({
  ...BaseDiscountAdapter,
  key,
  label: key,
  version: '1.0.0',
  isManualAdditionAllowed: mock.fn(isManualAdditionAllowed),
  actions: mock.fn(async (params: Parameters<IDiscountAdapter<unknown>['actions']>[0]) => ({
    ...(await BaseDiscountAdapter.actions(params)),
    isValidForCodeTriggering: async () => valid,
  })),
});

const createActions = (adapters: IDiscountAdapter<unknown>[]) => {
  const director = {
    ...BaseDiscountDirector<unknown>('TestDiscountDirector'),
    getAdapters: () => adapters,
  };
  return director.actions({ order: { _id: 'order-id' } } as DiscountContext, { modules: {} as Modules });
};

describe('BaseDiscountDirector manual coupon resolution', () => {
  it('skips denied adapters before initializing their actions', async () => {
    const denied = createAdapter('denied', async () => false);
    const allowed = createAdapter('allowed', async () => true);
    const actions = await createActions([denied, allowed]);

    const adapter = await actions.resolveDiscountAdapterFromStaticCode({ code: 'SAVE10' });

    assert.equal(adapter, allowed);
    assert.equal(denied.actions.mock.callCount(), 0);
    assert.equal(allowed.actions.mock.callCount(), 1);
    assert.deepEqual(denied.isManualAdditionAllowed.mock.calls[0].arguments, ['SAVE10']);
    assert.deepEqual(allowed.isManualAdditionAllowed.mock.calls[0].arguments, ['SAVE10']);
  });

  it('returns null when every adapter denies manual addition', async () => {
    const denied = createAdapter('denied', async () => false);
    const actions = await createActions([denied]);

    assert.equal(await actions.resolveDiscountAdapterFromStaticCode({ code: 'SAVE10' }), null);
    assert.equal(denied.actions.mock.callCount(), 0);
  });

  it('still validates the coupon after manual addition is allowed', async () => {
    const invalid = createAdapter('invalid', async () => true, false);
    const actions = await createActions([invalid]);

    assert.equal(await actions.resolveDiscountAdapterFromStaticCode({ code: 'INVALID' }), null);
    assert.equal(invalid.actions.mock.callCount(), 1);
  });

  it('awaits permission decisions and preserves adapter priority', async () => {
    const permission = Promise.withResolvers<boolean>();
    const first = createAdapter('first', () => permission.promise);
    const second = createAdapter('second', async () => true);
    const actions = await createActions([first, second]);
    const result = actions.resolveDiscountAdapterFromStaticCode({ code: 'SAVE10' });

    await setImmediate();
    assert.equal(first.actions.mock.callCount(), 0);
    assert.equal(second.actions.mock.callCount(), 1);

    permission.resolve(true);
    assert.equal(await result, first);
  });
});

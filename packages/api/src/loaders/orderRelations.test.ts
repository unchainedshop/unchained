import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { UnchainedCore } from '@unchainedshop/core';
import orderPositionsLoader from './orderPositionsLoader.ts';
import orderDiscountsLoader from './orderDiscountsLoader.ts';
import orderPaymentLoader from './orderPaymentLoader.ts';
import orderDeliveryLoader from './orderDeliveryLoader.ts';
import enrollmentByOrderLoader from './enrollmentByOrderLoader.ts';

describe('order relation loaders', () => {
  for (const [name, factory, moduleName, method] of [
    ['items', orderPositionsLoader, 'positions', 'findOrderPositions'],
    ['discounts', orderDiscountsLoader, 'discounts', 'findOrderDiscounts'],
  ] as const) {
    it(`batches ${name}, preserving record order and returning empty lists for missing orders`, async () => {
      const calls: string[][] = [];
      const records = [
        { _id: 'a', orderId: '__proto__' },
        { _id: 'b', orderId: 'second' },
        { _id: 'c', orderId: '__proto__' },
      ];
      const api = {
        modules: {
          orders: {
            [moduleName]: {
              [method]: async ({ orderIds }) => {
                calls.push(orderIds);
                return records;
              },
            },
          },
        },
      } as unknown as UnchainedCore;
      const loader = factory(api);
      const results = await Promise.all(
        ['second', '__proto__', 'constructor', '__proto__'].map((orderId) => loader.load({ orderId })),
      );
      assert.deepEqual(calls, [['second', '__proto__', 'constructor']]);
      assert.deepEqual(results, [[records[1]], [records[0], records[2]], [], [records[0], records[2]]]);
    });
  }

  for (const [name, factory, moduleName, method, idKey, idsKey] of [
    [
      'payment',
      orderPaymentLoader,
      'payments',
      'findOrderPayments',
      'orderPaymentId',
      'orderPaymentIds',
    ],
    [
      'delivery',
      orderDeliveryLoader,
      'deliveries',
      'findDeliveries',
      'orderDeliveryId',
      'orderDeliveryIds',
    ],
  ] as const) {
    it(`batches ${name} in request order and returns null for missing records`, async () => {
      const calls: string[][] = [];
      const records = [{ _id: '__proto__' }, { _id: 'second' }];
      const api = {
        modules: {
          orders: {
            [moduleName]: {
              [method]: async (query) => {
                calls.push(query[idsKey]);
                return records;
              },
            },
          },
        },
      } as unknown as UnchainedCore;
      const loader = factory(api);
      const results = await Promise.all(
        ['second', '__proto__', 'constructor', 'second'].map((id) =>
          loader.load({ [idKey]: id } as { orderPaymentId: string; orderDeliveryId: string }),
        ),
      );
      assert.deepEqual(calls, [['second', '__proto__', 'constructor']]);
      assert.deepEqual(results, [records[1], records[0], null, records[1]]);
    });
  }

  it('matches enrollment periods to multiple requested orders without leaking unrelated periods', async () => {
    const calls: string[][] = [];
    const enrollment = {
      _id: 'enrollment',
      periods: [{ orderId: '__proto__' }, { orderId: 'second' }, { orderId: 'unrequested' }],
    };
    const api = {
      modules: {
        enrollments: {
          findEnrollmentsByOrderIds: async ({ orderIds }) => {
            calls.push(orderIds);
            return [enrollment, { _id: 'later', periods: [{ orderId: 'second' }] }];
          },
        },
      },
    } as unknown as UnchainedCore;
    const loader = enrollmentByOrderLoader(api);
    const results = await Promise.all(
      ['second', '__proto__', 'constructor', 'second'].map((orderId) => loader.load({ orderId })),
    );
    assert.deepEqual(calls, [['second', '__proto__', 'constructor']]);
    assert.deepEqual(results, [enrollment, enrollment, null, enrollment]);
  });
});

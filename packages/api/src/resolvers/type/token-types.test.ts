import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Token } from './token-types.ts';

const order = { _id: 'order-1', orderNumber: 'ORD-1', userId: 'buyer' };

const buildContext = ({ canViewOrder = true, orderPosition = { orderId: order._id } as any } = {}) => {
  const checks: [string, unknown[]][] = [];
  const positionQueries: unknown[] = [];
  const context = {
    roles: {
      userHasPermission: async (_context: unknown, action: string, args: unknown[]) => {
        checks.push([action, args]);
        return canViewOrder;
      },
    },
    modules: {
      orders: {
        positions: {
          findOrderPosition: async (query: unknown) => {
            positionQueries.push(query);
            return orderPosition;
          },
        },
      },
    },
    loaders: {
      orderLoader: {
        load: async ({ orderId }: { orderId: string }) => (orderId === order._id ? order : null),
      },
    },
  } as any;
  return { context, checks, positionQueries };
};

describe('Token.order', () => {
  it('resolves the order through the order position the token was issued for', async () => {
    const { context, checks, positionQueries } = buildContext();
    const token = { _id: 'token-1', orderPositionId: 'position-1' } as any;

    assert.deepEqual(await Token.order(token, undefined as never, context), order);
    assert.deepEqual(positionQueries, [{ itemId: 'position-1' }]);
    assert.deepEqual(checks, [['viewOrder', [undefined, { orderId: order._id }]]]);
  });

  it('returns null instead of throwing when viewOrder is denied', async () => {
    const { context } = buildContext({ canViewOrder: false });
    const token = { _id: 'token-1', orderPositionId: 'position-1' } as any;

    assert.equal(await Token.order(token, undefined as never, context), null);
  });

  it('returns null for tokens without an order position', async () => {
    const { context, checks, positionQueries } = buildContext();

    assert.equal(await Token.order({ _id: 'token-1' } as any, undefined as never, context), null);
    assert.deepEqual(positionQueries, []);
    assert.deepEqual(checks, []);
  });

  it('returns null when the order position no longer exists', async () => {
    const { context, checks } = buildContext({ orderPosition: null });
    const token = { _id: 'token-1', orderPositionId: 'position-1' } as any;

    assert.equal(await Token.order(token, undefined as never, context), null);
    assert.deepEqual(checks, []);
  });
});

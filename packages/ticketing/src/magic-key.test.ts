import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roles } from '@unchainedshop/api';
import setupMagicKey from './magic-key.ts';

// A fresh role set keeps these rules away from any platform another suite started in this process,
// whose configured roles are handed back once the rules are set up.
const restoreRoles = roles.snapshotConfiguredRoles();
const permissions = roles.configureRoles({});
setupMagicKey();
restoreRoles();

const orders = [
  { _id: 'order-1', userId: 'buyer' },
  { _id: 'order-2', userId: 'buyer' },
];
const tokens = [
  { _id: 'ticket', userId: 'buyer', orderPositionId: 'position-1', meta: { orderId: 'order-1' } },
  { _id: 'ticket-without-order-id', userId: 'buyer', orderPositionId: 'position-2', meta: {} },
  { _id: 'transferred-ticket', userId: 'wallet-owner', orderPositionId: 'position-1', meta: {} },
];
const magicKeyOf = (orderId: string) => `${orderId.padEnd(16, '-')}-magic-key`;

function createContext(headers: Record<string, string> = {}) {
  return {
    userId: undefined,
    user: undefined,
    roles: permissions,
    getHeader: (name: string) => headers[name],
    modules: {
      orders: {
        findOrder: async ({ orderId }: { orderId: string }) =>
          orders.find((order) => order._id === orderId) || null,
        positions: {
          findOrderPosition: async ({ itemId }: { itemId: string }) =>
            ({ 'position-1': { orderId: 'order-1' }, 'position-2': { orderId: 'order-2' } })[itemId] ||
            null,
        },
      },
      warehousing: {
        findToken: async ({ tokenId }: { tokenId: string }) =>
          tokens.find((token) => token._id === tokenId) || null,
        buildAccessKeyFromToken: async () => 'token-access-key',
      },
      passes: { buildMagicKey: async (orderId: string) => magicKeyOf(orderId) },
    },
  };
}

const allowed = (context: any, action: string, params: Record<string, string>) =>
  permissions.userHasPermission(context, action, [undefined, params] as any);

test('the order magic key opens viewOrder as x-magic-key header or otp param', async () => {
  const anonymous = createContext();
  assert.equal(await allowed(anonymous, 'viewOrder', { orderId: 'order-1' }), false);
  assert.equal(
    await allowed(anonymous, 'viewOrder', { orderId: 'order-1', otp: magicKeyOf('order-1') }),
    true,
  );
  assert.equal(
    await allowed(createContext({ 'x-magic-key': magicKeyOf('order-1') }), 'viewOrder', {
      orderId: 'order-1',
    }),
    true,
  );
  for (const otp of ['', 'wrong', magicKeyOf('order-2'), `${magicKeyOf('order-1')}x`]) {
    assert.equal(await allowed(anonymous, 'viewOrder', { orderId: 'order-1', otp }), false, otp);
  }
});

test('the token magic key stays header-only and follows the order position when meta.orderId is missing', async () => {
  const anonymous = createContext();
  assert.equal(
    await allowed(anonymous, 'viewToken', { tokenId: 'ticket', otp: magicKeyOf('order-1') }),
    false,
  );
  const withOrderKey = createContext({ 'x-magic-key': magicKeyOf('order-1') });
  assert.equal(await allowed(withOrderKey, 'viewToken', { tokenId: 'ticket' }), true);
  assert.equal(await allowed(withOrderKey, 'updateToken', { tokenId: 'ticket' }), true);

  const withSecondOrderKey = createContext({ 'x-magic-key': magicKeyOf('order-2') });
  assert.equal(
    await allowed(withSecondOrderKey, 'viewToken', { tokenId: 'ticket-without-order-id' }),
    true,
  );
  assert.equal(await allowed(withOrderKey, 'viewToken', { tokenId: 'ticket-without-order-id' }), false);

  // A ticket that left the buyer (e.g. exported to a wallet) no longer opens with the order key.
  assert.equal(await allowed(withOrderKey, 'viewToken', { tokenId: 'transferred-ticket' }), false);
});

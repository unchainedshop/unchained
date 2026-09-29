import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Order } from './order.ts';
import { RendererTypes, registerRenderer, renderers } from '../../../template-registry.ts';

const MAGIC_KEY = 'magic-key-of-order';

// The renderer registry and ROOT_URL are process-wide (suites may share one process), so each
// test sets them up itself and restores what was there before.
async function withTicketPdf(withRenderer: boolean, run: () => Promise<void>) {
  const registeredRenderers = new Map(renderers);
  const rootUrl = process.env.ROOT_URL;
  renderers.clear();
  if (withRenderer) registerRenderer(RendererTypes.ORDER_PDF, async () => undefined as any);
  process.env.ROOT_URL = 'https://engine.example';
  try {
    await run();
  } finally {
    renderers.clear();
    for (const [type, registered] of registeredRenderers) renderers.set(type, registered);
    if (rootUrl === undefined) delete process.env.ROOT_URL;
    else process.env.ROOT_URL = rootUrl;
  }
}

const order = { _id: 'order', userId: 'buyer', status: 'CONFIRMED' };

function createContext({
  userId,
  roles = [],
  magicKeyHeader,
  permissions = [],
}: {
  userId?: string;
  roles?: string[];
  magicKeyHeader?: string;
  permissions?: string[];
}) {
  return {
    userId,
    user: userId ? { _id: userId, roles } : undefined,
    getHeader: (name: string) => (name === 'x-magic-key' ? magicKeyHeader : undefined),
    roles: {
      userHasPermission: async (_context: any, action: string) =>
        roles.includes('admin') || permissions.includes(action),
    },
    modules: { passes: { buildMagicKey: async (orderId: string) => `magic-key-of-${orderId}` } },
  } as any;
}

const read = async (subject: any, context: any, params: any = {}) => ({
  magicKey: await Order.magicKey(subject, {} as never, context),
  ticketsPdfUrl: await Order.ticketsPdfUrl(subject, params, context),
});

test('the magic key goes to the order owner, administrators and whoever presents it', async () => {
  await withTicketPdf(true, async () => {
    for (const context of [
      createContext({ userId: 'buyer' }),
      createContext({ userId: 'admin', roles: ['admin'] }),
      createContext({ magicKeyHeader: MAGIC_KEY }),
    ]) {
      const { magicKey, ticketsPdfUrl } = await read(order, context, { variant: 'a4' });
      assert.equal(magicKey, MAGIC_KEY);
      const url = new URL(ticketsPdfUrl!);
      assert.equal(url.origin, 'https://engine.example');
      assert.equal(url.searchParams.get('orderId'), 'order');
      assert.equal(url.searchParams.get('otp'), MAGIC_KEY);
      assert.equal(url.searchParams.get('variant'), 'a4');
    }
  });
});

test('staff that may only view orders, other customers and wrong keys get no magic key', async () => {
  await withTicketPdf(true, async () => {
    for (const context of [
      createContext({}),
      createContext({ userId: 'other-customer' }),
      createContext({ userId: 'support', roles: ['support'], permissions: ['viewOrder', 'viewOrders'] }),
      createContext({ magicKeyHeader: 'wrong' }),
      createContext({ magicKeyHeader: `${MAGIC_KEY}x` }),
    ]) {
      assert.deepEqual(await read(order, context), { magicKey: null, ticketsPdfUrl: null });
    }
  });
});

test('carts have no magic key and the PDF link needs a registered renderer', async () => {
  await withTicketPdf(false, async () => {
    // One context per request, as the decision is kept per request and order.
    const owner = () => createContext({ userId: 'buyer' });
    assert.deepEqual(await read({ ...order, status: null }, owner()), {
      magicKey: null,
      ticketsPdfUrl: null,
    });
    assert.deepEqual(await read(order, owner()), { magicKey: MAGIC_KEY, ticketsPdfUrl: null });
    const withoutPasses = { ...owner(), modules: {} };
    assert.deepEqual(await read(order, withoutPasses), { magicKey: null, ticketsPdfUrl: null });
  });
});

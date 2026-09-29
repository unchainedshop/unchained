import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTicketsPdfUrl, buildWalletPassUrls, getTicketAttachments } from './ticket-delivery.ts';
import { RendererTypes, registerRenderer, renderers } from './template-registry.ts';

const tickets = [
  { _id: 'ticket-1', tokenSerialNumber: '1', userId: 'buyer', orderPositionId: 'position-1', meta: {} },
  {
    _id: 'ticket-2',
    tokenSerialNumber: '2',
    userId: 'buyer',
    orderPositionId: 'position-2',
    meta: { cancelled: true },
  },
  { _id: 'ticket-3', tokenSerialNumber: '3', userId: 'buyer', orderPositionId: 'position-2', meta: {} },
  { _id: 'other-order', tokenSerialNumber: '4', userId: 'x', orderPositionId: 'foreign', meta: {} },
];

const context = {
  modules: {
    orders: {
      positions: {
        findOrderPositions: async ({ orderId }: { orderId: string }) =>
          orderId === 'order-1' ? [{ _id: 'position-1' }, { _id: 'position-2' }] : [],
      },
    },
    warehousing: {
      findTokens: async ({ orderPositionId }: { orderPositionId: { $in: string[] } }) =>
        tickets.filter((token) => orderPositionId.$in.includes(token.orderPositionId)),
      buildAccessKeyFromToken: async (token: { _id: string }) => `hash-${token._id}`,
    },
    passes: { buildMagicKey: async (orderId: string) => `magic-${orderId}` },
  },
} as any;

const renderer = async () => null as any;
// Hooks stay inside this suite: at the top level they would wrap every test of a shared-process run
describe('ticket delivery links', () => {
  let registeredRenderers: Map<string, any>;
  let rootUrl: string | undefined;
  beforeEach(() => {
    registeredRenderers = new Map(renderers);
    renderers.clear();
    rootUrl = process.env.ROOT_URL;
    process.env.ROOT_URL = 'https://engine.example.com/';
  });
  afterEach(() => {
    renderers.clear();
    for (const [type, registered] of registeredRenderers) renderers.set(type, registered);
    if (rootUrl === undefined) delete process.env.ROOT_URL;
    else process.env.ROOT_URL = rootUrl;
  });

  test('ticket links exist only for registered renderers', async () => {
    assert.equal(await buildTicketsPdfUrl('order-1', context), null);
    assert.deepEqual(await buildWalletPassUrls(tickets[0] as any, context), {});
    assert.deepEqual(await getTicketAttachments('order-1', context, { appleWalletPasses: true }), []);
  });

  test('the PDF link carries the order magic key as otp, relative to ROOT_URL', async () => {
    registerRenderer(RendererTypes.ORDER_PDF, renderer);
    assert.equal(
      await buildTicketsPdfUrl('order-1', context),
      'https://engine.example.com/rest/print_tickets?orderId=order-1&otp=magic-order-1',
    );
    assert.equal(
      await buildTicketsPdfUrl('order-1', context, {
        variant: 'a4',
        rootUrl: 'http://shop.test/engine',
      }),
      'http://shop.test/engine/rest/print_tickets?orderId=order-1&otp=magic-order-1&variant=a4',
    );
    delete process.env.ROOT_URL;
    assert.equal(
      await buildTicketsPdfUrl('order-1', context),
      'http://localhost:4010/rest/print_tickets?orderId=order-1&otp=magic-order-1',
    );
  });

  test('wallet links carry the token access key', async () => {
    registerRenderer(RendererTypes.APPLE_WALLET, renderer);
    assert.deepEqual(await buildWalletPassUrls(tickets[0] as any, context), {
      appleWallet:
        'https://engine.example.com/rest/apple-wallet/download/ticket-1.pkpass?hash=hash-ticket-1',
    });
    registerRenderer(RendererTypes.GOOGLE_WALLET, renderer);
    assert.deepEqual(await buildWalletPassUrls(tickets[0] as any, context), {
      appleWallet:
        'https://engine.example.com/rest/apple-wallet/download/ticket-1.pkpass?hash=hash-ticket-1',
      googleWallet: 'https://engine.example.com/rest/google-wallet/download/ticket-1?hash=hash-ticket-1',
    });
  });

  test('ticket attachments list the PDF and the Apple passes of all tickets that are not cancelled', async () => {
    registerRenderer(RendererTypes.ORDER_PDF, renderer);
    registerRenderer(RendererTypes.APPLE_WALLET, renderer);
    assert.deepEqual(await getTicketAttachments('order-1', context), [
      {
        filename: 'tickets.pdf',
        href: 'https://engine.example.com/rest/print_tickets?orderId=order-1&otp=magic-order-1',
      },
    ]);
    assert.deepEqual(
      await getTicketAttachments('order-1', context, {
        pdf: { filename: 'theater.pdf', variant: 'a4' },
        appleWalletPasses: true,
      }),
      [
        {
          filename: 'theater.pdf',
          href: 'https://engine.example.com/rest/print_tickets?orderId=order-1&otp=magic-order-1&variant=a4',
        },
        {
          filename: 'ticket-ticket-1.pkpass',
          href: 'https://engine.example.com/rest/apple-wallet/download/ticket-1.pkpass?hash=hash-ticket-1',
        },
        {
          filename: 'ticket-ticket-3.pkpass',
          href: 'https://engine.example.com/rest/apple-wallet/download/ticket-3.pkpass?hash=hash-ticket-3',
        },
      ],
    );
    assert.deepEqual(
      (await getTicketAttachments('order-1', context, { pdf: false, appleWalletPasses: true })).map(
        ({ filename }) => filename,
      ),
      ['ticket-ticket-1.pkpass', 'ticket-ticket-3.pkpass'],
    );
    assert.deepEqual(
      await getTicketAttachments('order-without-tickets', context, {
        pdf: false,
        appleWalletPasses: true,
      }),
      [],
    );
  });
});

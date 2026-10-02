import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findTicketCategoryTitle, findTicketPrice, getTicketDetails } from './ticket-details.ts';

const performance = {
  _id: 'performance',
  meta: { slot: '2030-05-01T18:00:00.000Z', category: 'balcony', location: 'Main hall' },
};
const standalone = {
  _id: 'standalone',
  meta: { slot: '2030-05-01T18:00:00.000Z', category: 'Concert' },
};

const texts = {
  de: { title: 'Balkon' },
  en: { title: 'Balcony' },
};

const api = {
  modules: {
    products: {
      findProduct: async ({ productId }: { productId: string }) =>
        productId === 'performance' ? performance : null,
      firstActiveProductProxy: async (productId: string) =>
        productId === 'performance' ? { _id: 'production' } : null,
      texts: {
        findLocalizedText: async () => ({ title: 'Hamlet', subtitle: 'Tragedy' }),
      },
      variations: {
        findProductVariationByKey: async ({ productId, key }: { productId: string; key: string }) =>
          productId === 'production' && key === 'category' ? { _id: 'variation' } : null,
        texts: {
          findLocalizedVariationText: async ({
            productVariationOptionValue,
            locale,
          }: {
            productVariationOptionValue: string;
            locale: Intl.Locale;
          }) =>
            productVariationOptionValue === 'balcony'
              ? texts[locale.language as keyof typeof texts]
              : null,
        },
      },
    },
    orders: {
      findOrder: async ({ orderId }: { orderId: string }) =>
        orderId === 'order' ? { _id: 'order', currencyCode: 'CHF' } : null,
      positions: {
        findOrderPositions: async () => [
          { productId: 'other', quantity: 1, calculation: [{ category: 'ITEM', amount: 999 }] },
          {
            productId: 'performance',
            quantity: 2,
            calculation: [
              { category: 'ITEM', amount: 7000 },
              { category: 'DISCOUNT', amount: -1000 },
            ],
          },
        ],
      },
    },
    warehousing: {
      buildAccessKeyFromToken: async ({ _id }: { _id: string }) => `key-${_id}`,
    },
  },
} as any;

test('the category title is the option text of the production category', async () => {
  assert.equal(await findTicketCategoryTitle(performance as any, api, { locale: 'de' }), 'Balkon');
  assert.equal(
    await findTicketCategoryTitle(performance as any, api, { locale: new Intl.Locale('en') }),
    'Balcony',
  );
});

test('the category title falls back to the stored category', async () => {
  assert.equal(await findTicketCategoryTitle(standalone as any, api, { locale: 'de' }), 'Concert');
  assert.equal(
    await findTicketCategoryTitle(
      { ...performance, meta: { ...performance.meta, category: 'box' } } as any,
      api,
      {
        locale: 'de',
      },
    ),
    'box',
  );
  assert.equal(
    await findTicketCategoryTitle({ _id: 'x', meta: {} } as any, api, { locale: 'de' }),
    undefined,
  );
});

test('the ticket price is the item price of its order position, before discounts', async () => {
  const token = { _id: 't', productId: 'performance', meta: { orderId: 'order' } } as any;
  assert.deepEqual(await findTicketPrice(token, api), { amount: 3500, currencyCode: 'CHF' });
  assert.equal(await findTicketPrice({ ...token, meta: {} }, api), null);
  assert.equal(await findTicketPrice({ ...token, meta: { orderId: 'gone' } }, api), null);
});

test('getTicketDetails collects what a ticket shows', async () => {
  const details = await getTicketDetails(
    {
      _id: 'ticket',
      productId: 'performance',
      tokenSerialNumber: '7',
      meta: { orderId: 'order', attendeeName: ' Ada ' },
    } as any,
    api,
    { locale: 'de', scanBaseUrl: 'https://shop.example.com/tickets/' },
  );
  assert.equal(details.title, 'Hamlet');
  assert.equal(details.categoryTitle, 'Balkon');
  assert.equal(details.event.location, 'Main hall');
  assert.deepEqual(details.price, { amount: 3500, currencyCode: 'CHF' });
  assert.equal(details.status, 'VALID');
  assert.equal(details.attendeeName, 'Ada');
  assert.equal(details.serialNumber, '7');
  assert.equal(details.scanPayload, 'https://shop.example.com/tickets/ticket?hash=key-ticket');
});

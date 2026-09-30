import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient } from 'mongodb';
import { configureProductsModule } from '@unchainedshop/core-products';
import productionServices, { createTicketProductionSyncHandlers } from './production-services.ts';
import { TICKET_PRODUCTION_TAG } from './production.ts';

const {
  createTicketProduction,
  addTicketPerformance,
  updateTicketPerformance,
  removeTicketPerformance,
  publishTicketProduction,
  unpublishTicketProduction,
  addTicketCategory,
  updateTicketCategory,
  removeTicketCategory,
  updateTicketProduction,
  syncTicketProduction,
  removeTicketProductionMediaCopies,
  removeTicketProduction,
} = productionServices.ticketing;

let server: MongoMemoryServer;
let client: MongoClient;
let modules: any;
const reserved: Record<string, number> = {};
const issued: Record<string, number> = {};

before(async () => {
  server = await MongoMemoryServer.create();
  client = new MongoClient(server.getUri());
  await client.connect();
  const db = client.db('ticket-productions');
  modules = {
    products: await configureProductsModule({ db, migrationRepository: undefined as any }),
    warehousing: { tokensCount: async ({ productId }: any) => issued[productId] ?? 0 },
    passes: { countReservedTickets: async ({ productId }: any) => reserved[productId] ?? 0 },
  };
});

after(async () => {
  await client.close();
  await server.stop();
});

const CHF = (amount: number) => [{ amount, currencyCode: 'CHF', countryCode: 'CH' }];
const first = '2026-11-01T18:00:00.000Z';
const second = '2026-11-02T18:00:00.000Z';

const performancesOf = async (productionId: string) => {
  const production = await modules.products.findProduct({ productId: productionId });
  return Promise.all(
    (production.proxy?.assignments ?? []).map(async ({ vector, productId }: any) => ({
      vector,
      product: await modules.products.findProduct({ productId }),
    })),
  );
};

const optionsOf = async (productId: string, key: string) =>
  (await modules.products.variations.findProductVariationByKey({ productId, key }))?.options;

const createHamlet = () =>
  createTicketProduction.call(modules, {
    texts: [{ locale: 'de', title: 'Hamlet', subtitle: 'Tragödie', slug: 'hamlet' }],
    tags: ['organizer-a'],
    location: 'Grosse Bühne',
    durationMinutes: 150,
    doorsOpenMinutesBefore: 30,
    saleRules: { salesStart: '2026-10-01T08:00:00.000Z', maxPerOrder: 6 },
    categories: [
      {
        code: 'adult',
        texts: [{ locale: 'de', title: 'Erwachsene' }],
        capacity: 100,
        pricing: CHF(4500),
      },
      {
        code: 'reduced',
        texts: [{ locale: 'de', title: 'Ermässigt' }],
        capacity: 20,
        pricing: CHF(2500),
      },
    ],
    performances: [
      { startsAt: first },
      { startsAt: second, tickets: [{ category: 'adult', supply: 50 }] },
    ],
  });

test('a production is a configurable product with a performance per start and category', async () => {
  const production = await createHamlet();
  assert.equal(production.type, 'CONFIGURABLE_PRODUCT');
  assert.equal(production.status, null, 'draft');
  assert.deepEqual(production.tags, [TICKET_PRODUCTION_TAG, 'organizer-a']);
  assert.deepEqual(production.meta, {
    location: 'Grosse Bühne',
    durationMinutes: 150,
    doorsOpenMinutesBefore: 30,
    saleRules: { salesStart: new Date('2026-10-01T08:00:00.000Z'), maxPerOrder: 6 },
    ticketCategories: {
      adult: { capacity: 100, pricing: CHF(4500) },
      reduced: { capacity: 20, pricing: CHF(2500) },
    },
  });
  assert.deepEqual(await optionsOf(production._id, 'slot'), [first, second]);
  assert.deepEqual(await optionsOf(production._id, 'category'), ['adult', 'reduced']);
  const categoryVariation = await modules.products.variations.findProductVariationByKey({
    productId: production._id,
    key: 'category',
  });
  const [adultName] = await modules.products.variations.texts.findVariationTexts({
    productVariationId: categoryVariation._id,
    productVariationOptionValue: 'adult',
  });
  assert.equal(adultName.title, 'Erwachsene');

  const performances = await performancesOf(production._id);
  assert.deepEqual(
    performances.map(({ vector }: any) => vector),
    [
      { slot: first, category: 'adult' },
      { slot: first, category: 'reduced' },
      { slot: second, category: 'adult' },
      { slot: second, category: 'reduced' },
    ],
  );
  const [adultFirst, , adultSecond] = performances.map(({ product }: any) => product);
  assert.equal(adultFirst.type, 'TOKENIZED_PRODUCT');
  assert.equal(adultFirst.status, null, 'draft');
  assert.deepEqual(adultFirst.tags, ['organizer-a']);
  assert.deepEqual(adultFirst.meta, {
    slot: new Date(first),
    category: 'adult',
    location: 'Grosse Bühne',
    durationMinutes: 150,
    doorsOpenMinutesBefore: 30,
  });
  assert.deepEqual(adultFirst.tokenization, { contractStandard: 'ERC721', supply: 100 });
  assert.deepEqual(adultFirst.commerce, { pricing: CHF(4500) });
  // A ticket of one performance overrides the category defaults
  assert.equal(adultSecond.tokenization.supply, 50);
  assert.deepEqual(adultSecond.commerce, { pricing: CHF(4500) });

  const [text] = await modules.products.texts.findTexts({ productId: adultFirst._id });
  assert.equal(text.title, 'Hamlet');
  assert.equal(text.subtitle, 'Tragödie');
  assert.equal(text.slug, 'hamlet-20261101-1800-adult');
});

test('a production without categories has one performance product per start', async () => {
  const production = await createTicketProduction.call(modules, {
    texts: [{ locale: 'de', title: 'Kochkurs' }],
    performances: [{ startsAt: first, tickets: [{ supply: 12, pricing: CHF(9000) }] }],
  });
  assert.deepEqual(production.meta, {});
  assert.equal(await optionsOf(production._id, 'category'), undefined);
  const [performance] = await performancesOf(production._id);
  assert.deepEqual(performance.vector, { slot: first });
  assert.deepEqual(performance.product.meta, { slot: new Date(first) });
  assert.equal(performance.product.tokenization.supply, 12);
  assert.deepEqual(performance.product.commerce, { pricing: CHF(9000) });
});

test('invalid productions are refused before anything is stored', async () => {
  const count = await modules.products.count({ includeDrafts: true });
  for (const [input, cause] of [
    [{ texts: [], categories: [{ code: 'Adult Price' }] }, 'INVALID_TICKET_CATEGORY_CODE'],
    [{ texts: [], categories: [{ code: 'a' }, { code: 'a' }] }, 'INVALID_TICKET_CATEGORY_CODE'],
    [{ texts: [], performances: [{ startsAt: 'soon' }] }, 'INVALID_TICKET_PERFORMANCE'],
    [
      { texts: [], performances: [{ startsAt: first }, { startsAt: first }] },
      'TICKET_PERFORMANCE_EXISTS',
    ],
    [
      {
        texts: [],
        categories: [{ code: 'a' }],
        performances: [{ startsAt: first, tickets: [{ category: 'b' }] }],
      },
      'TICKET_CATEGORY_NOT_FOUND',
    ],
    [{ texts: [], saleRules: { maxPerOrder: -1 } }, 'INVALID_TICKET_SALE_RULES'],
  ] as const) {
    await assert.rejects(createTicketProduction.call(modules, input as any), { cause }, cause);
  }
  assert.equal(await modules.products.count({ includeDrafts: true }), count);
});

test('performances are added, changed, rescheduled and removed', async () => {
  const production = await createHamlet();
  const third = '2026-11-03T18:00:00.000Z';

  await addTicketPerformance.call(modules, production._id, {
    startsAt: third,
    location: 'Studio',
    saleRules: { maxPerOrder: 2 },
  });
  let performances = await performancesOf(production._id);
  assert.equal(performances.length, 6);
  const added = performances.filter(({ vector }: any) => vector.slot === third);
  assert.deepEqual(added[0].product.meta, {
    slot: new Date(third),
    category: 'adult',
    location: 'Studio',
    durationMinutes: 150,
    doorsOpenMinutesBefore: 30,
    overridden: ['location'],
    saleRules: { maxPerOrder: 2 },
  });
  await assert.rejects(addTicketPerformance.call(modules, production._id, { startsAt: third }), {
    cause: 'TICKET_PERFORMANCE_EXISTS',
  });

  // Details and tickets of one performance
  await updateTicketPerformance.call(modules, production._id, first, {
    location: 'Foyer',
    tickets: [{ category: 'reduced', supply: 10, pricing: CHF(2000) }],
  });
  performances = await performancesOf(production._id);
  const [adultFirst, reducedFirst] = performances.map(({ product }: any) => product);
  assert.equal(adultFirst.meta.location, 'Foyer');
  assert.deepEqual(adultFirst.meta.overridden, ['location']);
  assert.equal(reducedFirst.tokenization.supply, 10);
  assert.deepEqual(reducedFirst.commerce, { pricing: CHF(2000) });
  assert.equal(adultFirst.tokenization.supply, 100);

  // null takes the production value back
  await updateTicketPerformance.call(modules, production._id, first, { location: null });
  const [inherited] = (await performancesOf(production._id)).map(({ product }: any) => product);
  assert.equal(inherited.meta.location, 'Grosse Bühne');
  assert.deepEqual(inherited.meta.overridden, []);

  // The supply cannot go below the tickets that are gone
  reserved[reducedFirst._id] = 12;
  await assert.rejects(
    updateTicketPerformance.call(modules, production._id, first, {
      tickets: [{ category: 'reduced', supply: 11 }],
    }),
    { cause: 'TICKET_SUPPLY_BELOW_SOLD' },
  );

  // Rescheduling moves the option, the vectors, the start and the slug
  const moved = '2026-11-04T19:30:00.000Z';
  await updateTicketPerformance.call(modules, production._id, third, { startsAt: moved });
  assert.deepEqual(await optionsOf(production._id, 'slot'), [first, second, moved]);
  performances = await performancesOf(production._id);
  const rescheduled = performances.filter(({ vector }: any) => vector.slot === moved);
  assert.equal(rescheduled.length, 2);
  assert.deepEqual(rescheduled[0].product.meta.slot, new Date(moved));
  const [movedText] = await modules.products.texts.findTexts({ productId: rescheduled[0].product._id });
  const [productionText] = await modules.products.texts.findTexts({ productId: production._id });
  assert.equal(movedText.slug, `${productionText.slug}-20261104-1930-adult`);
  await assert.rejects(
    updateTicketPerformance.call(modules, production._id, moved, { startsAt: first }),
    {
      cause: 'TICKET_PERFORMANCE_EXISTS',
    },
  );
  await assert.rejects(updateTicketPerformance.call(modules, production._id, third, { location: 'x' }), {
    cause: 'TICKET_PERFORMANCE_NOT_FOUND',
  });

  // Removing needs a performance without tickets; the products are returned for removal
  issued[rescheduled[1].product._id] = 1;
  await assert.rejects(removeTicketPerformance.call(modules, production._id, moved), {
    cause: 'TICKET_PERFORMANCE_HAS_TICKETS',
  });
  delete issued[rescheduled[1].product._id];
  const removedIds = await removeTicketPerformance.call(modules, production._id, moved);
  assert.deepEqual(removedIds.toSorted(), rescheduled.map(({ product }: any) => product._id).toSorted());
  assert.deepEqual(await optionsOf(production._id, 'slot'), [first, second]);
  assert.equal((await performancesOf(production._id)).length, 4);
});

test('publishing a production publishes its performances, new ones follow its status', async () => {
  const production = await createHamlet();
  await publishTicketProduction.call(modules, production._id);
  let performances = await performancesOf(production._id);
  assert.ok(performances.every(({ product }: any) => product.status === 'ACTIVE'));
  assert.equal((await modules.products.findProduct({ productId: production._id })).status, 'ACTIVE');

  await addTicketPerformance.call(modules, production._id, { startsAt: '2026-12-01T18:00:00.000Z' });
  performances = await performancesOf(production._id);
  assert.equal(performances.length, 6);
  assert.ok(performances.every(({ product }: any) => product.status === 'ACTIVE'));

  await unpublishTicketProduction.call(modules, production._id);
  performances = await performancesOf(production._id);
  assert.ok(performances.every(({ product }: any) => product.status === null));
});

test('categories are added, changed and removed', async () => {
  const production = await createTicketProduction.call(modules, {
    texts: [{ locale: 'de', title: 'Lesung' }],
    performances: [
      { startsAt: first, tickets: [{ supply: 30, pricing: CHF(2000) }] },
      { startsAt: second, tickets: [{ supply: 30, pricing: CHF(2000) }] },
    ],
  });
  const before = (await performancesOf(production._id)).map(({ product }: any) => product._id);

  // The first category takes over the performances that exist
  await addTicketCategory.call(modules, production._id, {
    code: 'adult',
    texts: [{ locale: 'de', title: 'Erwachsene' }],
    capacity: 40,
    pricing: CHF(2500),
  });
  let performances = await performancesOf(production._id);
  assert.deepEqual(
    performances.map(({ vector }: any) => vector),
    [
      { slot: first, category: 'adult' },
      { slot: second, category: 'adult' },
    ],
  );
  assert.deepEqual(
    performances.map(({ product }: any) => product._id),
    before,
  );
  assert.equal(performances[0].product.meta.category, 'adult');
  assert.equal(performances[0].product.tokenization.supply, 30, 'existing tickets are kept');
  assert.deepEqual(await optionsOf(production._id, 'category'), ['adult']);

  // Further categories get a product per performance
  await addTicketCategory.call(modules, production._id, {
    code: 'reduced',
    capacity: 10,
    pricing: CHF(1500),
  });
  performances = await performancesOf(production._id);
  assert.equal(performances.length, 4);
  const reduced = performances.filter(({ vector }: any) => vector.category === 'reduced');
  assert.deepEqual(
    reduced.map(({ product }: any) => product.tokenization.supply),
    [10, 10],
  );
  for (const [input, cause] of [
    [{ code: 'reduced' }, 'TICKET_CATEGORY_EXISTS'],
    [{ code: 'Reduced!' }, 'INVALID_TICKET_CATEGORY_CODE'],
  ] as const) {
    await assert.rejects(addTicketCategory.call(modules, production._id, input), { cause });
  }

  // Defaults change, optionally also for the performances
  await updateTicketCategory.call(modules, production._id, 'reduced', {
    texts: [{ locale: 'de', title: 'Ermässigt' }],
    capacity: 8,
    pricing: CHF(1200),
  });
  performances = await performancesOf(production._id);
  assert.equal(
    performances.find(({ vector }: any) => vector.category === 'reduced').product.tokenization.supply,
    10,
  );
  const updated = await modules.products.findProduct({ productId: production._id });
  assert.deepEqual(updated.meta.ticketCategories.reduced, { capacity: 8, pricing: CHF(1200) });

  reserved[reduced[0].product._id] = 9;
  await assert.rejects(
    updateTicketCategory.call(
      modules,
      production._id,
      'reduced',
      { capacity: 8 },
      { applyToPerformances: true },
    ),
    { cause: 'TICKET_SUPPLY_BELOW_SOLD' },
  );
  delete reserved[reduced[0].product._id];
  await updateTicketCategory.call(modules, production._id, 'reduced', {}, { applyToPerformances: true });
  performances = await performancesOf(production._id);
  for (const { vector, product } of performances.filter(
    ({ vector }: any) => vector.category === 'reduced',
  )) {
    assert.equal(product.tokenization.supply, 8, vector.slot);
    assert.deepEqual(product.commerce, { pricing: CHF(1200) });
  }

  // Removing needs a category without tickets and cannot remove the last one
  issued[reduced[1].product._id] = 1;
  await assert.rejects(removeTicketCategory.call(modules, production._id, 'reduced'), {
    cause: 'TICKET_CATEGORY_HAS_TICKETS',
  });
  delete issued[reduced[1].product._id];
  const removedIds = await removeTicketCategory.call(modules, production._id, 'reduced');
  assert.deepEqual(removedIds.toSorted(), reduced.map(({ product }: any) => product._id).toSorted());
  assert.deepEqual(await optionsOf(production._id, 'category'), ['adult']);
  assert.equal((await performancesOf(production._id)).length, 2);
  assert.equal(
    (await modules.products.findProduct({ productId: production._id })).meta.ticketCategories.reduced,
    undefined,
  );
  await assert.rejects(removeTicketCategory.call(modules, production._id, 'adult'), {
    cause: 'INVALID_TICKET_CATEGORY',
  });
});

test('changes of a production are taken over by its performances', async () => {
  const production = await createHamlet();
  await updateTicketPerformance.call(modules, production._id, second, { location: 'Studio' });
  const [productionText] = await modules.products.texts.findTexts({ productId: production._id });

  await updateTicketProduction.call(modules, production._id, {
    texts: [{ locale: 'de', title: 'Hamlet (Neuinszenierung)', subtitle: null }],
    tags: ['organizer-a', 'festival'],
    location: 'Neue Bühne',
    durationMinutes: null,
    saleRules: { maxPerOrder: 4, salesStart: null },
  });
  const stored = await modules.products.findProduct({ productId: production._id });
  assert.deepEqual(stored.tags, [TICKET_PRODUCTION_TAG, 'organizer-a', 'festival']);
  assert.equal(stored.meta.location, 'Neue Bühne');
  assert.equal(stored.meta.durationMinutes, null);
  assert.deepEqual(stored.meta.saleRules, { maxPerOrder: 4, salesStart: null });
  const [storedText] = await modules.products.texts.findTexts({ productId: production._id });
  assert.equal(storedText.title, 'Hamlet (Neuinszenierung)');
  assert.equal(storedText.slug, productionText.slug, 'the slug stays');

  for (const { vector, product } of await performancesOf(production._id)) {
    assert.deepEqual(product.tags, ['organizer-a', 'festival']);
    assert.equal(product.meta.location, vector.slot === second ? 'Studio' : 'Neue Bühne');
    assert.equal(product.meta.durationMinutes, null);
    assert.equal(product.meta.saleRules, undefined, 'sale rules are inherited, not copied');
    const [text] = await modules.products.texts.findTexts({ productId: product._id });
    assert.equal(text.title, 'Hamlet (Neuinszenierung)');
    assert.equal(text.subtitle, null);
    assert.match(text.slug, /-20261[12]0[12]-1800-(adult|reduced)$/);
  }
});

test('the media of a production are shared with its performances', async () => {
  const production = await createHamlet();
  const cover = await modules.products.media.create({
    productId: production._id,
    mediaId: 'cover-file',
  });
  await syncTicketProduction.call(modules, production._id);
  await syncTicketProduction.call(modules, production._id);
  const performances = await performancesOf(production._id);
  for (const { product } of performances) {
    const medias = await modules.products.media.findProductMedias({ productId: product._id });
    assert.equal(medias.length, 1, 'copied once');
    assert.equal(medias[0].mediaId, 'cover-file');
    assert.deepEqual(medias[0].meta, { productionMediaId: cover._id });
  }
  // Performances added later get the media as well
  await addTicketPerformance.call(modules, production._id, { startsAt: '2026-12-24T18:00:00.000Z' });
  const added = (await performancesOf(production._id)).at(-1);
  assert.equal(
    (await modules.products.media.findProductMedias({ productId: added.product._id })).length,
    1,
  );

  await modules.products.media.delete(cover._id);
  await removeTicketProductionMediaCopies.call(modules, cover._id);
  for (const { product } of await performancesOf(production._id)) {
    assert.deepEqual(await modules.products.media.findProductMedias({ productId: product._id }), []);
  }
});

test('a production without tickets is removed with its performances', async () => {
  const production = await createHamlet();
  const performances = await performancesOf(production._id);
  issued[performances[0].product._id] = 2;
  await assert.rejects(removeTicketProduction.call(modules, production._id), {
    cause: 'TICKET_PERFORMANCE_HAS_TICKETS',
  });
  delete issued[performances[0].product._id];
  const productIds = await removeTicketProduction.call(modules, production._id);
  assert.deepEqual(
    productIds,
    [...performances.map(({ product }: any) => product._id), production._id],
    'performances first, the production last',
  );
});

test('media, texts and tags changed on a production in the core tabs reach its performances', async () => {
  // The handlers subscribed to the product events, called with the payloads core emits
  const handlers = createTicketProductionSyncHandlers({ modules });
  const production = await createHamlet();
  const performances = await performancesOf(production._id);
  const mediaOf = async (productId: string) =>
    (await modules.products.media.findProductMedias({ productId })).map(({ mediaId }: any) => mediaId);
  const forEachPerformance = async (check: (product: any) => Promise<void>) => {
    for (const { product } of performances) await check(product);
  };

  const poster = await modules.products.media.create({ productId: production._id, mediaId: 'poster' });
  const photo = await modules.products.media.create({ productId: production._id, mediaId: 'photo' });
  // Added together, synced one after another: no media is copied twice
  await Promise.all([
    handlers.PRODUCT_ADD_MEDIA({ payload: { productMedia: poster } }),
    handlers.PRODUCT_ADD_MEDIA({ payload: { productMedia: photo } }),
  ]);
  await forEachPerformance(async (product) =>
    assert.deepEqual(await mediaOf(product._id), ['poster', 'photo']),
  );

  const productMedias = await modules.products.media.updateManualOrder({
    sortKeys: [
      { productMediaId: photo._id, sortKey: 1 },
      { productMediaId: poster._id, sortKey: 2 },
    ],
  });
  await handlers.PRODUCT_REORDER_MEDIA({ payload: { productMedias } });
  await forEachPerformance(async (product) =>
    assert.deepEqual(await mediaOf(product._id), ['photo', 'poster']),
  );

  await modules.products.media.delete(poster._id);
  await handlers.PRODUCT_REMOVE_MEDIA({ payload: { productMediaId: poster._id } });
  await forEachPerformance(async (product) => assert.deepEqual(await mediaOf(product._id), ['photo']));

  // The core texts tab changes texts one locale at a time; the slugs of the dates stay
  const [slugBefore] = await modules.products.texts.findTexts({
    productId: performances[0].product._id,
  });
  await modules.products.texts.updateTexts(production._id, [
    { locale: 'de', title: 'Hamlet (Gastspiel)', description: 'Neu' },
  ]);
  await handlers.PRODUCT_UPDATE_TEXT({ payload: { productId: production._id } });
  await forEachPerformance(async (product) => {
    const [text] = await modules.products.texts.findTexts({ productId: product._id });
    assert.equal(text.title, 'Hamlet (Gastspiel)');
    assert.equal(text.description, 'Neu');
  });
  const [slugAfter] = await modules.products.texts.findTexts({ productId: performances[0].product._id });
  assert.equal(slugAfter.slug, slugBefore.slug);

  // Tags changed in the core product list or tag editor; other updates are ignored
  const tags = [TICKET_PRODUCTION_TAG, 'organizer-b'];
  await modules.products.update(production._id, { tags });
  await handlers.PRODUCT_UPDATE({ payload: { productId: production._id, tags } });
  await forEachPerformance(async (product) => {
    const stored = await modules.products.findProduct({ productId: product._id });
    assert.deepEqual(stored.tags, ['organizer-b']);
  });
  await handlers.PRODUCT_UPDATE({ payload: { productId: performances[0].product._id } });
});

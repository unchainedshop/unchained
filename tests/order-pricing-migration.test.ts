import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import { OrderPricingSheet, OrderPricingRowCategory } from '@unchainedshop/core';
import { configureOrdersModule } from '@unchainedshop/core-orders';
import { Collection } from 'mongodb';
import { setupDatabase } from './helpers.js';

const legacyCalculation = [
  { category: 'ITEMS', amount: 10_000, meta: { adapter: 'items', reference: 'historical-price' } },
  { category: 'TAXES', baseCategory: 'ITEMS', amount: 715, meta: { adapter: 'items' } },
  { category: 'DELIVERY', amount: 2_000 },
  { category: 'TAXES', baseCategory: 'DELIVERY', amount: 143 },
  { category: 'PAYMENT', amount: 500 },
  { category: 'TAXES', baseCategory: 'PAYMENT', amount: 36 },
  { category: 'DISCOUNTS', amount: -1_000, discountId: 'first' },
  { category: 'TAXES', baseCategory: 'DISCOUNTS', amount: -71.5, discountId: 'first' },
  { category: 'DISCOUNTS', amount: -250, discountId: 'second' },
  { category: 'TAXES', baseCategory: 'DISCOUNTS', amount: -17.9, discountId: 'second' },
];

describe('persisted order pricing migration', () => {
  let db;
  let migrate: () => Promise<void>;
  let ordersModule: Awaited<ReturnType<typeof configureOrdersModule>>;

  beforeEach(async () => {
    [db] = await setupDatabase();
    const migrations = new Map();
    // Exercise the normal core-orders registration, not a separate test transform.
    ordersModule = await configureOrdersModule({
      db,
      migrationRepository: {
        db,
        migrations,
        register: (migration) => migrations.set(migration.id, migration),
        allMigrations: () => [...migrations.values()],
      },
    });
    const migration = migrations.get(20260907120000);
    assert.ok(migration, 'core-orders registers the net calculation migration');
    migrate = () => migration.up({ logger: undefined });
  });

  test('preserves historical totals, category prices and discounts for every order status', async () => {
    const orders = [null, 'PENDING', 'CONFIRMED', 'FULFILLED', 'REJECTED'].map((status, index) => ({
      _id: `legacy-${index}`,
      status,
      currencyCode: 'CHF',
      created: new Date('2019-10-11'),
      updated: new Date('2019-10-12'),
      calculation: legacyCalculation,
      context: { transactionId: 'keep-original' },
    }));
    await db.collection('orders').insertMany(orders);

    await migrate();

    for (const original of orders) {
      const migrated = await db.collection('orders').findOne({ _id: original._id });
      assert.deepEqual({ ...migrated, calculation: original.calculation }, original);
      assert.deepEqual(migrated.calculation[0], original.calculation[0]);
      const sheet = OrderPricingSheet(migrated);
      assert.equal(sheet.total().amount, 11_250);
      assert.equal(sheet.total({ useNetPrice: true }).amount, 10_445);
      assert.ok(Math.abs(sheet.gross() - 11_250) < 1e-9);
      assert.ok(Math.abs(sheet.net() - 10_445.4) < 1e-9);
      assert.ok(Math.abs(sheet.taxSum() - 804.6) < 1e-9);
      for (const [category, gross, net] of [
        [OrderPricingRowCategory.Items, 10_000, 9_285],
        [OrderPricingRowCategory.Delivery, 2_000, 1_857],
        [OrderPricingRowCategory.Payment, 500, 464],
        [OrderPricingRowCategory.Discounts, -1_250, -1_161],
      ] as const) {
        assert.equal(sheet.total({ category }).amount, gross);
        assert.equal(sheet.total({ category, useNetPrice: true }).amount, net);
      }
      assert.deepEqual(sheet.discountPrices(), [
        { amount: -1_000, discountId: 'first', currencyCode: 'CHF' },
        { amount: -250, discountId: 'second', currencyCode: 'CHF' },
      ]);
      assert.equal(sheet.total({ discountId: 'first' }).amount, -1_000);
      assert.equal(sheet.total({ discountId: 'first', useNetPrice: true }).amount, -928);
    }
  });

  test('is safe to rerun concurrently and skips net, empty and absent calculations', async () => {
    const newSheet = OrderPricingSheet({ currencyCode: 'BTC' });
    newSheet.addItems({ amount: 9_285, taxAmount: 715 });
    const untouched = [
      { _id: 'net', currencyCode: 'BTC', calculation: newSheet.calculation },
      {
        _id: 'net-offsets',
        calculation: [
          { category: 'ITEMS', amount: 10_000 },
          { category: 'ITEMS', amount: -715, isNetPrice: true },
          { category: 'TAXES', baseCategory: 'ITEMS', amount: 715 },
        ],
      },
      { _id: 'empty', calculation: [] },
      { _id: 'absent' },
      { _id: 'null-calculation', calculation: null },
    ];
    await db
      .collection('orders')
      .insertMany([
        ...untouched,
        { _id: 'legacy', calculation: legacyCalculation },
        { _id: 'tax-free', calculation: [{ category: 'ITEMS', amount: 0.125 }] },
      ]);
    const originalUntouched = await db
      .collection('orders')
      .find({
        _id: { $in: untouched.map(({ _id }) => _id) },
      })
      .toArray();
    await Promise.all([migrate(), migrate()]);
    const firstRun = await db.collection('orders').find({}).sort({ _id: 1 }).toArray();
    await migrate();
    assert.deepEqual(await db.collection('orders').find({}).sort({ _id: 1 }).toArray(), firstRun);
    for (const order of originalUntouched) {
      assert.deepEqual(await db.collection('orders').findOne({ _id: order._id }), order);
    }
    const taxFree = await db.collection('orders').findOne({ _id: 'tax-free' });
    assert.equal(OrderPricingSheet(taxFree).gross(), 0.125);
    assert.equal(OrderPricingSheet(taxFree).net(), 0.125);
  });

  test('attributes older unlabelled tax rows from their preceding category and discount', async () => {
    await db.collection('orders').insertOne({
      _id: 'unlabelled',
      currencyCode: 'CHF',
      calculation: [
        { category: 'ITEMS', amount: 10_000 },
        { category: 'TAXES', amount: 715 },
        { category: 'DISCOUNTS', amount: -1_000, discountId: 'first' },
        { category: 'TAXES', amount: -71.5 },
      ],
    });
    await migrate();
    const sheet = OrderPricingSheet(await db.collection('orders').findOne({ _id: 'unlabelled' }));
    assert.equal(sheet.gross(), 9_000);
    assert.equal(sheet.net(), 8_356.5);
    assert.equal(sheet.total({ category: 'ITEMS' }).amount, 10_000);
    assert.deepEqual(sheet.discountPrices('first'), [
      { amount: -1_000, currencyCode: 'CHF', discountId: 'first' },
    ]);
  });

  test('keeps multiple tax components and fractional amounts without rounding', async () => {
    await db.collection('orders').insertOne({
      _id: 'multiple-taxes',
      currencyCode: 'BTC',
      calculation: [
        { category: 'ITEMS', amount: 1.25 },
        { category: 'TAXES', baseCategory: 'ITEMS', amount: 0.125 },
        { category: 'TAXES', baseCategory: 'ITEMS', amount: 0.0625 },
        { category: 'ITEMS', amount: 2.5 },
        { category: 'TAXES', baseCategory: 'ITEMS', amount: 0.25 },
      ],
    });
    await migrate();
    const sheet = OrderPricingSheet(await db.collection('orders').findOne({ _id: 'multiple-taxes' }));
    assert.equal(sheet.gross(), 3.75);
    assert.equal(sheet.taxSum(), 0.4375);
    assert.equal(sheet.net(), 3.3125);
  });

  test('customer spending statistics agree for migrated and newly calculated orders', async () => {
    const newSheet = OrderPricingSheet({ currencyCode: 'CHF' });
    newSheet.addItems({ amount: 9_285, taxAmount: 715 });
    const orders = [
      { _id: 'old-stats', userId: 'old-customer', calculation: legacyCalculation },
      { _id: 'new-stats', userId: 'new-customer', calculation: newSheet.calculation },
    ].map((order) => ({ ...order, currencyCode: 'CHF', created: new Date('2019-10-11') }));
    await db.collection('orders').insertMany(orders);
    await migrate();
    const stats = await ordersModule.statistics.getTopCustomers(orders.map(({ _id }) => _id));
    assert.equal(stats.length, 2);
    for (const customer of stats) {
      assert.equal(customer.totalSpent, 10_000);
      assert.equal(customer.averageOrderValue, 10_000);
    }
  });

  test('does not reprice position, delivery or payment calculations', async () => {
    const calculations = new Map();
    for (const name of ['order_positions', 'order_deliveries', 'order_payments']) {
      calculations.set(name, await db.collection(name).find({}).sort({ _id: 1 }).toArray());
    }
    await migrate();
    for (const [name, original] of calculations) {
      assert.deepEqual(await db.collection(name).find({}).sort({ _id: 1 }).toArray(), original);
    }
  });

  for (const netWriter of [true, false]) {
    test(`preserves a concurrent ${netWriter ? 'net' : 'legacy'} recalculation`, async (t) => {
      const replacement = [{ category: 'ITEMS', amount: 20_000, isNetPrice: netWriter }];
      await db.collection('orders').insertOne({ _id: 'concurrent', calculation: legacyCalculation });
      const updateOne = Collection.prototype.updateOne;
      let raced = false;
      t.mock.method(Collection.prototype, 'updateOne', async function (selector, update, options) {
        if (this.collectionName === 'orders' && selector._id === 'concurrent' && !raced) {
          raced = true;
          await updateOne.call(this, { _id: 'concurrent' }, { $set: { calculation: replacement } });
        }
        return updateOne.call(this, selector, update, options);
      });

      if (netWriter) await migrate();
      else await assert.rejects(migrate(), /Order concurrent changed during migration/);
      assert.equal(raced, true);
      assert.deepEqual(
        (await db.collection('orders').findOne({ _id: 'concurrent' })).calculation,
        replacement,
      );
    });
  }

  test('rejects invalid amounts without writing part of the calculation', async () => {
    const invalid = {
      _id: 'invalid-amount',
      calculation: [
        { category: 'ITEMS', amount: 10_000 },
        { category: 'TAXES', amount: '715' },
      ],
    };
    await db.collection('orders').insertOne(invalid);
    await assert.rejects(
      migrate(),
      /Cannot migrate order invalid-amount: Calculation contains an invalid amount/,
    );
    assert.deepEqual(await db.collection('orders').findOne({ _id: invalid._id }), invalid);
  });

  test('fails without partially rewriting an ambiguous order and can resume after repair', async () => {
    const invalid = { _id: 'ambiguous', calculation: [{ category: 'TAXES', amount: 715 }] };
    await db.collection('orders').insertOne(invalid);
    await assert.rejects(migrate(), /Cannot migrate order ambiguous: Cannot determine/);
    assert.deepEqual(await db.collection('orders').findOne({ _id: invalid._id }), invalid);

    await db
      .collection('orders')
      .updateOne({ _id: invalid._id }, { $set: { calculation: legacyCalculation } });
    await migrate();
    const repaired = await db.collection('orders').findOne({ _id: invalid._id });
    assert.equal(OrderPricingSheet(repaired).total().amount, 11_250);
    await migrate();
    assert.deepEqual(await db.collection('orders').findOne({ _id: invalid._id }), repaired);
  });
});

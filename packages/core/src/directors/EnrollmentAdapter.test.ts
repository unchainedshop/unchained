import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EnrollmentAdapter } from './EnrollmentAdapter.ts';

describe('EnrollmentAdapter base actions', () => {
  const makeContext = (overrides = {}) => ({
    enrollment: {
      _id: 'e1',
      status: 'ACTIVE',
      productId: 'p1',
      userId: 'u1',
      periods: [],
      configuration: [],
      log: [],
      countryCode: 'CH',
      currencyCode: 'CHF',
      ...overrides,
    } as any,
    product: {
      _id: 'p1',
      plan: {
        billingInterval: 'WEEKS',
        billingIntervalCount: 1,
      },
    } as any,
    modules: {} as any,
  });

  it('terminationDate returns the referenceDate by default', async () => {
    const actions = EnrollmentAdapter.actions(makeContext());
    const ref = new Date('2025-06-01');
    const result = await actions.terminationDate({ referenceDate: ref });
    assert.strictEqual(result?.getTime(), ref.getTime());
  });

  it('expiryDate returns null by default', async () => {
    const actions = EnrollmentAdapter.actions(makeContext());
    assert.strictEqual(await actions.expiryDate(), null);
  });

  it('initialPeriods delegates to nextPeriod', async () => {
    const actions = EnrollmentAdapter.actions(makeContext());
    const periods = await actions.initialPeriods({ referenceDate: new Date() });
    assert.strictEqual(periods.length, 1);
    assert.strictEqual(periods[0].isTrial, false);
  });

  it('initialPeriods returns trial period when trialIntervalCount is set', async () => {
    const ctx = makeContext();
    ctx.product.plan.trialIntervalCount = 1;
    ctx.product.plan.trialInterval = 'WEEKS';
    const actions = EnrollmentAdapter.actions(ctx);
    const periods = await actions.initialPeriods({ referenceDate: new Date() });
    assert.strictEqual(periods.length, 1);
    assert.strictEqual(periods[0].isTrial, true);
  });

  it('transformPlanToNewPlan returns null by default', async () => {
    const actions = EnrollmentAdapter.actions(makeContext());
    const result = await actions.transformPlanToNewPlan({
      plan: { productId: 'p2', quantity: 1, configuration: [] },
      referenceDate: new Date(),
    });
    assert.strictEqual(result, null);
  });

  it('nextPeriod returns null when period starts after expiry', async () => {
    const ctx = makeContext({
      expires: new Date('2020-01-01'),
      periods: [{ start: new Date('2019-12-01'), end: new Date('2019-12-08'), isTrial: false }],
    });
    const actions = EnrollmentAdapter.actions(ctx);
    const period = await actions.nextPeriod();
    assert.strictEqual(period, null);
  });

  it('nextPeriod returns period when within expiry', async () => {
    const ctx = makeContext({
      expires: new Date('2030-01-01'),
    });
    const actions = EnrollmentAdapter.actions(ctx);
    const period = await actions.nextPeriod();
    assert.notStrictEqual(period, null);
    assert.strictEqual(period?.isTrial, false);
  });

  it('nextPeriod returns null when no plan', async () => {
    const ctx = makeContext();
    ctx.product.plan = undefined;
    const actions = EnrollmentAdapter.actions(ctx);
    const period = await actions.nextPeriod();
    assert.strictEqual(period, null);
  });
});

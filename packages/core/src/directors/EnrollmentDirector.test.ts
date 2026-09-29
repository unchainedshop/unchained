import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { EnrollmentAdapter, type IEnrollmentAdapter } from './EnrollmentAdapter.ts';
import { EnrollmentDirector } from './EnrollmentDirector.ts';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';
import type { Modules } from '../modules.ts';
import type { OrderPosition } from '@unchainedshop/core-orders';
import type { Product } from '@unchainedshop/core-products';

const modules = {} as Modules;
const orderPosition = {
  _id: 'order-position-1',
  productId: 'plan-product',
  quantity: 1,
  configuration: [{ key: 'seats', value: '5' }],
} as unknown as OrderPosition;
const product = { _id: 'plan-product' } as unknown as Product;

const buildAdapter = (overrides: Partial<IEnrollmentAdapter> = {}): IEnrollmentAdapter => ({
  ...EnrollmentAdapter,
  key: `shop.unchained.tests.enrollment.${Math.random().toString(36).slice(2)}`,
  label: 'Test enrollment adapter',
  version: '1.0.0',
  isActivatedFor: () => true,
  transformOrderItemToEnrollmentPlan: async () => ({
    productId: 'plan-product',
    quantity: 1,
  }),
  ...overrides,
});

describe('EnrollmentDirector.transformOrderItemToEnrollment', () => {
  afterEach(() => {
    pluginRegistry.clear();
  });

  it('does not forward the order position configuration when no adapter sets it', async () => {
    pluginRegistry.register({
      key: 'shop.unchained.tests.enrollment.bundle',
      label: 'Enrollment adapter test bundle',
      version: '1.0.0',
      adapters: [buildAdapter()],
    });
    const result = await EnrollmentDirector.transformOrderItemToEnrollment(
      { orderPosition, product },
      { currencyCode: 'CHF', countryCode: 'CH' } as any,
      { modules },
    );
    assert.deepEqual(result.configuration, []);
  });

  it('uses the configuration returned by an enrollment adapter transformOrderItem', async () => {
    const customConfiguration = [{ key: 'plan', value: 'weekly' }];
    pluginRegistry.register({
      key: 'shop.unchained.tests.enrollment.bundle',
      label: 'Enrollment adapter test bundle',
      version: '1.0.0',
      adapters: [
        buildAdapter({
          transformOrderItemToEnrollmentPlan: async () => ({
            configuration: customConfiguration,
            productId: 'plan-product',
            quantity: 1,
          }),
        }),
      ],
    });
    const result = await EnrollmentDirector.transformOrderItemToEnrollment(
      { orderPosition, product },
      { currencyCode: 'CHF', countryCode: 'CH' } as any,
      { modules },
    );
    assert.deepEqual(result.configuration, customConfiguration);
  });
});

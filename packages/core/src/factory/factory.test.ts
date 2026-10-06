import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { pluginRegistry } from '../plugins/PluginRegistry.ts';
import { QuotationAdapter } from '../directors/QuotationAdapter.ts';
import { EnrollmentAdapter } from '../directors/EnrollmentAdapter.ts';
import registerQuotation from './registerQuotation.ts';
import registerEnrollment from './registerEnrollment.ts';

describe('factory orderIndex', () => {
  afterEach(() => {
    pluginRegistry.clear();
  });

  it('registerQuotation places the adapter by orderIndex', () => {
    registerQuotation({ adapterId: 'late' });
    registerQuotation({ adapterId: 'early', orderIndex: -100 });
    const keys = pluginRegistry.getAdapters(QuotationAdapter.adapterType!).map(({ key }) => key);
    assert.deepEqual(keys, ['shop.unchained.quotation.early', 'shop.unchained.quotation.late']);
  });

  it('registerEnrollment places the adapter by orderIndex', () => {
    registerEnrollment({ adapterId: 'late', configurationForOrder: async () => null });
    registerEnrollment({
      adapterId: 'early',
      orderIndex: -100,
      configurationForOrder: async () => null,
    });
    const keys = pluginRegistry.getAdapters(EnrollmentAdapter.adapterType!).map(({ key }) => key);
    assert.deepEqual(keys, ['shop.unchained.enrollment.early', 'shop.unchained.enrollment.late']);
  });
});

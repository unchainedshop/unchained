import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configurePaymentModule } from '@unchainedshop/core-payment';

describe('Test exports', () => {
  let module;

  before(async () => {
    const db = await initDb();
    module = await configurePaymentModule({ db });
  });

  it('Check Bookmarks module', async () => {
    assert.ok(module);
    assert.isFunction(module.findCurrency);
    assert.isFunction(module.findPayment);
    assert.isFunction(module.currencyExists);
    assert.isFunction(module.create);
    assert.isFunction(module.update);
    assert.isFunction(module.delete);
  });

  it('Mutate currency', async () => {
    const currencyId = await module.create(
      {
        authorId: 'Test-User-1',
        isoCode: 'CHF',
      },
      'Test-User-1'
    );

    assert.ok(currencyId);
    const currency = await module.findCurrency(currencyId);

    assert.ok(currency);
    assert.equal(currency._id, currencyId);
    assert.equal(currency.isoCode, 'CHF');
    assert.equal(currency.userId, 'Test-User-1');
    assert.isDefined(currency.created);
    assert.isUndefined(currency.updated);
    assert.isUndefined(currency.updatedBy);
    assert.equal(currency.createdBy, 'Test-User-1');

    const deletedCount = await module.delete(currencyId);
    assert.equal(deletedCount, 1);
  });
});

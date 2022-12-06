import { assert } from 'chai';
import { initDb } from '@unchainedshop/mongodb';
import { configureCurrenciesModule } from '@unchainedshop/core-currencies';

describe('Test exports', () => {
  let module;

  before(async () => {
    const db = await initDb();
    module = await configureCurrenciesModule({ db });
  });

  it('Check Bookmarks module', async () => {
    assert.ok(module);
    assert.isFunction(module.findCurrency);
    assert.isFunction(module.findCurrencies);
    assert.isFunction(module.currencyExists);
    assert.isFunction(module.create);
    assert.isFunction(module.update);
    assert.isFunction(module.delete);
  });

  it('Mutate currency', async () => {
    const currencyId = await module.create(
      {
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

    const deletedCount = await module.delete(currencyId);
    assert.equal(deletedCount, 1);
  });
});

import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configureCountriesModule } from 'meteor/unchained:core-countries';

describe('Test exports', () => {
  let module;

  before(async () => {
    const db = initDb();
    module = await configureCountriesModule({ db });
  });

  it('Check Country module', async () => {
    assert.ok(module);
    assert.isFunction(module.findCountry);
    assert.isFunction(module.findCountries);
    assert.isFunction(module.countryExists);
    assert.isFunction(module.create);
    assert.isFunction(module.update);
    assert.isFunction(module.delete);
  });

  it('Mutate country', async () => {
    const countryId = await module.create(
      {
        authorId: 'Test-User-1',
        isoCode: 'CHF',
      },
      'Test-User-1'
    );

    assert.ok(countryId);
    const country = await module.findCountry(countryId);

    assert.ok(country);
    assert.equal(country._id, countryId);
    assert.equal(country.isoCode, 'CHF');
    assert.equal(country.userId, 'Test-User-1');
    assert.isDefined(country.created);
    assert.isUndefined(country.updated);
    assert.isUndefined(country.updatedBy);
    assert.equal(country.createdBy, 'Test-User-1');

    const deletedCount = await module.delete(countryId);
    assert.equal(deletedCount, 1);
  });
});

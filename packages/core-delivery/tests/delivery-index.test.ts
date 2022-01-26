import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configureDeliveryModule } from '../src/delivery-index';

describe('Test exports', () => {
  let module;

  before(async () => {
    const db = initDb();
    module = await configureDeliveryModule({ db });
  });

  it('Check Delivery module', async () => {
    assert.ok(module);
    assert.isFunction(module.findProvider);
    assert.isFunction(module.findDelivery);
    assert.isFunction(module.providerExists);
    assert.isFunction(module.create);
    assert.isFunction(module.update);
    assert.isFunction(module.delete);
  });
});

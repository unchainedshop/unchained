import { Db } from '@unchainedshop/types/common';
import { WarehousingModule } from '@unchainedshop/types/warehousing';
import { assert } from 'chai';
import { configureWarehousingModule } from 'meteor/unchained:core-warehousing';
import { initDb } from 'meteor/unchained:mongodb';

describe('Test exports', () => {
  let module: WarehousingModule;
  let db: Db;

  before(async () => {
    db = initDb();
    module = await configureWarehousingModule({ db });
    assert.ok(module);
  });
  

  it('Check queries', async () => {
    assert.isFunction(await module.providerExists);
  });

  it('Check mutation', () => {
    // TODO:
  });
});

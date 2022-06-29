import { Db } from '@unchainedshop/types/common';
import { WarehousingModule } from '@unchainedshop/types/warehousing';
import { assert } from 'chai';
import { configureWarehousingModule } from '@unchainedshop/core-warehousing';
import { initDb } from '@unchainedshop/mongodb';

describe('Test exports', () => {
  let module: WarehousingModule;
  let db: Db;

  before(async () => {
    db = await initDb();
    module = await configureWarehousingModule({ db });
    assert.ok(module);
  });


  it('Check queries', async () => {
    assert.isFunction(await module.providerExists);
  });

});

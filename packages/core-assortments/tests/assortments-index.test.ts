import { assert } from 'chai';
import { initDb } from '@unchainedshop/mongodb';
import { configureAssortmentsModule } from '@unchainedshop/core-assortments';
import { AssortmentsModule } from '@unchainedshop/types/assortments';

describe('Test exports', () => {
  let module: AssortmentsModule;

  beforeEach(async () => {
    const db = await initDb();
    module = await configureAssortmentsModule({ db });
  });

  it('Insert assortment', async () => {
    const assortmentId = await module.create(
      {
        isActive: true,
        isBase: true,
        isRoot: true,
        sequence: 13,
        slugs: ['Test'],
        tags: [],
        title: 'Test',
        locale: 'de',
      },
      'Test-User-1'
    );    


    const assortment = await module.findAssortment({ assortmentId });
    assert.ok(assortment);

    const deletedCount = await module.delete(assortmentId);
    assert.equal(deletedCount, 1);
  });


});

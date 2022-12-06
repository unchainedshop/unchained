import { assert } from 'chai';
import { initDb } from '@unchainedshop/mongodb';
import { configureLanguagesModule } from '@unchainedshop/core-languages';

describe('Test exports', () => {
  let module;

  before(async () => {
    const db = await initDb();
    module = await configureLanguagesModule({ db });
  });

  it('Check Bookmarks module', async () => {
    assert.ok(module);
    assert.isFunction(module.findLanguage);
    assert.isFunction(module.findLanguages);
    assert.isFunction(module.languageExists);
    assert.isFunction(module.create);
    assert.isFunction(module.update);
    assert.isFunction(module.delete);
  });

  it('Mutate language', async () => {
    const languageId = await module.create(
      {
        isoCode: 'CHF',
      },
      'Test-User-1'
    );

    assert.ok(languageId);
    const language = await module.findLanguage(languageId);

    assert.ok(language);
    assert.equal(language._id, languageId);
    assert.equal(language.isoCode, 'CHF');
    assert.equal(language.userId, 'Test-User-1');
    assert.isDefined(language.created);
    assert.isUndefined(language.updated);

    const deletedCount = await module.delete(languageId);
    assert.equal(deletedCount, 1);
  });
});

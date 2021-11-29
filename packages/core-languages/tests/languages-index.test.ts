import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { configureLanguagesModule } from 'meteor/unchained:core-languages';
import { Mongo } from 'meteor/mongo';

describe('Test exports', () => {
  let module;

  before(async () => {
    const db = initDb();
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
        authorId: 'Test-User-1',
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
    assert.isUndefined(language.updatedBy);
    assert.equal(language.createdBy, 'Test-User-1');

    const deletedCount = await module.delete(languageId);
    assert.equal(deletedCount, 1);
  });
});

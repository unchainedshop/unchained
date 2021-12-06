import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import {
  configureFilesModule,
  fileServices,
} from 'meteor/unchained:core-files-next';
import { Mongo } from 'meteor/mongo';
import { FilesModule } from '@unchainedshop/types/files';

describe('Test exports', () => {
  let module: FilesModule;

  before(async () => {
    const db = initDb();
    module = await configureFilesModule({ db });
  });

  it('Check files module', () => {
    assert.ok(module);
    assert.isFunction(module.findFile);
    assert.isFunction(module.create);
    assert.isFunction(module.update);
    assert.isFunction(module.delete);
  });

  it('Check file services', () => {
    assert.ok(fileServices);
    assert.ok(fileServices.linkFileService);
  });
});

import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import { FileDirector, FileAdapter } from 'meteor/unchained:core-file-upload';

describe('Test exports', () => {
  it('Check expors', () => {
    assert.ok(FileDirector);
    assert.isFunction(FileDirector.registerAdapter);
    assert.isFunction(FileDirector.registerFileUploadCallback);

    assert.ok(FileAdapter);
    assert.isFunction(FileAdapter.createSignedURL);
    assert.isFunction(FileAdapter.removeFiles);
    assert.isFunction(FileAdapter.uploadFileFromStream);
    assert.isFunction(FileAdapter.uploadFileFromURL);
  });
});

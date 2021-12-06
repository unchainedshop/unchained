import { assert } from 'chai';
import { initDb } from 'meteor/unchained:mongodb';
import {
  setFileUploadAdapter,
  getFileUploadAdapter,
  createSignedURL,
  registerFileUploadCallback,
  getFileUploadCallback,
  removeFiles,
  uploadFileFromStream,
  uploadFileFromURL,
} from 'meteor/unchained:file-upload';

describe('Test exports', () => {
  it('Check director expors', () => {
    assert.isFunction(setFileUploadAdapter);
    assert.isFunction(getFileUploadAdapter);
    assert.isFunction(createSignedURL);
    assert.isFunction(registerFileUploadCallback);
    assert.isFunction(getFileUploadCallback);
    assert.isFunction(removeFiles);
    assert.isFunction(uploadFileFromStream);
    assert.isFunction(uploadFileFromURL);
  });
});

/* eslint-disable no-underscore-dangle */
import fs from 'fs-extra';
import Random from '@reactioncommerce/random';
import nodePath from 'path';
import {
  helpers,
  getExtension,
  bound,
  storagePath,
  dataToSchema,
  getMimeType,
} from './helpers';

const write = function (buffer, _opts = {}, _callback, _proceedAfterUpload) {
  let opts = _opts;
  let callback = _callback;
  let proceedAfterUpload = _proceedAfterUpload;

  if (helpers.isFunction(opts)) {
    proceedAfterUpload = callback;
    callback = opts;
    opts = {};
  } else if (helpers.isBoolean(callback)) {
    proceedAfterUpload = callback;
  } else if (helpers.isBoolean(opts)) {
    proceedAfterUpload = opts;
  }

  const fileId = opts.fileId || Random.id();
  const FSName = fileId;
  const fileName =
    opts.name || opts.fileName ? opts.name || opts.fileName : FSName;

  const { extension, extensionWithDot } = getExtension(fileName);
  opts.path = `${storagePath(this._name)}${
    nodePath.sep
  }${FSName}${extensionWithDot}`;

  opts.type = getMimeType(opts);
  if (!helpers.isObject(opts.meta)) {
    opts.meta = {};
  }

  if (!helpers.isNumber(opts.size)) {
    opts.size = buffer.length;
  }

  const result = dataToSchema({
    name: fileName,
    path: opts.path,
    meta: opts.meta,
    type: opts.type,
    size: opts.size,
    userId: opts.userId,
    collectionName: this._name,
    extension,
  });

  result._id = fileId;

  fs.ensureFile(opts.path, (efError) => {
    bound(() => {
      if (efError) {
        callback && callback(efError);
      } else {
        const stream = fs.createWriteStream(opts.path, {
          flags: 'w',
          mode: 0o644,
        });
        stream.end(buffer, (streamErr) => {
          bound(() => {
            if (streamErr) {
              callback && callback(streamErr);
            } else {
              this.insert(result, async (insertErr, _id) => {
                if (insertErr) {
                  callback && callback(insertErr);
                } else {
                  const fileRef = this.findOne(_id);
                  if (proceedAfterUpload === true) {
                    this.onAfterUpload &&
                      (await this.onAfterUpload.call(this, fileRef));
                  }
                  callback && callback(null, fileRef);
                }
              });
            }
          });
        });
      }
    });
  });
  return this;
};

export default write;

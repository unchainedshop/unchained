import fs from 'fs-extra';
import Random from '@reactioncommerce/random';
import nodePath from 'path';
import request from 'request-libcurl';
import {
  helpers,
  getExtension,
  bound,
  dataToSchema,
  getMimeType,
  storagePath,
} from './helpers';

const load = async function (url, _opts = {}, _callback, _proceedAfterUpload) {
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

  if (!helpers.isObject(opts)) {
    opts = {};
  }

  const fileId = opts.fileId || Random.id();
  const FSName = this.namingFunction ? this.namingFunction(opts) : fileId;
  const pathParts = url.split('/');
  const fileName =
    opts.name || opts.fileName
      ? opts.name || opts.fileName
      : pathParts[pathParts.length - 1] || FSName;

  const { extension, extensionWithDot } = getExtension(fileName);

  opts.path = `${storagePath(this._name)}${
    nodePath.sep
  }${FSName}${extensionWithDot}`;

  const storeResult = (result, cb) => {
    result._id = fileId;

    this.insert(result, async (error, _id) => {
      if (error) {
        cb && cb(error);
      } else {
        const fileRef = this.findOne(_id);
        cb && cb(null, fileRef);
        if (proceedAfterUpload === true) {
          this.onAfterUpload && (await this.onAfterUpload.call(this, fileRef));
          this.emit('afterUpload', fileRef);
        }
      }
    });
  };

  fs.ensureFile(opts.path, (efError) => {
    bound(() => {
      if (efError) {
        callback && callback(efError);
      } else {
        request(
          {
            url,
            headers: opts.headers || {},
            wait: true,
          },
          (reqError, response) =>
            bound(() => {
              if (reqError) {
                callback && callback(reqError);
              } else {
                const result = dataToSchema({
                  name: fileName,
                  path: opts.path,
                  meta: opts.meta,
                  type:
                    opts.type ||
                    response.headers['content-type'] ||
                    getMimeType({ path: opts.path }),
                  size:
                    opts.size ||
                    parseInt(response.headers['content-length'] || 0),
                  userId: opts.userId,
                  collectionName: this._name,
                  extension,
                });

                if (!result.size) {
                  fs.stat(opts.path, (error, stats) =>
                    bound(() => {
                      if (error) {
                        callback && callback(error);
                      } else {
                        result.versions.original.size = result.size =
                          stats.size;
                        storeResult(result, callback);
                      }
                    })
                  );
                } else {
                  storeResult(result, callback);
                }
              }
            })
        )
          .pipe(
            fs.createWriteStream(opts.path, {
              flags: 'w',
              mode: this.permissions,
            })
          )
          .send();
      }
    });
  });

  return this;
};

export default load;

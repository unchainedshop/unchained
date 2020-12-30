/* eslint-disable no-underscore-dangle */
import { Meteor } from 'meteor/meteor';
import fs from 'fs-extra';
import nodePath from 'path';
import fileType from 'file-type';
import Random from '@reactioncommerce/random';

const helpers = {
  isString(val) {
    return val && typeof val.valueOf() === 'string';
  },
  isNumber(val) {
    return val && typeof val.valueOf() === 'number';
  },
  isUndefined(obj) {
    return obj === void 0;
  },
  isObject(obj) {
    if (this.isArray(obj) || this.isFunction(obj)) {
      return false;
    }
    return obj === Object(obj);
  },
  isArray(obj) {
    return Array.isArray(obj);
  },
  isBoolean(obj) {
    return (
      obj === true ||
      obj === false ||
      Object.prototype.toString.call(obj) === '[object Boolean]'
    );
  },
  isFunction(obj) {
    return typeof obj === 'function' || false;
  },
  isEmpty(obj) {
    if (this.isDate(obj)) {
      return false;
    }
    if (this.isObject(obj)) {
      return !Object.keys(obj).length;
    }
    if (this.isArray(obj) || this.isString(obj)) {
      return !obj.length;
    }
    return false;
  },
  clone(obj) {
    if (!this.isObject(obj)) return obj;
    return this.isArray(obj) ? obj.slice() : { ...obj };
  },
  has(_obj, path) {
    let obj = _obj;
    if (!this.isObject(obj)) {
      return false;
    }
    if (!this.isArray(path)) {
      return (
        this.isObject(obj) && Object.prototype.hasOwnProperty.call(obj, path)
      );
    }

    const { length } = path;
    for (let i = 0; i < length; i++) {
      if (!Object.prototype.hasOwnProperty.call(obj, path[i])) {
        return false;
      }
      obj = obj[path[i]];
    }
    return !!length;
  },
  omit(obj, ...keys) {
    const clear = { ...obj };
    for (let i = keys.length - 1; i >= 0; i - 1) {
      delete clear[keys[i]];
    }

    return clear;
  },
  now: Date.now,
};

const bound = Meteor.bindEnvironment((callback) => callback());

const updateFileTypes = (data) => {
  return {
    isVideo: /^video\//i.test(data.type),
    isAudio: /^audio\//i.test(data.type),
    isImage: /^image\//i.test(data.type),
    isText: /^text\//i.test(data.type),
    isJSON: /^application\/json$/i.test(data.type),
    isPDF: /^application\/(x-)?pdf$/i.test(data.type),
  };
};

const storagePath = function () {
  return `assets${nodePath.sep}app${nodePath.sep}uploads${nodePath.sep}${this._name}`;
};

const dataToSchema = (data) => {
  const ds = {
    name: data.name,
    extension: data.extension,
    ext: data.extension,
    extensionWithDot: `.${data.extension}`,
    path: data.path,
    meta: data.meta,
    type: data.type,
    mime: data.type,
    'mime-type': data.type,
    size: data.size,
    userId: data.userId || null,
    versions: {
      original: {
        path: data.path,
        size: data.size,
        type: data.type,
        extension: data.extension,
      },
    },
    _downloadRoute: '/cdn/storage',
    _collectionName: this._name,
  };

  // Optional fileId
  if (data.fileId) {
    ds._id = data.fileId;
  }

  ds = { ...ds, ...updateFileTypes(ds) };
  ds._storagePath = data._storagePath || storagePath({ ...data, ...ds });
  return ds;
};

const getMimeType = (fileData) => {
  let mime;
  if (helpers.isObject(fileData) && fileData.type) {
    mime = fileData.type;
  }

  if (fileData.path && (!mime || !helpers.isString(mime))) {
    try {
      let buf = Buffer.alloc(262);
      const fd = fs.openSync(fileData.path, 'r');
      const br = fs.readSync(fd, buf, 0, 262, 0);
      fs.close(fd, NOOP);
      if (br < 262) {
        buf = buf.slice(0, br);
      }
      ({ mime } = fileType(buf));
    } catch (e) {
      // We're good
    }
  }

  if (!mime || !helpers.isString(mime)) {
    mime = 'application/octet-stream';
  }
  return mime;
};

const getExtension = (fileName) => {
  if (fileName.includes('.')) {
    const extension = (
      fileName.split('.').pop().split('?')[0] || ''
    ).toLowerCase();
    return { ext: extension, extension, extensionWithDot: `.${extension}` };
  }
  return { ext: '', extension: '', extensionWithDot: '' };
};

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

  opts.path = `${this.storagePath(opts)}${
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
              this.insert(result, (insertErr, _id) => {
                if (insertErr) {
                  callback && callback(insertErr);
                } else {
                  const fileRef = this.findOne(_id);
                  callback && callback(null, fileRef);
                  if (proceedAfterUpload === true) {
                    this.onAfterUpload &&
                      this.onAfterUpload.call(this, fileRef);
                    this.emit('afterUpload', fileRef);
                  }
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

/* eslint-disable no-underscore-dangle */
import Random from '@reactioncommerce/random';
import nodePath from 'path';
import {
  helpers,
  getExtension,
  storagePath,
  dataToSchema,
  getMimeType,
} from './helpers';

const write = async function (buffer, _opts = {}) {
  let opts = _opts;

  if (helpers.isFunction(opts)) {
    opts = {};
  }

  const fileId = opts.fileId || Random.id();
  const FSName = fileId;
  const fileName =
    opts.name || opts.fileName ? opts.name || opts.fileName : FSName;

  const { extension, extensionWithDot } = await getExtension(fileName, buffer);

  opts.path = `${storagePath(this._name)}${
    nodePath.sep
  }${FSName}${extensionWithDot}`;

  opts.type = await getMimeType(buffer);

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

  this.checkForSizeAndExtension({ size: opts.size, extension });

  this.insert(result, async (err, _id) => {
    if (!err) {
      const fileRef = this.findOne(_id);
      console.log('fileReffileReffileReffileRef: ', fileRef);
      await this.storeInGridFSBucket.call(this, fileRef, buffer);
    }
  });
  return result;
};

export default write;

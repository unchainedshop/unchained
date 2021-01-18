import Random from '@reactioncommerce/random';
import nodePath from 'path';
import fetch from 'isomorphic-unfetch';
import {
  helpers,
  getExtension,
  dataToSchema,
  getMimeType,
  storagePath,
} from './helpers';

const load = async function (url, _opts = {}) {
  let opts = _opts;
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

  const response = await fetch(url, { headers: opts.headers || {} });
  if (!response.ok) throw new Error('URL provided responded with 404');
  const textBlob = await response.text();
  const size = Buffer.byteLength(textBlob, 'utf8');
  const result = dataToSchema({
    name: fileName,
    path: opts.path,
    meta: opts.meta,
    type:
      opts.type ||
      response.headers['content-type'] ||
      getMimeType({ path: opts.path }),
    size: opts.size || size,
    userId: opts.userId,
    collectionName: this._name,
    extension,
  });
  // throws if not matching
  this.onBeforeUpload({
    size: result.size,
    extension,
  });

  result._id = fileId;
  this.insert(result, async (err, _id) => {
    if (!err) {
      const fileRef = this.findOne(_id);
      await this.storeInGridFSBucket.call(this, fileRef, textBlob);
    }
  });
  return result;
};

export default load;

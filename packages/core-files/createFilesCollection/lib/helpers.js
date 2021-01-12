import fs from 'fs-extra';
import fileType from 'file-type';
import { MongoClient } from 'mongodb';
import crypto from 'crypto';
import { Meteor } from 'meteor/meteor';

const { FILE_STORAGE_PATH } = process.env;

export const NOOP = () => {};

export const bound = Meteor.bindEnvironment((callback) => callback());

export const helpers = {
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
    for (let i = 0; i < length; i + 1) {
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

export const getExtension = (fileName) => {
  if (fileName.includes('.')) {
    const extension = (
      fileName.split('.').pop().split('?')[0] || ''
    ).toLowerCase();
    return { ext: extension, extension, extensionWithDot: `.${extension}` };
  }
  return { ext: '', extension: '', extensionWithDot: '' };
};

export const storagePath = (collectionName) => {
  if (FILE_STORAGE_PATH) {
    return `${FILE_STORAGE_PATH}/${collectionName}`;
  }
  return `assets/app/uploads/${collectionName}`;
};

export const updateFileTypes = (data) => {
  return {
    isVideo: /^video\//i.test(data.type),
    isAudio: /^audio\//i.test(data.type),
    isImage: /^image\//i.test(data.type),
    isText: /^text\//i.test(data.type),
    isJSON: /^application\/json$/i.test(data.type),
    isPDF: /^application\/(x-)?pdf$/i.test(data.type),
  };
};

export const dataToSchema = (data) => {
  let ds = {
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
    _collectionName: data.collectionName,
  };

  // Optional fileId
  if (data.fileId) {
    ds._id = data.fileId;
  }

  ds = { ...ds, ...updateFileTypes(ds) };

  ds._storagePath = data._storagePath || storagePath(data.collectionName);
  return ds;
};

export const getMimeType = (fileData) => {
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

export const notFound = (http) => {
  const text = 'File Not Found :(';

  if (!http.response.headersSent) {
    http.response.writeHead(404, {
      'Content-Type': 'text/plain',
      'Content-Length': text.length,
    });
  }
  if (!http.response.finished) {
    http.response.end(text);
  }
};

const hashLoginToken = (stampedLoginToken) => {
  const hash = crypto.createHash('sha256');
  hash.update(stampedLoginToken);
  const hashedToken = hash.digest('base64');

  return hashedToken;
};
const DEFAULT_LOGIN_EXPIRATION_DAYS = 90;

const getTokenLifetimeMs = () => {
  const LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;
  return (
    (LOGIN_UNEXPIRING_TOKEN_DAYS || DEFAULT_LOGIN_EXPIRATION_DAYS) *
    24 *
    60 *
    60 *
    1000
  );
};

const tokenExpiration = (when) => {
  // We pass when through the Date constructor for backwards compatibility;
  // `when` used to be a number.
  return new Date(new Date(when).getTime() + getTokenLifetimeMs());
};

export const getUser = async (http) => {
  // there is a possible current user connected!
  let loginToken = http.request.headers['meteor-login-token'];

  if (http.request.cookies.meteor_login_token) {
    loginToken = http.cookies.meteor_login_token;
  }

  if (http.request.cookies.token) {
    loginToken = http.request.cookies.token;
  }

  if (http.request.headers.authorization) {
    const [type, token] = http.request.headers.authorization.split(' ');
    if (type === 'Bearer') {
      loginToken = token;
    }
  }

  if (loginToken) {
    const connection = await MongoClient.connect(
      MongoInternals.defaultRemoteCollectionDriver().mongo.client.s.url,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        poolSize: 1,
      }
    );

    const db = await connection.db(
      MongoInternals.defaultRemoteCollectionDriver().mongo.client.s.options
        .dbName
    );
    // the hashed token is the key to find the possible current user in the db
    const hashedToken = hashLoginToken(loginToken); // eslint-disable-line

    const currentUser = await db.collection('users').findOne({
      'services.resume.loginTokens.hashedToken': hashedToken,
    });

    // the current user exists
    if (currentUser) {
      // find the right login token corresponding, the current user may have
      // several sessions logged on different browsers / computers
      const tokenInformation = currentUser.services.resume.loginTokens.find(
        (tokenInfo) => tokenInfo.hashedToken === hashedToken
      ); // eslint-disable-line

      // get an exploitable token expiration date
      const expiresAt = tokenExpiration(tokenInformation.when); // eslint-disable-line

      // true if the token is expired
      const isExpired = expiresAt < new Date();
      // if the token is still valid, give access to the current user
      // information in the resolvers context
      if (!isExpired) {
        // return a new context object with the current user & her id
        return {
          user: currentUser,
          userId: currentUser._id,
        };
      }
    }
  }

  return {};
};

import fileType from 'file-type';
import crypto from 'crypto';
import { Meteor } from 'meteor/meteor';
import { MongoInternals } from 'meteor/mongo';
import { FileObj } from './types';

const { FILE_STORAGE_PATH } = process.env;

export const bound = Meteor.bindEnvironment((callback) => callback());

export const helpers = {
  isString(val): boolean {
    return val && typeof val.valueOf() === 'string';
  },
  isNumber(val): boolean {
    return val && typeof val.valueOf() === 'number';
  },
  isUndefined(obj): boolean {
    return obj === undefined;
  },
  isObject(obj): boolean {
    if (this.isArray(obj) || this.isFunction(obj)) {
      return false;
    }
    return obj === Object(obj);
  },
  isArray(obj): boolean {
    return Array.isArray(obj);
  },
  isDate(dateStr): boolean {
    return !Number.isNaN(new Date(dateStr).getDate());
  },
  isBoolean(obj): boolean {
    return (
      obj === true ||
      obj === false ||
      Object.prototype.toString.call(obj) === '[object Boolean]'
    );
  },
  isFunction(obj): boolean {
    return typeof obj === 'function' || false;
  },
  isEmpty(obj): boolean {
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
  has(_obj, path): boolean {
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
  now: Date.now,
};

export const accessDenied = (http, rc: number): boolean => {
  const text = 'Access denied!';
  if (!http.response.headersSent) {
    http.response.writeHead(rc, {
      'Content-Type': 'text/plain',
      'Content-Length': text.length,
    });
  }

  if (!http.response.finished) {
    http.response.end(text);
  }
  return false;
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

export const getExtension = async (
  fileName: string,
  buffer: Buffer | ArrayBuffer
) => {
  if (fileName.includes('.')) {
    const extension = (
      fileName.split('.').pop()?.split('?')[0] || ''
    ).toLowerCase();
    return { ext: extension, extension, extensionWithDot: `.${extension}` };
  }
  if (buffer) {
    const fileExtension = await fileType.fromBuffer(buffer);
    if (!fileExtension) return { ext: '', extension: '', extensionWithDot: '' };
    return {
      ext: fileExtension.ext,
      extension: fileExtension.ext,
      extensionWithDot: `.${fileExtension.ext}`,
    };
  }
  return { ext: '', extension: '', extensionWithDot: '' };
};

export const responseHeaders = (responseCode, versionRef) => {
  const headers: {
    Pragma?: string;
    'Transfer-Encoding'?: string;
    'Cache-Control'?: string;
    'Content-Range'?: string;
    Connection: string;
    'Content-Type': string;
    'Accept-Ranges': string;
  } = {
    Connection: 'keep-alive',
    'Content-Type': versionRef.type || 'application/octet-stream',
    'Accept-Ranges': 'bytes',
  };
  switch (responseCode) {
    case '206':
      headers.Pragma = 'private';
      headers['Transfer-Encoding'] = 'chunked';
      break;
    case '400':
      headers['Cache-Control'] = 'no-cache';
      break;
    case '416':
      headers['Content-Range'] = `bytes */${versionRef.size}`;
      break;
    default:
      break;
  }

  return headers;
};

export const dataToSchema = (data): FileObj => {
  const dataSchema = {
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
    userId: data.userId || '',
    versions: {
      original: {
        path: data.path,
        size: data.size,
        type: data.type,
        extension: data.extension,
      },
    },
    downloadRoute: '/cdn/storage',
    collectionName: data.collectionName,
    _id: data.fileId,
  };

  return dataSchema;
};

export const getMimeType = async (
  buffer: Buffer | ArrayBuffer
): Promise<string> => {
  let mime;
  const fileExtension = await fileType.fromBuffer(buffer);
  mime = fileExtension?.mime;

  if (!mime || !helpers.isString(mime)) {
    mime = 'application/octet-stream';
  }
  return mime;
};

const hashLoginToken = (stampedLoginToken: string): string => {
  const hash = crypto.createHash('sha256');
  hash.update(stampedLoginToken);
  const hashedToken = hash.digest('base64');

  return hashedToken;
};

const getTokenLifetimeMs = () => {
  const DEFAULT_LOGIN_EXPIRATION_DAYS = 90;
  const LOGIN_UNEXPIRING_TOKEN_DAYS = 365 * 100;
  return (
    (LOGIN_UNEXPIRING_TOKEN_DAYS || DEFAULT_LOGIN_EXPIRATION_DAYS) *
    24 *
    60 *
    60 *
    1000
  );
};

const tokenExpiration = (when: Date): Date => {
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
    const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

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

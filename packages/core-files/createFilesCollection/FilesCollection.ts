/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
import fs from 'fs';
import url from 'url';
import { GridFSBucket, ObjectID } from 'mongodb';
import { Mongo, MongoInternals } from 'meteor/mongo';
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { Readable } from 'stream';
import Random from '@reactioncommerce/random';
import fetch from 'isomorphic-unfetch';
import { FileObj, Options } from './types';
import {
  helpers,
  bound,
  getUser,
  notFound,
  responseHeaders,
  getExtension,
  dataToSchema,
  getMimeType,
  accessDenied,
} from './helpers';

export default class FilesCollection extends Mongo.Collection<FileObj> {
  _name: string;

  maxSize: number;

  extensionRegex: RegExp;

  secure: boolean;

  downloadRoute: string;

  allowedOrigins: RegExp;

  integrityCheck: boolean;

  strict: boolean;

  constructor({
    collectionName,
    maxSize = 10485760,
    extensionRegex,
    secure = false,
    integrityCheck = true,
    strict = true,
  }) {
    super(collectionName);
    this._name = collectionName;
    this.maxSize = maxSize;
    this.extensionRegex = new RegExp(extensionRegex);
    this.downloadRoute = '/cdn/storage';
    this.allowedOrigins = /^http:\/\/localhost:12[0-9]{3}$/; // Check .test works properly here
    this.secure = secure;
    this.integrityCheck = integrityCheck;
    this.strict = strict;

    WebApp.connectHandlers.use(async (httpReq, httpResp, next) => {
      if (
        this.allowedOrigins &&
        httpReq.url?.includes(`${this.downloadRoute}/`) &&
        !httpResp.headersSent
      ) {
        if (
          httpReq.headers.origin &&
          this.allowedOrigins.test(httpReq.headers.origin)
        ) {
          httpResp.setHeader('Access-Control-Allow-Credentials', 'true');
          httpResp.setHeader(
            'Access-Control-Allow-Origin',
            httpReq.headers.origin
          );
        }
        if (httpReq.method === 'OPTIONS') {
          httpResp.setHeader(
            'Access-Control-Allow-Methods',
            'GET, POST, OPTIONS'
          );
          httpResp.setHeader(
            'Access-Control-Allow-Headers',
            'Range, Content-Type, x-mtok, x-start, x-chunkid, x-fileid, x-eof'
          );
          httpResp.setHeader(
            'Access-Control-Expose-Headers',
            'Accept-Ranges, Content-Encoding, Content-Length, Content-Range'
          );
          httpResp.setHeader('Allow', 'GET, POST, OPTIONS');
          httpResp.writeHead(200);
          httpResp.end();
          return;
        }
      }

      if (httpReq.url?.includes(`${this.downloadRoute}/${this._name}`)) {
        let uri = httpReq.url.replace(
          `${this.downloadRoute}/${this._name}`,
          ''
        );
        if (uri.indexOf('/') === 0) {
          uri = uri.substring(1);
        }
        const uris = uri.split('/');

        const params = {
          _id: uris[0],
          query: url.parse(httpReq.url, true).query,
        };

        const http = { request: httpReq, response: httpResp, params };
        if (await this.allowAccess(http)) {
          await this.download(http, this.findOne(params._id));
        }
      } else {
        next();
      }
    });
  }

  checkForSizeAndExtension = ({
    size,
    extension,
  }: {
    size: number;
    extension: string;
  }): Error | void => {
    if (!extension) {
      throw new Error("filetype isn't defined");
    }
    if (this.extensionRegex && !this.extensionRegex.test(extension)) {
      throw new Error('filetype not allowed');
    }
    if (size > this.maxSize) {
      throw new Error('file too big');
    }
  };

  allowAccess = async (http): Promise<boolean> => {
    const { userId } = await getUser(http);
    const result = !!userId;

    if (this.secure && !result) {
      return accessDenied(http, 401);
    }
    return true;
  };

  async download(http, fileRef) {
    let vRef;
    const version = 'original';

    if (fileRef) {
      if (
        helpers.has(fileRef, 'versions') &&
        helpers.has(fileRef.versions, version)
      ) {
        vRef = fileRef.versions[version];
        vRef._id = fileRef._id;
      } else {
        vRef = fileRef;
      }
    } else {
      vRef = false;
    }

    if (!vRef || !helpers.isObject(vRef)) {
      return notFound(http);
    }
    if (fileRef) {
      if (
        this.interceptDownload &&
        helpers.isFunction(this.interceptDownload) &&
        (await this.interceptDownload(http, fileRef, version)) === true
      ) {
        return undefined;
      }

      fs.stat(vRef.path, (statErr, stats) =>
        bound(() => {
          let responseType;
          if (statErr || !stats.isFile()) {
            return notFound(http);
          }

          if (stats.size !== vRef.size && !this.integrityCheck) {
            vRef.size = stats.size;
          }

          if (stats.size !== vRef.size && this.integrityCheck) {
            responseType = '400';
          }

          return this.serve({
            http,
            fileRef,
            vRef,
            responseType,
          });
        })
      );
      return undefined;
    }
    return notFound(http);
  }

  serve({
    http,
    fileRef,
    vRef,
    readableStream = null,
    responseType = '200',
    force200 = false,
  }) {
    let partiral = false;
    let reqRange: { start?: number; end?: number } = {};
    let dispositionType = '';
    let start;
    let end;
    let take;

    if (http.params.query.download && http.params.query.download === 'true') {
      dispositionType = 'attachment; ';
    } else {
      dispositionType = 'inline; ';
    }

    const dispositionName = `filename="${encodeURI(
      vRef.name || fileRef.name
    ).replace(/,/g, '%2C')}"; filename*=UTF-8''${encodeURIComponent(
      vRef.name || fileRef.name
    )}; `;
    const dispositionEncoding = 'charset=UTF-8';

    if (!http.response.headersSent) {
      http.response.setHeader(
        'Content-Disposition',
        dispositionType + dispositionName + dispositionEncoding
      );
    }

    if (http.request.headers.range && !force200) {
      partiral = true;
      const array = http.request.headers.range.split(/bytes=([0-9]*)-([0-9]*)/);
      start = parseInt(array[1], 10);
      end = parseInt(array[2], 10);
      if (Number.isNaN(end)) {
        end = vRef.size - 1;
      }
      take = end - start;
    } else {
      start = 0;
      end = vRef.size - 1;
      take = vRef.size;
    }

    if (
      partiral ||
      (http.params.query.play && http.params.query.play === 'true')
    ) {
      reqRange = { start, end };
      if (Number.isNaN(start) && !Number.isNaN(end)) {
        reqRange.start = end - take;
        reqRange.end = end;
      }
      if (!Number.isNaN(start) && Number.isNaN(end)) {
        reqRange.start = start;
        reqRange.end = start + take;
      }

      if (start + take >= vRef.size) {
        reqRange.end = vRef.size - 1;
      }

      if (
        this.strict &&
        reqRange.start &&
        reqRange.end &&
        (reqRange.start >= vRef.size - 1 || reqRange.end > vRef.size - 1)
      ) {
        responseType = '416';
      } else {
        responseType = '206';
      }
    } else {
      responseType = '200';
    }

    const streamErrorHandler = (error) => {
      if (!http.response.finished) {
        http.response.end(error.toString());
      }
    };

    const headers = responseHeaders(responseType, vRef);

    if (!headers['Cache-Control']) {
      if (!http.response.headersSent) {
        http.response.setHeader(
          'Cache-Control',
          'public, max-age=31536000, s-maxage=31536000'
        );
      }
    }

    Object.keys(headers).forEach((key) => {
      if (!http.response.headersSent) {
        http.response.setHeader(key, headers[key]);
      }
    });

    const respond = (stream, code) => {
      stream._isEnded = false;
      const closeStreamCb = (closeError) => {
        if (!closeError) {
          stream._isEnded = true;
        }
      };

      const closeStream = () => {
        if (!stream._isEnded) {
          if (typeof stream.close === 'function') {
            stream.close(closeStreamCb);
          } else if (typeof stream.end === 'function') {
            stream.end(closeStreamCb);
          } else if (typeof stream.destroy === 'function') {
            stream.destroy('Got to close this stream', closeStreamCb);
          }
        }
      };

      if (!http.response.headersSent && readableStream) {
        http.response.writeHead(code);
      }

      http.response.on('close', closeStream);
      http.request.on('aborted', () => {
        http.request.aborted = true;
        closeStream();
      });

      stream
        .on('open', () => {
          if (!http.response.headersSent) {
            http.response.writeHead(code);
          }
        })
        .on('abort', () => {
          closeStream();
          if (!http.response.finished) {
            http.response.end();
          }
          if (!http.request.aborted) {
            http.request.destroy();
          }
        })
        .on('error', (err) => {
          closeStream();
          streamErrorHandler(err);
        })
        .on('end', () => {
          closeStream();
          if (!http.response.finished) {
            http.response.end();
          }
        })
        .pipe(http.response);
    };

    const text = 'Content-Length mismatch!';

    switch (responseType) {
      case '400':
        if (!http.response.headersSent) {
          http.response.writeHead(400, {
            'Content-Type': 'text/plain',
            'Content-Length': text.length,
          });
        }

        if (!http.response.finished) {
          http.response.end(text);
        }
        break;
      case '404':
        notFound(http);
        break;
      case '416':
        if (!http.response.headersSent) {
          http.response.writeHead(416);
        }
        if (!http.response.finished) {
          http.response.end();
        }
        break;
      case '206':
        if (!http.response.headersSent) {
          http.response.setHeader(
            'Content-Range',
            `bytes ${reqRange.start}-${reqRange.end}/${vRef.size}`
          );
        }
        respond(
          readableStream ||
            fs.createReadStream(vRef.path, {
              start: reqRange.start,
              end: reqRange.end,
            }),
          206
        );
        break;
      default:
        if (!http.response.headersSent) {
          http.response.setHeader('Content-Length', `${vRef.size}`);
        }
        respond(readableStream || fs.createReadStream(vRef.path), 200);
        break;
    }
  }

  async interceptDownload(http, file, versionName) {
    const gridFSBucket = await this.getGridFSBucket();

    const { gridFsFileId } = file.versions[versionName].meta || {};
    if (gridFsFileId) {
      const readStream = gridFSBucket.openDownloadStream(
        new ObjectID(gridFsFileId)
      );
      readStream.on('data', (data) => {
        http.response.write(data);
      });

      readStream.on('end', () => {
        http.response.end('end');
      });
      readStream.on('error', () => {
        // not found probably
        http.response.statusCode = 404;
        http.response.end('not found');
      });

      http.response.setHeader(
        'Content-Disposition',
        `inline; filename="${file.name}"`
      );
      http.response.setHeader(
        'Cache-Control',
        'public, max-age=31536000, s-maxage=31536000'
      );
    }
    return Boolean(gridFsFileId); // Serve file from either GridFS or FS if it wasn't uploaded yet
  }

  async onAfterRemove(files) {
    const gridFSBucket = await this.getGridFSBucket();

    files.forEach((file) => {
      Object.keys(file.versions).forEach((versionName) => {
        const { gridFsFileId } = file.versions[versionName].meta || {};
        if (gridFsFileId) {
          gridFSBucket.delete(new ObjectID(gridFsFileId), (err) => {
            if (err) throw err;
          });
        }
      });
    });
  }

  async getGridFSBucket() {
    const { mongo } = await MongoInternals.defaultRemoteCollectionDriver();
    const gridFSBucket = new GridFSBucket(mongo.db, {
      chunkSizeBytes: 1024,
      bucketName: this._name,
    });

    return gridFSBucket;
  }

  storeInGridFSBucket = async (file, buffer) => {
    const gridFSBucket = await this.getGridFSBucket();
    // Covert buffer to Readable Stream
    const readablePhotoStream = new Readable();
    readablePhotoStream.push(buffer);
    readablePhotoStream.push(null);
    // Move file to GridFS
    Object.keys(file.versions).forEach((versionName) => {
      const metadata = { ...file.meta, versionName, fileId: file._id };
      const uploadStream = gridFSBucket.openUploadStream(file.name, {
        contentType: file.type || 'binary/octet-stream',
        metadata,
      });
      readablePhotoStream.pipe(uploadStream);
      uploadStream.on('error', (err) => {
        console.error(err); // eslint-disable-line
        throw err;
      });
      uploadStream.on('finish', (ver) => {
        bound(() => {
          const property = `versions.${versionName}.meta.gridFsFileId`;
          this.update(file._id, {
            $set: { [property]: ver._id.toHexString() },
          });
        });
      });
    });
  };

  async write(buffer, opts: Options) {
    const fileId = opts.fileId || Random.id();
    const FSName = fileId;
    const fileName =
      opts.name || opts.fileName ? opts.name || opts.fileName : FSName;

    const { extension } = await getExtension(fileName, buffer);

    opts.type = await getMimeType(buffer);

    if (!helpers.isObject(opts.meta)) {
      opts.meta = {};
    }

    const size = opts.size || buffer.length;

    const result = dataToSchema({
      name: fileName,
      meta: opts.meta,
      type: opts.type,
      size,
      userId: opts.userId,
      collectionName: this._name,
      extension,
    });

    result._id = fileId;

    this.checkForSizeAndExtension({ size, extension });

    this.insert(result, async (err, _id) => {
      if (!err) {
        const fileRef = this.findOne(_id);
        await this.storeInGridFSBucket.call(this, fileRef, buffer);
      }
    });
    return result;
  }

  async load(itemUrl: string, opts: Options) {
    const fileId = opts.fileId || Random.id();
    const FSName = fileId;
    const pathParts = itemUrl.split('/');
    const fileName =
      opts.name || opts.fileName
        ? opts.name || opts.fileName
        : pathParts[pathParts.length - 1] || FSName;

    const response = await fetch(itemUrl, { headers: opts.headers || {} });
    if (!response.ok) throw new Error('URL provided responded with 404');
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const size = Buffer.byteLength(buffer);
    const { extension } = await getExtension(fileName, buffer);

    const result = dataToSchema({
      name: fileName,
      meta: opts.meta,
      type:
        opts.type ||
        response.headers['content-type'] ||
        (await getMimeType(buffer)),
      size: opts.size || size,
      userId: opts.userId,
      // eslint-disable-next-line no-underscore-dangle
      collectionName: this._name,
      extension,
    });
    // throws if not matching
    this.checkForSizeAndExtension({
      size: result.size,
      extension,
    });

    result._id = fileId;
    this.insert(result, async (err, _id) => {
      if (!err) {
        const fileRef = this.findOne(_id);
        await this.storeInGridFSBucket.call(this, fileRef, buffer);
      }
    });
    return result;
  }

  removeFiles(selector) {
    if (selector === undefined) {
      return 0;
    }
    const files = this.find(selector);

    if (!(files.count() > 0)) {
      throw new Meteor.Error(404, 'Cursor is empty, no files is removed');
    }

    const docs = files.fetch();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.remove(selector, async function () {
      await self.onAfterRemove(docs);
    });

    return this;
  }

  async insertWithRemoteBuffer({
    file: { name: fileName, type, size, buffer },
    meta = {},
    ...rest
  }) {
    const res = await this.write(buffer, {
      fileName,
      type,
      size,
      meta,
      ...rest,
    });
    return res;
  }

  async insertWithRemoteFile({ file, meta = {}, ...rest }) {
    const { stream, filename, mimetype } = await file;
    return new Promise((resolve, reject) => {
      const bufs: Uint8Array[] = [];
      stream.on('data', (d) => {
        bufs.push(d);
      });
      stream.on('end', async () => {
        const contentLength = bufs.reduce((sum, buf) => sum + buf.length, 0);
        const buf = Buffer.concat(bufs);
        try {
          const res = await this.write(buf, {
            fileName: filename,
            type: mimetype,
            size: contentLength,
            meta,
            ...rest,
          });
          resolve(res);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  async insertWithRemoteURL({ url: href, meta = {}, ...rest }) {
    const res = await this.load(href, {
      meta,
      ...rest,
    });
    return res;
  }
}

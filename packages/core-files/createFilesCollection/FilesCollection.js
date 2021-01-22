/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
import fs from 'fs';
import nodeQs from 'querystring';
import { MongoClient, GridFSBucket, ObjectID } from 'mongodb';
import { Mongo, MongoInternals } from 'meteor/mongo';
import { WebApp } from 'meteor/webapp';
import { Readable } from 'stream';
import write from './lib/write';
import load from './lib/load';
import { helpers, bound, NOOP, getUser, notFound } from './lib/helpers';

class FilesCollection extends Mongo.Collection {
  constructor({ collectionName, maxSize = 10485760, extensionRegex }) {
    super();
    this._name = collectionName;
    this.maxSize = maxSize;
    this.extensionRegex = new RegExp(extensionRegex);
    this.downloadRoute = '/cdn/storage';
    this.allowedOrigins = /^http:\/\/localhost:12[0-9]{3}$/;

    WebApp.connectHandlers.use(async (httpReq, httpResp, next) => {
      if (
        this.allowedOrigins &&
        httpReq._parsedUrl.path.includes(`${this.downloadRoute}/`) &&
        !httpResp.headersSent
      ) {
        if (this.allowedOrigins.test(httpReq.headers.origin)) {
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

      let uri;
      if (
        httpReq._parsedUrl.path.includes(`${this.downloadRoute}/${this._name}`)
      ) {
        uri = httpReq._parsedUrl.path.replace(
          `${this.downloadRoute}/${this._name}`,
          ''
        );
        if (uri.indexOf('/') === 0) {
          uri = uri.substring(1);
        }

        const uris = uri.split('/');
        if (uris.length === 3) {
          const params = {
            _id: uris[0],
            query: httpReq._parsedUrl.query
              ? nodeQs.parse(httpReq._parsedUrl.query)
              : {},
            name: uris[2].split('?')[0],
            version: uris[1],
          };

          const http = { request: httpReq, response: httpResp, params };

          if (await this.checkAccess(http)) {
            await this.download(http, uris[1], this.findOne(uris[0]));
          }
        } else {
          next();
        }
      } else {
        next();
      }
    });
  }

  checkForSizeAndExtension = ({ size, extension }) => {
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

  checkAccess = async (http) => {
    let result;
    const { user, userId } = await getUser(http);

    if (helpers.isFunction(this.protected)) {
      let fileRef;
      if (helpers.isObject(http.params) && http.params._id) {
        fileRef = this.findOne(http.params._id);
      }

      result = http
        ? this.protected.call(
            Object.assign(http, { user, userId }),
            fileRef || null
          )
        : this.protected.call({ user, userId }, fileRef || null);
    } else {
      result = !!userId;
    }

    if ((http && result === true) || !http) {
      return true;
    }

    const rc = helpers.isNumber(result) ? result : 401;

    if (http) {
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
    }

    return false;
  };

  async download(http, version = 'original', fileRef) {
    let vRef;

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
      if (this.downloadCallback) {
        if (
          !this.downloadCallback.call(
            Object.assign(http, getUser(http)),
            fileRef
          )
        ) {
          return notFound(http);
        }
      }

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

          return this.serve(
            http,
            fileRef,
            vRef,
            version,
            null,
            responseType || '200'
          );
        })
      );
      return undefined;
    }
    return notFound(http);
  }

  serve(
    http,
    fileRef,
    vRef,
    version = 'original',
    readableStream = null,
    _responseType = '200',
    force200 = false
  ) {
    let partiral = false;
    let reqRange = false;
    let dispositionType = '';
    let start;
    let end;
    let take;
    let responseType = _responseType;

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

    const headers = helpers.isFunction(this.responseHeaders)
      ? this.responseHeaders(responseType, fileRef, vRef, version, http)
      : this.responseHeaders;

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

  unlink(fileRef, version, callback) {
    if (version) {
      if (
        helpers.isObject(fileRef.versions) &&
        helpers.isObject(fileRef.versions[version]) &&
        fileRef.versions[version].path
      ) {
        fs.unlink(fileRef.versions[version].path, callback || NOOP);
      }
    } else if (helpers.isObject(fileRef.versions)) {
      // for (const vKey in fileRef.versions) {
      Object.keys(fileRef.versions).forEach((vKey) => {
        if (fileRef.versions[vKey] && fileRef.versions[vKey].path) {
          fs.unlink(fileRef.versions[vKey].path, callback || NOOP);
        }
      });
    } else {
      fs.unlink(fileRef.path, callback || NOOP);
    }
    return this;
  }

  async getGridFSBucket() {
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

    const gridFSBucket = new GridFSBucket(db, {
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
        const property = `versions.${versionName}.meta.gridFsFileId`;
        this.update(file._id, {
          $set: { [property]: ver._id.toHexString() },
        });
      });
    });
  };

  write = write;

  load = load;

  remove(selector, callback) {
    if (selector === undefined) {
      return 0;
    }
    const files = this.find(selector);

    if (files.count() > 0) {
      files.forEach((file) => {
        this.unlink(file);
      });
    } else {
      if (callback) {
        callback(new Meteor.Error(404, 'Cursor is empty, no files is removed'));
      }
      return this;
    }

    const docs = files.fetch();
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.remove(selector, async function (...args) {
      if (callback) {
        callback.apply(this, args);
      }
      await self.onAfterRemove(docs);
    });

    return this;
  }

  insertWithRemoteBuffer = async ({
    file: { name: fileName, type, size, buffer },
    meta = {},
    ...rest
  }) => {
    const res = await this.write(buffer, {
      fileName,
      type,
      size,
      meta,
      ...rest,
    });
    return res;
  };

  insertWithRemoteFile = async function insertWithRemoteFile({
    file,
    meta = {},
    ...rest
  }) {
    const { stream, filename, mimetype } = await file;
    return new Promise((resolve, reject) => {
      const bufs = [];
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
  };

  insertWithRemoteURL = async function insertWithRemoteURL({
    url: href,
    meta = {},
    ...rest
  }) {
    const res = await this.load(href, {
      meta,
      ...rest,
    });
    return res;
  };
}

export default FilesCollection;

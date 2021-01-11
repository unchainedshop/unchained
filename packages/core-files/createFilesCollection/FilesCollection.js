import fs from 'fs';
import { MongoClient, GridFSBucket, ObjectID } from 'mongodb';
import { Mongo, MongoInternals } from 'meteor/mongo';
import { WebApp } from 'meteor/webapp';
import write from './lib/write';
import load from './lib/load';
import {
  helpers,
  bound,
  NOOP,
  getUser,
  notFound,
  formatFileURL,
} from './lib/helpers';

class FilesCollection extends Mongo.Collection {
  constructor() {
    super();
    WebApp.connectHandlers.use((httpReq, httpResp, next) => {
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

          if (this.checkAccess(http)) {
            this.download(http, uris[1], this.findOne(uris[0]));
          }
        } else {
          next();
        }
      } else {
        next();
      }
    });
  }

  onBeforeUpload(file) {
    if (
      this.options.extensionRegex &&
      !this.options.extensionRegex.test(file.extension)
    ) {
      return 'filetype not allowed';
    }
    if (file.size > this.options.maxSize) {
      return 'file too big';
    }
    return true;
  }

  downloadRoute = '/cdn/storage';

  checkAccess = (http) => {
    let result;
    const { user, userId } = getUser(http);

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

  download(http, version = 'original', fileRef) {
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
        this.interceptDownload(http, fileRef, version) === true
      ) {
        return void 0;
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
      return void 0;
    }
    return notFound(http);
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
        // eslint-disable-next-line no-param-reassign
        http.response.statusCode = 404;
        http.response.end('not found');
      });

      http.response.setHeader(
        'Content-Disposition',
        `inline; filename="${file.name}"`
      );
      http.response.setHeader('Cache-Control', this.cacheControl);
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
      for (const vKey in fileRef.versions) {
        if (fileRef.versions[vKey] && fileRef.versions[vKey].path) {
          fs.unlink(fileRef.versions[vKey].path, callback || NOOP);
        }
      }
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

  onAfterUpload = async (file) => {
    const gridFSBucket = await this.getGridFSBucket();
    // Move file to GridFS
    Object.keys(file.versions).forEach((versionName) => {
      const metadata = { ...file.meta, versionName, fileId: file._id };
      fs.createReadStream(file.versions[versionName].path)
        .pipe(
          gridFSBucket.openUploadStream(file.name, {
            contentType: file.type || 'binary/octet-stream',
            metadata,
          })
        )
        .on('error', (err) => {
          console.error(err); // eslint-disable-line
          throw err;
        })
        .on('finish', (ver) => {
          const property = `versions.${versionName}.meta.gridFsFileId`;
          this.update(file._id, {
            $set: { [property]: ver._id.toHexString() },
          });
          this.unlink(this.findOne(file._id), versionName); // Unlink files from FS
        });
    });
  };

  write = write;

  load = load;

  remove(selector, callback) {
    if (selector === void 0) {
      return 0;
    }

    const files = this.find(selector);
    if (files.count() > 0) {
      files.forEach((file) => {
        this.unlink(file);
      });
    } else {
      callback &&
        callback(new Meteor.Error(404, 'Cursor is empty, no files is removed'));
      return this;
    }

    if (this.onAfterRemove) {
      const docs = files.fetch();
      const self = this;
      this.remove(selector, function () {
        callback && callback.apply(this, arguments);
        self.onAfterRemove(docs);
      });
    } else {
      this.remove(selector, callback || NOOP);
    }
    return this;
  }

  insertWithRemoteBuffer = async ({
    file: { name: fileName, type, size, buffer },
    meta = {},
    ...rest
  }) => {
    return new Promise((resolve, reject) => {
      try {
        this.write(
          buffer,
          {
            fileName,
            type,
            size,
            meta,
            ...rest,
          },
          (err, fileObj) => {
            if (err) return reject(err);
            return resolve(fileObj);
          },
          true // proceedAfterUpload
        );
      } catch (e) {
        reject(e);
      }
    });
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
      stream.on('end', () => {
        const contentLength = bufs.reduce((sum, buf) => sum + buf.length, 0);
        const buf = Buffer.concat(bufs);
        try {
          this.write(
            buf,
            {
              fileName: filename,
              type: mimetype,
              size: contentLength,
              meta,
              ...rest,
            },
            (err, fileObj) => {
              if (err) return reject(err);
              return resolve(fileObj);
            },
            true // proceedAfterUpload
          );
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
    return new Promise((resolve, reject) => {
      try {
        this.load(
          href,
          {
            meta,
            ...rest,
          },
          (err, fileObj) => {
            if (err) return reject(err);
            return resolve(fileObj);
          }
        );
      } catch (e) {
        reject(e);
      }
    });
  };

  link(fileRef, version = 'original', URIBase) {
    if (!fileRef) {
      return '';
    }
    return formatFileURL(fileRef, version, URIBase);
  }
}

export default FilesCollection;

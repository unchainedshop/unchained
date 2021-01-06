import { Mongo, MongoInternals } from 'meteor/mongo';
import fs from 'fs';
import { WebApp } from 'meteor/webapp';
import { MongoClient, GridFSBucket, ObjectID } from 'mongodb';
import write from './lib/write';
import load from './lib/load';
import { helpers, bound, NOOP } from './lib/helpers';

class FilesCollection extends Mongo.Collection {
  constructor() {
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

      if (
        !this.disableUpload &&
        httpReq._parsedUrl.path.includes(
          `${this.downloadRoute}/${this.collectionName}/__upload`
        )
      ) {
        if (httpReq.method !== 'POST') {
          next();
          return;
        }

        const handleError = (_error) => {
          let error = _error;
          console.warn('[FilesCollection] [Upload] [HTTP] Exception:', error);
          console.trace();

          if (!httpResp.headersSent) {
            httpResp.writeHead(500);
          }

          if (!httpResp.finished) {
            if (helpers.isObject(error) && helpers.isFunction(error.toString)) {
              error = error.toString();
            }

            if (!helpers.isString(error)) {
              error = 'Unexpected error!';
            }

            httpResp.end(JSON.stringify({ error }));
          }
        };

        let body = '';
        const handleData = () => {
          try {
            let opts;
            let result;
            let user;

            if (
              httpReq.headers['x-mtok'] &&
              this._getUserId(httpReq.headers['x-mtok'])
            ) {
              user = {
                userId: this._getUserId(httpReq.headers['x-mtok']),
              };
            } else {
              user = this._getUser({ request: httpReq, response: httpResp });
            }

            if (httpReq.headers['x-start'] !== '1') {
              opts = {
                fileId: httpReq.headers['x-fileid'],
              };

              if (httpReq.headers['x-eof'] === '1') {
                opts.eof = true;
              } else {
                opts.binData = Buffer.from(body, 'base64');
                opts.chunkId = parseInt(httpReq.headers['x-chunkid']);
              }

              const _continueUpload = this._continueUpload(opts.fileId);
              if (!_continueUpload) {
                throw new Meteor.Error(
                  408,
                  "Can't continue upload, session expired. Start upload again."
                );
              }

              ({ result, opts } = this._prepareUpload(
                Object.assign(opts, _continueUpload),
                user.userId,
                'HTTP'
              ));

              if (opts.eof) {
                this._handleUpload(result, opts, (_error) => {
                  let error = _error;
                  if (error) {
                    if (!httpResp.headersSent) {
                      httpResp.writeHead(500);
                    }

                    if (!httpResp.finished) {
                      if (
                        helpers.isObject(error) &&
                        helpers.isFunction(error.toString)
                      ) {
                        error = error.toString();
                      }

                      if (!helpers.isString(error)) {
                        error = 'Unexpected error!';
                      }

                      httpResp.end(JSON.stringify({ error }));
                    }
                  }

                  if (!httpResp.headersSent) {
                    httpResp.writeHead(200);
                  }

                  if (helpers.isObject(result.file) && result.file.meta) {
                    result.file.meta = fixJSONStringify(result.file.meta);
                  }

                  if (!httpResp.finished) {
                    httpResp.end(JSON.stringify(result));
                  }
                });
                return;
              }

              this.emit('_handleUpload', result, opts, NOOP);

              if (!httpResp.headersSent) {
                httpResp.writeHead(204);
              }
              if (!httpResp.finished) {
                httpResp.end();
              }
            } else {
              try {
                opts = JSON.parse(body);
              } catch (jsonErr) {
                console.error(
                  "Can't parse incoming JSON from Client on [.insert() | upload], something went wrong!",
                  jsonErr
                );
                opts = { file: {} };
              }

              if (!helpers.isObject(opts.file)) {
                opts.file = {};
              }

              opts.___s = true;
              this._debug(
                `[FilesCollection] [File Start HTTP] ${
                  opts.file.name || '[no-name]'
                } - ${opts.fileId}`
              );
              if (helpers.isObject(opts.file) && opts.file.meta) {
                opts.file.meta = fixJSONParse(opts.file.meta);
              }

              ({ result } = this._prepareUpload(
                helpers.clone(opts),
                user.userId,
                'HTTP Start Method'
              ));

              if (this.collection.findOne(result._id)) {
                throw new Meteor.Error(
                  400,
                  "Can't start upload, data substitution detected!"
                );
              }

              opts._id = opts.fileId;
              opts.createdAt = new Date();
              opts.maxLength = opts.fileLength;
              this._preCollection.insert(helpers.omit(opts, '___s'));
              this._createStream(
                result._id,
                result.path,
                helpers.omit(opts, '___s')
              );

              if (opts.returnMeta) {
                if (!httpResp.headersSent) {
                  httpResp.writeHead(200);
                }

                if (!httpResp.finished) {
                  httpResp.end(
                    JSON.stringify({
                      uploadRoute: `${this.downloadRoute}/${this.collectionName}/__upload`,
                      file: result,
                    })
                  );
                }
              } else {
                if (!httpResp.headersSent) {
                  httpResp.writeHead(204);
                }

                if (!httpResp.finished) {
                  httpResp.end();
                }
              }
            }
          } catch (httpRespErr) {
            handleError(httpRespErr);
          }
        };

        httpReq.setTimeout(20000, handleError);
        if (
          typeof httpReq.body === 'object' &&
          Object.keys(httpReq.body).length !== 0
        ) {
          body = JSON.stringify(httpReq.body);
          handleData();
        } else {
          httpReq.on('data', (data) =>
            bound(() => {
              body += data;
            })
          );

          httpReq.on('end', () =>
            bound(() => {
              handleData();
            })
          );
        }
        return;
      }

      if (!this.disableDownload) {
        let uri;

        if (!this.public) {
          if (
            httpReq._parsedUrl.path.includes(
              `${this.downloadRoute}/${this.collectionName}`
            )
          ) {
            uri = httpReq._parsedUrl.path.replace(
              `${this.downloadRoute}/${this.collectionName}`,
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
              if (
                this.interceptRequest &&
                helpers.isFunction(this.interceptRequest) &&
                this.interceptRequest(http) === true
              ) {
                return;
              }

              if (this._checkAccess(http)) {
                this.download(http, uris[1], this.findOne(uris[0]));
              }
            } else {
              next();
            }
          } else {
            next();
          }
        } else if (httpReq._parsedUrl.path.includes(`${this.downloadRoute}`)) {
          uri = httpReq._parsedUrl.path.replace(`${this.downloadRoute}`, '');
          if (uri.indexOf('/') === 0) {
            uri = uri.substring(1);
          }

          const uris = uri.split('/');
          let _file = uris[uris.length - 1];
          if (_file) {
            let version;
            if (_file.includes('-')) {
              version = _file.split('-')[0];
              _file = _file.split('-')[1].split('?')[0];
            } else {
              version = 'original';
              _file = _file.split('?')[0];
            }

            const params = {
              query: httpReq._parsedUrl.query
                ? nodeQs.parse(httpReq._parsedUrl.query)
                : {},
              file: _file,
              _id: _file.split('.')[0],
              version,
              name: _file,
            };
            const http = { request: httpReq, response: httpResp, params };
            if (
              this.interceptRequest &&
              helpers.isFunction(this.interceptRequest) &&
              this.interceptRequest(http) === true
            ) {
              return;
            }
            this.download(http, version, this.collection.findOne(params._id));
          } else {
            next();
          }
        } else {
          next();
        }
        return;
      }
      next();
    });
  }

  notFound(http) {
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
  }

  getUserId(xmtok) {
    if (!xmtok) return null;

    // throw an error upon an unexpected type of Meteor.server.sessions in order to identify breaking changes
    if (
      !Meteor.server.sessions instanceof Map ||
      !helpers.isObject(Meteor.server.sessions)
    ) {
      throw new Error('Received incompatible type of Meteor.server.sessions');
    }

    if (
      Meteor.server.sessions instanceof Map &&
      Meteor.server.sessions.has(xmtok) &&
      helpers.isObject(Meteor.server.sessions.get(xmtok))
    ) {
      // to be used with >= Meteor 1.8.1 where Meteor.server.sessions is a Map
      return Meteor.server.sessions.get(xmtok).userId;
    }
    if (
      helpers.isObject(Meteor.server.sessions) &&
      xmtok in Meteor.server.sessions &&
      helpers.isObject(Meteor.server.sessions[xmtok])
    ) {
      // to be used with < Meteor 1.8.1 where Meteor.server.sessions is an Object
      return Meteor.server.sessions[xmtok].userId;
    }

    return null;
  }

  getUser(http) {
    const result = {
      user() {
        return null;
      },
      userId: null,
    };

    if (http) {
      let mtok = null;
      if (http.request.headers['x-mtok']) {
        mtok = http.request.headers['x-mtok'];
      } else {
        const cookie = http.request.Cookies;
        if (cookie.has('x_mtok')) {
          mtok = cookie.get('x_mtok');
        }
      }

      if (mtok) {
        const userId = this.getUserId(mtok);

        if (userId) {
          result.user = () => db.collection('users').findOne(userId);
          result.userId = userId;
        }
      }
    }

    return result;
  }

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
      return this.notFound(http);
    }
    if (fileRef) {
      if (this.downloadCallback) {
        if (
          !this.downloadCallback.call(
            Object.assign(http, this.getUser(http)),
            fileRef
          )
        ) {
          return this.notFound(http);
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
            return this.notFound(http);
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
    return this.notFound(http);
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
}

export default FilesCollection;

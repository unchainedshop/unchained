import { Mongo } from 'meteor/mongo';
import nodePath from 'path';
import write from './lib/write';

class FilesCollection extends Mongo.Collection {
  storagePath = () => {
    return `assets${nodePath.sep}app${nodePath.sep}uploads${nodePath.sep}${this.collectionName}`;
  };

  write = write;

  insertWithRemoteBuffer = async ({
    file: { name: fileName, type, size, buffer },
    meta = {},
    ...rest
  }) => {
    // debugger;
    console.log('Object: ', this);
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

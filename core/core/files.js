import { FilesCollection } from 'meteor/ostrio:files';


FilesCollection.prototype.insertWithRemoteFile = async function insertWithRemoteFile({
  file, meta = {}, ...rest
}) {
  const {
    stream, filename, mimetype,
  } = await file;
  return new Promise((resolve, reject) => {
    const bufs = [];
    stream.on('data', (d) => {
      bufs.push(d);
    });
    stream.on('end', () => {
      const contentLength = bufs.reduce((sum, buf) => sum + buf.length, 0);
      const buf = Buffer.concat(bufs);
      try {
        this.write(buf, {
          fileName: filename,
          type: mimetype,
          size: contentLength,
          meta,
          ...rest,
        }, (err, fileObj) => {
          if (err) return reject(err);
          return resolve(fileObj);
        });
      } catch (e) {
        reject(e);
      }
    });
  });
};

FilesCollection.prototype.insertWithRemoteURL = async function insertWithRemoteURL({
  url: href, meta = {}, ...rest
}) {
  return new Promise((resolve, reject) => {
    try {
      this.load(href, {
        meta,
        ...rest,
      }, (err, fileObj) => {
        if (err) return reject(err);
        return resolve(fileObj);
      });
    } catch (e) {
      reject(e);
    }
  });
};

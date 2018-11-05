import { FilesCollection } from 'meteor/ostrio:files';


FilesCollection.prototype.insertWithRemoteFile = async function insertWithRemoteFile({
  file, meta = {}, ...rest
}) {
  const {
    stream, filename, mimetype, /* encoding, */
  } = await file;
  return new Promise((resolve, reject) => {
    try {
      this.write(stream, {
        fileName: filename,
        type: mimetype,
        // size,
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

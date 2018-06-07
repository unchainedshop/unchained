import { FilesCollection } from 'meteor/ostrio:files';

FilesCollection.prototype.insertWithRemoteBuffer = async function insertWithRemoteBuffer({
  file: {
    name: fileName, type, size, buffer,
  }, meta = {}, ...rest
}) {
  return new Promise((resolve, reject) => {
    try {
      this.write(buffer, {
        fileName,
        type,
        size,
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

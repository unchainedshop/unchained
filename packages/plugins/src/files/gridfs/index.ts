import mongodb from 'mongodb';

export const configureGridFSFileUploadModule = ({ db }) => {
  // eslint-disable-next-line
  let { GridFSBucket } = mongodb;

  return {
    createWriteStream: async (directoryName, fileId, fileName) => {
      const options = { bucketName: `file_uploads_${directoryName}` };
      const bucket = new GridFSBucket(db, options);
      return bucket.openUploadStreamWithId(fileId, fileName);
    },
    createReadStream: async (directoryName, fileId) => {
      const options = { bucketName: `file_uploads_${directoryName}` };
      const bucket = new GridFSBucket(db, options);
      return bucket.openDownloadStream(fileId);
    },
    removeFileFromBucket: async (directoryName, fileId) => {
      const options = { bucketName: `file_uploads_${directoryName}` };
      const bucket = new GridFSBucket(db, options);
      return bucket.delete(fileId);
    },
  };
};

import mongodb from 'mongodb';

export const configureGridFSFileUploadModule = ({ db }) => {
  return {
    createWriteStream: async (directoryName, fileId, fileName) => {
      const options = { bucketName: `file_uploads_${directoryName}`, chunkSizeBytes: 5 * 1024 * 1024 };
      const bucket = new mongodb.GridFSBucket(db, options);
      return bucket.openUploadStreamWithId(fileId, fileName);
    },
    createReadStream: async (directoryName, fileId) => {
      const options = { bucketName: `file_uploads_${directoryName}`, chunkSizeBytes: 5 * 1024 * 1024 };
      const bucket = new mongodb.GridFSBucket(db, options);
      return bucket.openDownloadStream(fileId);
    },
  };
};

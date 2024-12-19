import { mongodb } from '@unchainedshop/mongodb';

export const configureGridFSFileUploadModule = ({ db }) => {
  // eslint-disable-next-line
  let { GridFSBucket } = mongodb;

  return {
    createWriteStream: async (directoryName, fileId, fileName, metadata) => {
      const options = { bucketName: `file_uploads_${directoryName}` };
      const bucket = new GridFSBucket(db, options);
      return bucket.openUploadStreamWithId(fileId, fileName, { metadata });
    },
    getFileInfo: async (directoryName, fileId) => {
      const options = { bucketName: `file_uploads_${directoryName}` };
      const bucket = new GridFSBucket(db, options);
      return bucket.find({ _id: fileId }).next();
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

export type GridFSFileUploadsModule = ReturnType<typeof configureGridFSFileUploadModule>;

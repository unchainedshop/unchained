import { mongodb } from '@unchainedshop/mongodb';

export const configureGridFSFileUploadModule = ({ db }) => {
  // eslint-disable-next-line
  let { GridFSBucket } = mongodb;

  return {
    createWriteStream: async (
      directoryName,
      fileId,
      fileName,
      uploadOptions: mongodb.GridFSBucketWriteStream['options'],
    ) => {
      const options = { bucketName: `file_uploads_${directoryName}` };
      const bucket = new GridFSBucket(db, options);

      if (fileId) {
        try {
          // Try removing the target if it already exists
          await bucket.delete(fileId);
        } catch {
          /* */
        }
      }

      return bucket.openUploadStreamWithId(fileId, fileName, uploadOptions);
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

export default {
  gridfsFileUploads: {
    configure: configureGridFSFileUploadModule,
  },
};

export interface GridFSFileUploadsModule {
  gridfsFileUploads: ReturnType<typeof configureGridFSFileUploadModule>;
}

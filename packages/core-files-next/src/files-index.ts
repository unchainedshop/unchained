import { FileDirector } from './director/FileDirector';

export { configureFilesModule } from './module/configureFilesModule';
export { fileServices } from './service/fileServices';

const {
  getFileAdapter,
  setFileAdapter,
  removeFiles,
  registerFileUploadCallback,
  getFileUploadCallback,
  uploadFileFromStream,
  uploadFileFromURL,
  createSignedURL,
} = FileDirector;

export {
  getFileAdapter,
  setFileAdapter,
  removeFiles,
  registerFileUploadCallback,
  getFileUploadCallback,
  uploadFileFromStream,
  uploadFileFromURL,
  createSignedURL,
};

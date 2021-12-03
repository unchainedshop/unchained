import { FileDirector } from './director/FileDirector';

export { configureFilesModule } from './module/configureFilesModule';
export { fileServices } from './service/fileServices';

const {
  getFileAdapter,
  setFileAdapter,
  removeFiles,
  uploadFileFromStream,
  uploadFileFromURL,
  createSignedURL,
} = FileDirector;

export {
  getFileAdapter,
  setFileAdapter,
  removeFiles,
  uploadFileFromStream,
  uploadFileFromURL,
  createSignedURL,
};

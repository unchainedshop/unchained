import { FileDirector } from './director/FileDirector';

const {
  // Adapter
  getFileUploadAdapter,
  setFileUploadAdapter,
  // Upload
  createSignedURL,
  getFileUploadCallback,
  registerFileUploadCallback,
  removeFiles,
  uploadFileFromStream,
  uploadFileFromURL,
} = FileDirector;

export {
  getFileUploadAdapter,
  setFileUploadAdapter,
  removeFiles,
  registerFileUploadCallback,
  getFileUploadCallback,
  uploadFileFromStream,
  uploadFileFromURL,
  createSignedURL,
};

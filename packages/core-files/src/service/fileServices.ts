import { FileServices } from '@unchainedshop/types/files.js';
import { linkFileService } from './linkFileService.js';
import { createSignedURLService } from './createSignedURLService.js';
import { uploadFileFromURLService } from './uploadFileFromURLService.js';
import { uploadFileFromStreamService } from './uploadFileFromStreamService.js';
import { removeFilesService } from './removeFilesService.js';
import { createDownloadStreamService } from './createDownloadStreamService.js';

export const fileServices: FileServices = {
  linkFile: linkFileService,
  createSignedURL: createSignedURLService,
  uploadFileFromURL: uploadFileFromURLService,
  uploadFileFromStream: uploadFileFromStreamService,
  removeFiles: removeFilesService,
  createDownloadStream: createDownloadStreamService,
};

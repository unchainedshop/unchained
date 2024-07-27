import { LinkFileService, linkFileService } from './linkFileService.js';
import { CreateSignedURLService, createSignedURLService } from './createSignedURLService.js';
import { UploadFileFromURLService, uploadFileFromURLService } from './uploadFileFromURLService.js';
import {
  UploadFileFromStreamService,
  uploadFileFromStreamService,
} from './uploadFileFromStreamService.js';
import { RemoveFilesService, removeFilesService } from './removeFilesService.js';
import {
  CreateDownloadStreamService,
  createDownloadStreamService,
} from './createDownloadStreamService.js';

export interface FileServices {
  linkFile: LinkFileService;
  uploadFileFromStream: UploadFileFromStreamService;
  uploadFileFromURL: UploadFileFromURLService;
  createSignedURL: CreateSignedURLService;
  removeFiles: RemoveFilesService;
  createDownloadStream: CreateDownloadStreamService;
}

export const fileServices: FileServices = {
  linkFile: linkFileService,
  createSignedURL: createSignedURLService,
  uploadFileFromURL: uploadFileFromURLService,
  uploadFileFromStream: uploadFileFromStreamService,
  removeFiles: removeFilesService,
  createDownloadStream: createDownloadStreamService,
};

import { FileServices } from '@unchainedshop/types/files';
import { linkFileService } from './linkFileService';
import { createSignedURLService } from './createSignedURLService';
import { uploadFileFromURLService } from './uploadFileFromURLService'
import { uploadFileFromStreamService } from './uploadFileFromStreamService'

export const fileServices: FileServices = {
  linkFile: linkFileService,
  createSignedURL: createSignedURLService,
  uploadFileFromURL: uploadFileFromURLService,
  uploadFileFromStream: uploadFileFromStreamService,
};

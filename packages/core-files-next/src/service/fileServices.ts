import {
  linkFileService,
  LinkFileService,
} from './linkFileService';

export interface FileServices {
  linkFileService: LinkFileService;
}

export const fileServices: FileServices = {
  linkFileService,
};

import { UserServices } from '@unchainedshop/types/user.js';
import { getUserCountryService } from './getUserCountryService.js';
import { getUserLanguageService } from './getUserLanguageService.js';
import { updateUserAvatarAfterUploadService } from './updateUserAvatarAfterUploadService.js';

export const userServices: UserServices = {
  getUserCountry: getUserCountryService,
  getUserLanguage: getUserLanguageService,
  updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService,
};

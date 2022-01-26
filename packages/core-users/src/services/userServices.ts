import { UserServices } from '@unchainedshop/types/user';
import { getUserCountryService } from './getUserCountryService';
import { getUserLanguageService } from './getUserLanguageService';
import { updateUserAvatarAfterUploadService } from './updateUserAvatarAfterUploadService';

export const userServices: UserServices = {
  getUserCountry: getUserCountryService,
  getUserLanguage: getUserLanguageService,
  updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService,
};

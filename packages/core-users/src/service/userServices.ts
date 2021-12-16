import {
  getUserCountryService,
  GetUserCountryService,
} from './getUserCountryService';

import {
  getUserLanguageService,
  GetUserLanguageService,
} from './getUserLanguageService';

import {
  updateUserAvatarAfterUploadService,
  UpdateUserAvatarAfterUploadService,
} from './updateUserAvatarAfterUploadService';

export interface UserServices {
  getUserCountry: GetUserCountryService;
  getUserLanguage: GetUserLanguageService;
  updateUserAvatarAfterUpload: UpdateUserAvatarAfterUploadService;
}

export const userServices: UserServices = {
  getUserCountry: getUserCountryService,
  getUserLanguage: getUserLanguageService,
  updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService,
};

import { getUserCountryService } from './getUserCountryService.js';
import { getUserLanguageService } from './getUserLanguageService.js';
import { updateUserAvatarAfterUploadService } from './updateUserAvatarAfterUploadService.js';
import { migrateUserDataService } from './migrateUserDataService.js';

export const userServices = {
  getUserCountry: getUserCountryService,
  getUserLanguage: getUserLanguageService,
  updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService,
  migrateUserData: migrateUserDataService,
};

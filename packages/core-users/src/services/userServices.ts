import { getUserLanguageService } from './getUserLanguageService.js';
import { updateUserAvatarAfterUploadService } from './updateUserAvatarAfterUploadService.js';
import { migrateUserDataService } from './migrateUserDataService.js';

export const userServices = {
  getUserLanguage: getUserLanguageService,
  updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService,
  migrateUserData: migrateUserDataService,
};

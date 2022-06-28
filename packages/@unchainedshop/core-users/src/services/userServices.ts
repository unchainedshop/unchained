import { UserServices } from '@unchainedshop/types/user';
import { getUserCountryService } from './getUserCountryService';
import { getUserLanguageService } from './getUserLanguageService';
import { getUserRoleActionsService } from './getUserRoleActionsService';
import { updateUserAvatarAfterUploadService } from './updateUserAvatarAfterUploadService';

export const userServices: UserServices = {
  getUserCountry: getUserCountryService,
  getUserLanguage: getUserLanguageService,
  getUserRoleActions: getUserRoleActionsService,
  updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService,
};

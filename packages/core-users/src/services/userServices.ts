import {
  updateUserAvatarAfterUploadService,
  UpdateUserAvatarAfterUploadService,
} from './updateUserAvatarAfterUploadService.js';
import { migrateUserDataService, MigrateUserDataService } from './migrateUserDataService.js';

export interface UserServices {
  updateUserAvatarAfterUpload: UpdateUserAvatarAfterUploadService;
  migrateUserData: MigrateUserDataService;
}

export const userServices: UserServices = {
  updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService,
  migrateUserData: migrateUserDataService,
};

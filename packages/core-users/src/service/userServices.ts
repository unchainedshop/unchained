import {
  updateUserAvatarAfterUploadService,
  UpdateUserAvatarAfterUploadService,
} from './updateUserAvatarAfterUploadService';

export interface UserServices {
  updateUserAvatarAfterUpload: UpdateUserAvatarAfterUploadService;
}

export const userServices: UserServices = {
  updateUserAvatarAfterUpload: updateUserAvatarAfterUploadService,
};
